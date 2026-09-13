# MuMate v2 — Beam Checkout as the second payment gateway, Omise as rollback

**Workstream:** `mootech-fe-beam-gateway-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.4
**Execution phase:** 1
**Execution state:** executing
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
`origin/pdf-dev` `099dbc7`, and Beam docs spec v1.24.0. Re-checked at the
start of execution against `main` `0742ca9` (2026-09-13 evening): the diff
`e57827a..0742ca9` over `lib/payment`, `pages/api/v2/payment`,
`pages/api/cron`, `middleware.ts`, `lib/db/schema.ts`, `lib/qi`,
`features/v2-shop` is empty, so every citation below still holds; the
application base for this lane is `0742ca9`. Every `path:line` is
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

**A local arena already exists and is the test environment of this lane.**
`testenv/` boots the three apps against a docker Postgres 17 with
self-signed SSL on `:5433` (`mumate_test`), restored from a prod dump that
`anonymize.sql` scrubs before any app connects; `guard.sh` refuses Supabase
and Neon hosts, real LINE/Google OAuth works because `http://localhost:3000`
is a registered redirect URI, and `line-stub.mjs` (`:3200`) stands in for
LINE (`testenv/README.md`). Port map: fe `:3000`, be `:4000`, bazi `:3100`
from the `bazi-testenv` worktree, pg `:5433`. Vercel Preview is **not** used:
its scope holds no payment secrets and its database is unverified, and the
arena already covers everything short of live money. Beam reaches the arena
through a `cloudflared` quick tunnel (`cloudflared` 2026.3.0 and Docker 28 are
installed on the owner's machine).

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

## Decisions — recorded 2026-09-13

**D1 · Card path = ข) Beam Payment Links; PromptPay stays in-app.** The owner
chose the hosted page over negotiating a CVV/3DS exemption with Beam. Cards
never touch our server (SAQ A): `createCardCharge` creates a single-use
Payment Link (`order.netAmount`, `order.referenceId = orderId`, `expiresAt`
= now + 15 min, `redirectUrl` = `/v2/shop/result?state=PAYING&order=…`,
`cancelUrl` = checkout, `collectPhoneNumber: false`, `linkSettings` card only)
and returns its `url` as `authorizeUri`, which `pay-destination.ts:116`
already opens as a top-level navigation (`X-Frame-Options: DENY` forbids an
iframe anyway). The row holds `link:<id>` until `payment_link.paid` arrives;
the webhook resolves the real charge with
`GET /api/v1/charges?source_in=PAYMENT_LINK&sourceId=<id>` and rewrites
`charge_id` to `ch_…` so refund and reconcile keep working by charge id. The
reconciler must therefore not skip `link:` rows (only `pending:` is a
placeholder today, `lib/payment/reconcile.ts:46-48`); the Beam adapter's
`retrieveCharge` branches on the prefix and asks
`GET /api/v1/payment-links/{id}` (`PAID | EXPIRED | DISABLED | …`). No
publishable key and no browser tokenizer are needed under ข.

What ข gives up: the in-app card form (`CardForm.tsx`, `card-rules.ts`) is
removed from the v2 path; the card page shows Beam's hosted design with the
store name and logo set in Lighthouse. Partial refunds stay out of scope.

**D2 · The Beam merchant account belongs to the company.** The owner is a
Developer on it (creates API keys and webhooks); Account Owner stays with the
company. Playground access is a notification to Beam, not a negotiation.

**D3 · Purchase pause = the existing `/ops/packages` `is_active` toggle.**
Immediate, no deploy, zero code; a runbook lists every sellable
`package_code` (four tiers plus QI packs). A one-click "pause all" in `/ops`
is added only if the slice-5 rollback rehearsal shows the clicks are a risk.
The env-flag option is dropped: on Vercel it needs a redeploy and is slower
than what exists.

## Execution slices and acceptance criteria

### 1. Wire the seam, without changing what production does

Add `lib/payment/select-gateway.ts` reading `PAYMENT_GATEWAY` (`omise` when
unset) and route the four direct imports through it. Add migration `0027` —
`v2_payment.gateway text NOT NULL DEFAULT 'omise'` — written by
`insertPendingReserved`, and make the reconciler ask the adapter named on the
row. Add `pages/api/v2/payment/webhook-beam.ts` as a second raw-body route with
the same two middleware exemptions as the Omise one (`middleware.ts:252`
inside `guardV2`, `:374` in the maintenance allow-list — exact match, not
prefix) so both gateways can receive events at once. No pause flag is
built (D3). Stale text at `middleware.ts:229` ("Omise v2 is still
in TEST mode") is corrected in the same change.

Slice 1 is done when: with `PAYMENT_GATEWAY` unset the full payment suite is
green and a diff of production behaviour is empty; `0027` is applied to the
dev database and to production by the owner (additive, re-runnable); a test
reddens if `webhook-beam` loses either exemption; the reconciler test proves
an Omise row is never sent to the Beam adapter and vice versa; and a runbook entry
names every `package_code` the `/ops/packages` pause must touch.

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

The arena runs with `PAYMENT_GATEWAY=beam`, `BEAM_MERCHANT_ID`,
`BEAM_API_KEY`, `BEAM_WEBHOOK_HMAC_KEY` (all Playground) added to the local
`.env` that `stack.sh up` swaps in — never to the committed `testenv/env/*` —
and `QI_GRANT_SECRET` shared with the local bazi on `:3100`. Each session
`cloudflared tunnel --url http://localhost:3000` yields a `trycloudflare.com`
URL; the Playground webhook is pointed at
`https://<that>/api/v2/payment/webhook-beam` for the session (Beam retries up
to ten times, so a dropped tunnel loses nothing that a re-run cannot replay).

Slice 2 is done when: the docs' signature vector passes and a one-byte body
change fails it; on the arena a Playground PromptPay charge → Force Charge →
`charge.succeeded` sets the row `APPROVED` and the local engine answers the QI
grant; a duplicate delivery, a `charge.failed` after `charge.succeeded`, and a
`charge.succeeded` arriving after our own expiry-abandon each leave the row in
the state the current Omise tests already require; the reconciler settles a
Beam `SUCCEEDED` row whose webhook was withheld; and `refund.succeeded` for a
full amount revokes while a smaller amount changes nothing.

### 3. Beam card path through Payment Links (D1 = ข)

`createCardCharge` creates the Payment Link described under D1 and returns
its `url` as `authorizeUri`; the `token` argument becomes unused for Beam.
`webhook-beam` learns `payment_link.paid`: resolve the charge by
`source_in=PAYMENT_LINK&sourceId`, rewrite the row's `charge_id` from
`link:<id>` to the `ch_…` id, then settle through the unchanged
`settleAndProvision`. `retrieveCharge` handles `link:` ids by reading the
link status; the reconciler stops treating only `pending:` as placeholder
and includes `link:` rows. Refund of a card purchase goes by the resolved
`ch_…` id exactly as for PromptPay.

Slice 3 is done when, on Playground through the arena: the success card on the
hosted page → `payment_link.paid` → row `APPROVED` with `charge_id` rewritten
to `ch_…`; the OTP card with `123456` → `APPROVED`, with a wrong OTP the link
stays unpaid and our expiry abandons the row; decline and insufficient-funds
cards leave the link unpaid and the row ends `REJECT` via expiry with the
`failureCode` read from the link's charges; the cancel button returns the user
to checkout with the hold released; `refund.succeeded` on a link-originated
charge revokes; and a `payment_link.paid` replay changes nothing.

### 4. Screens, CSP and branding

`checkout.tsx` drops the card form and tokenizer (card is a redirect under ข),
`QrScreen` accepts the data URI (already allowed by `img-src data:`), CSP on
the three shop paths replaces the Omise origins with `api.beamcheckout.com`
(`middleware.ts:181,193,195`), copy and logo in `PlanPaySuccess.tsx:90`,
`QiBuySuccess.tsx:75`, `checkout.tsx:163-170` say Beam. `omise.js` stays in
`_document.tsx:19` while v1 still uses it; removing it belongs to `#606`.

Slice 4 is done when the team completes the full shop flow on the arena
(through the tunnel URL, or a short-lived Supabase branch plus Vercel Preview
if the team wants a URL that outlives one session — optional, deleted after)
for PromptPay and card, `csp-payment-path` and the
`check-omise-key-inlined` gate are green for the Beam configuration, and no
screen names Omise on a Beam-settled order.

### 5. Production flip and live proof

Owner installs Beam production keys and registers the production webhook
(different HMAC key) in Lighthouse and sets the store name and logo shown on
the hosted card page; `PAYMENT_GATEWAY=beam` on Vercel
Production; Omise variables stay in place. Then, as owner actions: one live
PromptPay purchase and one live card purchase at the smallest price the catalog
allows, each observed through webhook → `APPROVED` → entitlement/QI; one full
refund observed through `refund.succeeded` → `gateway_reversed`; one withheld
webhook recovered by the reconciler on a Beam row while Omise rows from the
same day reconcile untouched.

Slice 5 is done when all five observations are recorded with timestamps, the
rollback (`PAYMENT_GATEWAY=omise`, redeploy, purchases paused for the window)
has been rehearsed once on the arena, and seven days of production show no
`PENDING` row older than the reconcile window on either gateway.

## Work order while Beam credentials are pending

Authorized by the owner on 2026-09-13 evening ("ทำยาวๆ จนถึงจุดที่ต้องรอทีม"):

1. **Slice 1 to completion** on `feat/beam-gateway-seam` from `0742ca9`,
   opened as a draft pull request. It needs no Beam credential and changes no
   production behaviour.
2. **Slices 2 and 3 coded and unit-tested ahead**, each on its own branch
   stacked on the previous (`feat/beam-gateway-promptpay`,
   `feat/beam-gateway-card-links`), also as draft pull requests. Their unit
   tests use the docs' signature vector and payload fixtures; their acceptance
   criteria close **only** on the arena run with Playground credentials and
   stay open until then. `scripts/beam-smoke.ts` ships with slice 2 so the
   arena run is a command, not a rediscovery.
3. **Slice 4 prepared** behind `PAYMENT_GATEWAY=beam` where it does not
   disturb the Omise path; branding copy waits for a settled Beam order to
   look at.
4. Runbooks written: purchase pause (D3), gateway rollback, Playground
   session (tunnel + webhook), dispute revoke by hand.

Nothing merges to `main` without the owner. A draft pull request per slice
keeps the review surface small and the stack rebaseable if `main` moves.

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
- Card data never reaches our server (D1 = ข); a change that would route PAN
  or CVV through `mootech-fe` needs a new owner decision, not a code review.
- Slices 2–4 run against the arena database only; `guard.sh` refusing a
  Supabase or Neon host is the control, and a run found pointing at production
  stops the slice. A Supabase branch, if used for UAT, is schema-only (no
  "Include data") and deleted when the session ends.
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

whether `redirectUrl` (Payment Links) or `returnUrl` receives any query
params · numeric rate limits and
webhook response timeout · webhook egress IPs · whether several endpoints per
environment are supported · maximum charge amount · settlement schedule that
applies to a new Checkout merchant (pricing page says weekly T+2, help centre
says daily T+1/T+3) · dispute flow beyond `TransactionType: CHARGEBACK` ·
`expiryTime` still accepted or `expiresAt` only · whether a Payment Link
can be restricted to card only through `linkSettings` on an account whose
default includes other methods · whether Playground accepts an
`http://localhost:3000` `redirectUrl`/`returnUrl` (if not, the tunnel URL is
used and the result page must carry the session on that host).

## Rollback contract

Every slice is additive and forward. `PAYMENT_GATEWAY` unset or `omise`
restores today's behaviour exactly; `0027` is a defaulted column and is never
dropped; both webhook routes stay registered so a Beam event arriving after a
rollback still settles or revokes its own row; rows carry their gateway so the
reconciler never asks the wrong provider; purchases are paused for the
redeploy window from `/ops/packages` (D3). No production row is deleted and no history rewritten.
