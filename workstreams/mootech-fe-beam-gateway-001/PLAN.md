# MuMate v2 — Beam Checkout as the second payment gateway, Omise as rollback

**Workstream:** `mootech-fe-beam-gateway-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Put Beam Checkout behind the existing v2 payment port so that the MuMate v2
shop takes real money through Beam — PromptPay and card — with Omise kept
installed and selectable as the rollback, and prove it with a live charge and a
live refund before anything else depends on it.

The owner's direction, stated on 2026-09-13:

> focus ตอนนี้คือ Beam payment gateway ก่อน เรื่องย้าย server เอาไว้ก่อน …
> ใจผมอยากจะต่อ payment ใหม่ก่อน เพราะว่าเราจ่ายเงินจริงแล้ว และย้ายไปทีเดียว
> เลยจะสะดวกกว่า

Two facts the owner supplied the same day change the ground this plan stands
on, and both are recorded as owner statements rather than re-verified here:
Omise on production now runs **live keys** and the payment lane has been
**proven end to end with real money** (`mootech-fe#605` ⓪-1 is stale). That is
why Omise is this plan's rollback and not merely its predecessor.

This plan succeeds `mootech-fe-payment-lane-001` (Omise proven through slice 6,
refund revoking observed 2026-09-09) and precedes the server move recorded in
`mootech-fe#637`, which is **deferred** by the owner until this lane is live.
Nothing in `#637` is executed by this plan.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | the payment lane: port, adapters, routes, webhook, reconciler, screens, migrations | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `bazi-sft-dataset` | the engine that receives the QI grant after settlement; read and verified, not changed | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `ciel-os` | this plan and its events | `.` |

`mootech-be` is out of scope. Its v1 Omise path keeps taking money as it does
today and nothing in it is changed by this lane.

## Starting evidence

Measured 2026-09-13 against `mootech-fe` `main` `e57827a`, engine
`origin/pdf-dev` `099dbc7`, and Beam docs spec v1.24.0. Every `path:line` is
in `mootech-fe` unless stated.

**The port already exists and the money core never sees the gateway.**
`lib/payment/gateway.ts:32-59` — `createCardCharge`, `createPromptPayCharge`,
`verifyWebhook`, `retrieveCharge`. `settleAndProvision`, `revokeByChargeId`,
the reconciler and the QI grant treat `charge_id` as opaque text; nothing
asserts the `chrg_` prefix; uniqueness is `uq_v2_payment_charge_id` alone
(`lib/db/schema.ts:798`). The port, the Omise adapter and the webhook route are
byte-identical between `60709da` and `e57827a`.

**But the seam is not wired.** Four files import the Omise singleton directly —
`pages/api/v2/payment/charge.ts:6`, `promptpay.ts:5`, `webhook.ts:9`,
`pages/api/cron/reconcile-payment.ts:17` — and no env selects a gateway.
Three things leak past the port: card tokenization in the browser
(`features/v2-shop/omise-token.ts:73-103` via `cdn.omise.co/omise.js`), the
PromptPay QR delivered as an image URL on `api.omise.co`
(`QrScreen.tsx:75`), and the webhook's header names and event JSON shape
(`webhook.ts:33-34`, `gateway.ts:84-115`).

**`v2_payment` does not know which gateway created a row**
(`schema.ts:754-806`, no `gateway` column). The reconciler asks one adapter
about every `PENDING` row; during a two-gateway period Omise answers `null` for
a Beam id and the row stays `PENDING` until the seven-day window drops it
(`lib/payment/reconcile-run.ts:109`). Latest migration is `0026`; `0006` and
`0022` are duplicated numbers; next free is `0027`.

**No single purchase pause exists.** The only non-global stop is
`payment_package.is_active` per package from `/ops/packages`
(`lib/ops/packages.ts:76-83`), enforced before any charge
(`lib/payment/catalog.ts:116-117`). `MAINTENANCE_MODE` is site-wide.

**Vercel Preview cannot charge today** — the Preview scope holds no
`OMISE_SECRET_KEY`, `OMISE_WEBHOOK_SECRET`, `QI_GRANT_SECRET` or
`RECONCILE_ENABLED` (`.env.preview.local` key names). Which database Preview
points at is not verified.

**The engine's grant is gateway-agnostic.** `lib/qi/grant.ts:33-43` posts
`ref = chargeId`; the engine replays idempotently on
`bazi_ledger_txn(reason, ref)` (`src/app/api/qi/grant/route.ts:64-74`) with
`ref` ≤ 200 chars. `qi_granted_at` (`0019`) and the retry pass already exist.

**Beam answers the port, with three departures from Omise.**

| Port need | Beam (docs v1.24.0) | Departure |
|---|---|---|
| card token in browser | `POST /client/v1/card-tokens` with publishable key, CORS `*`, fields `pan, expiryMonth, expiryYear, cardHolderName` | **no CVV at tokenization**; a `CARD_TOKEN` charge needs `securityCode` sent from our server unless Beam grants a CVV/3DS exemption |
| server charge | `POST /api/v1/charges`, satang, `referenceId` ≤ 100, `x-beam-idempotency-key` (12 h), `201` even when the payment fails | create response carries no `status`/`amount`; fetch the charge for those |
| 3DS | `actionRequired: REDIRECT` → `redirect.redirectUrl` → our `returnUrl` | return query params undocumented; `/v2/shop/result` already trusts only `/api/v2/payment/status`, so this costs nothing |
| PromptPay QR | `actionRequired: ENCODED_IMAGE` → `encodedImage{imageBase64Encoded, rawData, expiry}`; `qrPromptPay.expiresAt` (spec; prose still says `expiryTime`) | data URI instead of a hosted image URL; QR expiry is best-effort and the charge can stay `PENDING` forever — we already self-expire from `charge_expires_at` |
| webhook | `charge.succeeded`, `charge.failed`, `refund.succeeded`, `refund.failed`; `X-Beam-Signature` = base64(HMAC-SHA256(base64-decode(key), raw body)); payload is the bare resource, no event id or timestamp; ≤ 10 retries, duplicates and reordering expected | dashboard-registered only, one HMAC key per environment; our DB-arbitered idempotency already covers the missing event id |
| reconcile | `GET /api/v1/charges/{id}` → `PENDING \| SUCCEEDED \| FAILED`; poll with backoff, `429` otherwise | no `expired`/`reversed` status; expiry is ours, reversal arrives only as `refund.succeeded` |
| refund | `POST /api/v1/refunds`; partial only on `CARD`; refundable `CARD, CARD_INSTALLMENTS, QR_PROMPT_PAY, ALIPAY, WECHAT_PAY` | **no chargeback or dispute event or API** — `TransactionType: CHARGEBACK` exists only as a ledger type |

Sandbox: Playground has its own base URL, Lighthouse, keys and HMAC key; test
cards cover success, OTP (`123456`), Force-Charge page, decline, insufficient
funds and two refund-failure cards; every non-card method returns
`ENCODED_IMAGE` plus a Force-Charge page whose **Mark as Succeeded** button
emits a real `charge.succeeded` webhook. No live money is needed until slice 5.

Commercial (marketing and help-centre, not contract): cards 1.80% non-premium,
PromptPay "from free", e-wallets 2.20%, +7% VAT on fees; settlement daily
T+1 QR / T+3 cards or weekly; individuals may register (QR + mobile banking
only until KYM), companies need DBD ≤ 90 days, บอจ.5, ภ.พ.20, signatory IDs;
review "1–3 business days"; Playground access and the publishable key are
granted on request via LINE `@beamcheckout`. The team's own notes mention a
2C2P migration meeting (`docs/profile-qi-build-plan.md:68`); this plan does not
compare providers, it executes the owner's choice.

## Decisions the owner holds before slice 3

**D1 · Card path and PCI scope.** With Omise, CVV never touched our server
(SAQ A-EP). With Beam `CARD_TOKEN`, CVV must pass through
`/api/v2/payment/charge` unless Beam approves a CVV/3DS exemption, and a server
that transmits CVV is inside PCI scope (SAQ D). Three ways out, none chosen
here:

- **ก) accept the pass-through** — smallest code change, largest compliance
  change; CVV is never logged or stored, but the server is in scope.
- **ข) cards through Beam Payment Links** — hosted page, `X-Frame-Options: DENY`
  so it is a top-level redirect that `pay-destination.ts:116` already handles;
  PromptPay stays in-app through the Charges API. Keeps SAQ A. Costs a second
  code path: `POST /api/v1/payment-links`, `payment_link.paid`, and the charge
  looked up by `source_in=PAYMENT_LINK&sourceId=`.
- **ค) ask Beam for the exemption during onboarding** — if granted, ก) with no
  CVV at all; if refused, fall to ข).

Recommendation: ask ค) on day one because it is one question; build slice 2
(PromptPay) either way; decide ก/ข from Beam's answer before slice 3 starts.

**D2 · Who owns the Beam merchant account.** The same question the owner
settled for DigitalOcean on 2026-09-13 (company, not the developer). Payouts,
KYM documents, Lighthouse roles and the production HMAC key follow the answer.
An individual account is enough for slice 2 in Playground; slice 5 needs the
account that will actually receive the money.

**D3 · What "paused" means during a flip.** Either keep using `/ops/packages`
`is_active` (exists, four rows plus QI packs, no deploy) or add a single
`PURCHASES_PAUSED` flag checked in `charge-flow` (slice 1, ~15 lines). The plan
proposes the flag because a rollback at 02:00 should be one switch, not five.

## Execution slices and acceptance criteria

### 1. Wire the seam, without changing what production does

Add `lib/payment/select-gateway.ts` reading `PAYMENT_GATEWAY` (`omise` when
unset) and route the four direct imports through it. Add migration `0027` —
`v2_payment.gateway text NOT NULL DEFAULT 'omise'` — written by
`insertPendingReserved`, and make the reconciler ask the adapter named on the
row. Add `pages/api/v2/payment/webhook-beam.ts` as a second raw-body route with
the same two middleware exemptions as the Omise one (`middleware.ts:252`
inside `guardV2`, `:374` in the maintenance allow-list — exact match, not
prefix) so both gateways can receive events at once. Add the purchase-pause
flag if D3 chooses it. Stale text at `middleware.ts:229` ("Omise v2 is still
in TEST mode") is corrected in the same change.

Slice 1 is done when: with `PAYMENT_GATEWAY` unset the full payment suite is
green and a diff of production behaviour is empty; `0027` is applied to the
dev database and to production by the owner (additive, re-runnable); a test
reddens if `webhook-beam` loses either exemption; the reconciler test proves
an Omise row is never sent to the Beam adapter and vice versa; and the pause
flag, if built, returns the same 400 the catalog gate returns today.

### 2. Beam adapter for PromptPay, webhook and reconcile — headless

`lib/payment/beam-gateway.ts` implementing the port: `createPromptPayCharge`
→ `QR_PROMPT_PAY` with `expiresAt` = now + 15 min, returning the QR as a
`data:image/png;base64,` URI in `qrDownloadUri`, `expiresAt` from
`encodedImage.expiry`, `referenceId = orderId`, idempotency key = orderId;
`retrieveCharge` mapping `SUCCEEDED → paid/successful`, `FAILED → failed`,
`PENDING → pending`; `verifyWebhook` per the docs' test vector (base64 HMAC
over raw bytes, key base64-decoded, constant-time compare, fail closed).
`parseBeamEvent(rawBody, headers)` normalises `charge.succeeded`,
`charge.failed`, `refund.succeeded` into the existing `ChargeEvent` so
`isSettleable`, `isTerminalFailure`, `isRefund` and every predicate test stay
untouched. A `scripts/beam-smoke.ts` drives Playground from a laptop.

Preview scope gains `PAYMENT_GATEWAY=beam`, `BEAM_MERCHANT_ID`, `BEAM_API_KEY`,
`BEAM_WEBHOOK_HMAC_KEY` (Playground), `QI_GRANT_SECRET` matching the engine
that `BAZI_BASE_URL` points at, and a `DATABASE_URL` that is **not
production**. The Playground webhook is registered against the preview URL of
a fixed branch.

Slice 2 is done when: the docs' signature vector passes and a one-byte body
change fails it; on preview a Playground PromptPay charge → Force Charge →
`charge.succeeded` sets the row `APPROVED` and the dev engine answers the QI
grant; a duplicate delivery, a `charge.failed` after `charge.succeeded`, and a
`charge.succeeded` arriving after our own expiry-abandon each leave the row in
the state the current Omise tests already require; the reconciler settles a
Beam `SUCCEEDED` row whose webhook was withheld; and `refund.succeeded` for a
full amount revokes while a smaller amount changes nothing.

### 3. Beam card path — shape decided by D1

Under ก/ค: `features/v2-shop/beam-token.ts` posts to `/client/v1/card-tokens`
with the publishable key; `createCardCharge` sends `CARD_TOKEN` (+
`securityCode` only under ก), maps `REDIRECT` to `authorizeUri` and
`returnUrl` to `/v2/shop/result?state=PAYING&order=…`. Under ข:
`createCardCharge` creates a Payment Link with `order.referenceId = orderId`,
returns its `url` as `authorizeUri`, and `webhook-beam` learns
`payment_link.paid` plus the charge lookup by `sourceId`.

Slice 3 is done when, on Playground through preview: success card →
`APPROVED`; OTP card with `123456` → `APPROVED`, with a wrong OTP → `REJECT`;
decline and insufficient-funds cards → `REJECT` with the Beam `failureCode`
on the row; the two refund-failure cards leave the entitlement in place and
log loudly; and under ก the request log is proven to contain no `securityCode`.

### 4. Screens, CSP and branding

`checkout.tsx` swaps the tokenizer (or drops the card form under ข),
`QrScreen` accepts the data URI (already allowed by `img-src data:`), CSP on
the three shop paths replaces the Omise origins with `api.beamcheckout.com`
(`middleware.ts:181,193,195`), copy and logo in `PlanPaySuccess.tsx:90`,
`QiBuySuccess.tsx:75`, `checkout.tsx:163-170` say Beam. `omise.js` stays in
`_document.tsx:19` while v1 still uses it; removing it belongs to `#606`.

Slice 4 is done when the team completes the full shop flow on preview behind
`V2_PREVIEW_KEY` for PromptPay and card, `csp-payment-path` and the
`check-omise-key-inlined` gate are green for the Beam configuration, and no
screen names Omise on a Beam-settled order.

### 5. Production flip and live proof

Owner installs Beam production keys and registers the production webhook
(different HMAC key) in Lighthouse; `PAYMENT_GATEWAY=beam` on Vercel
Production; Omise variables stay in place. Then, as owner actions: one live
PromptPay purchase and one live card purchase at the smallest price the catalog
allows, each observed through webhook → `APPROVED` → entitlement/QI; one full
refund observed through `refund.succeeded` → `gateway_reversed`; one withheld
webhook recovered by the reconciler on a Beam row while Omise rows from the
same day reconcile untouched.

Slice 5 is done when all five observations are recorded with timestamps, the
rollback (`PAYMENT_GATEWAY=omise`, redeploy, purchases paused for the window)
has been rehearsed once on preview, and seven days of production show no
`PENDING` row older than the reconcile window on either gateway.

## Sequence with the server move

Payment first, then one move: the owner's stated preference, and the plan
agrees for four measured reasons — Omise live gives a real rollback for the
first time; the webhook is registered against the domain, not the host, so it
survives the move; the two lanes touch disjoint files (`lib/payment`,
`features/v2-shop`, CSP versus `Dockerfile`, `next.config.mjs`, workflows) and
may run in parallel; and the live proof belongs on the host that will serve
it, so proving Beam on Vercel and re-smoking with Playground keys on the new
host is one proof plus one smoke, not two proofs. `#637` P3 and this plan's
slice 5 never flip on the same day.

## Authority boundary

- Merging to `mootech-fe` `main` is a production deploy and an owner action.
- Installing Beam production keys, flipping `PAYMENT_GATEWAY` on Production,
  applying `0027` to production, registering the production webhook, and every
  live charge or refund are owner actions per instance.
- CVV pass-through (D1 ก) is a compliance decision the owner makes explicitly;
  the agent does not ship it under a default.
- Preview deployments used by slices 2–4 must point at a non-production
  database; a preview found pointing at production stops the slice.
- Omise stays installed and selectable until a later plan retires it; this
  plan removes no Omise code, variable or webhook.
- No secret value enters a repository file, event, pull request or report;
  Beam request ids (`x-beam-request-id`) may be logged, card data may not.

## Out of scope

The server move (`#637`) and DO provisioning; `mootech-be` and the v1 Omise
path; recurring billing, saved cards, CIT/MIT; mobile banking, e-wallets,
installments, BNPL; partial refunds; dispute handling beyond a runbook entry;
retiring Omise from v2; provider comparison against 2C2P or others.

## Open questions to Beam (asked at onboarding, answers recorded here)

CVV/3DS exemption criteria for `CARD_TOKEN` · whether `returnUrl` receives any
query params · card-token lifetime and id format · numeric rate limits and
webhook response timeout · webhook egress IPs · whether several endpoints per
environment are supported · maximum charge amount · settlement schedule that
applies to a new Checkout merchant (pricing page says weekly T+2, help centre
says daily T+1/T+3) · dispute flow beyond `TransactionType: CHARGEBACK` ·
`expiryTime` still accepted or `expiresAt` only.

## Rollback contract

Every slice is additive and forward. `PAYMENT_GATEWAY` unset or `omise`
restores today's behaviour exactly; `0027` is a defaulted column and is never
dropped; both webhook routes stay registered so a Beam event arriving after a
rollback still settles or revokes its own row; rows carry their gateway so the
reconciler never asks the wrong provider; purchases can be paused for the
redeploy window (D3). No production row is deleted and no history rewritten.
