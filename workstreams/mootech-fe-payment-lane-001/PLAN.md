# MuMate v2 — Payment lane provable before launch

**Workstream:** `mootech-fe-payment-lane-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Make the MuMate v2 payment lane provably able to take real money and deliver
what was bought, before `/v2` is opened to the public.

The owner's committed outcome, stated on 2026-09-08:

> ระบบ payment และ การตัดแต้ม ตัดเวลา ต่าง ๆ ในการ payment ของลูกค้าจะต้อง
> ถูกต้อง ครบถ้วน — ต้องจ่ายเงินจริงได้ก่อน ถึงจะปล่อยจริง

This is the first live dogfood lane for the Owner Operating Contract v0.1
Experimental, as `ciel-owner-operating-contract-001` slice 1 recorded in its
next action. Issues outside this lane that neither block real money nor create
serious risk are deferred, not fixed.

The lane's own tickets are `mojisejr/mootech-fe#605` (payment gateway handover)
and `mojisejr/mootech-fe#606` (v1 to v2 cutover, which gates itself on #605).
This plan does not restate them; it records what CIEL executes against them and
what the owner authorized.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | the payment lane, its screens, migrations, and deploys | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `ciel-os` | this plan and its events | `.` |

`mootech-be` is read for evidence only. No change to it is authorized here.

## Authority boundary

- Merging to `mootech-fe` `main` is a production deploy. Every merge is an
  owner action; the agent prepares the pull request and its proof.
- Writes to the production database, and any change that starts real money
  moving, require explicit owner authorization per instance. Read-only queries
  against production were authorized on 2026-09-08 for this workstream.
- The owner authorized installing Omise live keys **only after** `/v2` is
  provably closed to the public. If that condition is not met, the keys are not
  installed and the agent says so rather than proceeding.
- No secret value is ever written into a repository file, event, pull request,
  or report. Only names, locations, and mode prefixes are recorded.

## Correction recorded against this plan

Slice 1 was executed before this plan and its decision event existed. The
agent went from Wake straight to Execute on a live production defect and
skipped Align and Plan. The owner caught it. The slice's work and evidence are
real and were verified on production, but the ordering was wrong, and this plan
records that rather than presenting slice 1 as though it had been planned first.

## Execution slices and acceptance criteria

### 1. Close the public exposure of the v2 payment lane

The `/v2` preview gate was removed inside `mootech-fe` commit `c959aa8`
("rebuild /v2/destiny to Figma parity"), one bullet among twelve files, and
reached production at 2026-09-08 20:24 +07. Omise v2 on production is still in
test mode and nothing in the money lane checks the gateway mode, so any signed-in
visitor could pay with an Omise test card and receive a real `member_subscription`
row or real engine QI, written into the same tables as paying customers.

Restore the gate to its pre-`c959aa8` state, keep the unrelated fix that shipped
after it, and record why it must not be hand-removed again.

Slice 1 is done when, on production: every `/v2` payment screen redirects to the
gate, `/api/v2/*` answers 401 without the cookie, and both controls still answer
401 rather than the gate — the Omise webhook and the reconciler cron, whose
exemptions live inside the restored guard.

### 2. Make the goods survive a failure the money already survived

Two defects let a correct-looking success hide a customer who got nothing.

- A failed QI grant is unrecoverable. `settleAndProvision` sets `APPROVED`
  inside the transaction and fires the engine grant after it; a failure writes
  two log lines and returns, and the reconciler only ever scans `PENDING`.
  Give the reconciler a row to find, using the engine's existing idempotency on
  `ref = charge_id` so a retry can never double-credit.
- Both cron jobs answer HTTP 200 with the maintenance page while maintenance
  mode is on, so Vercel records success while nothing runs. The reconciler is
  the only thing that recovers a paid charge whose webhook was lost, and the
  cutover turns maintenance on deliberately.

Also make `/v2` able to fall under maintenance at launch without losing the
payment-lane CSP, because `#606` step order assumes it can and the shipped code
made it impossible.

Slice 2 is done when a failed QI grant becomes a row a later reconciler run
repairs, proven by a test that reddens when the retry is removed; the cron paths
answer their own 401 rather than the maintenance page; and the CSP still covers
the payment lane with `/v2` no longer short-circuiting the maintenance gate.

### 3. Bring production data and the DB-backed proofs up to the code

`0018` (Mumate Pro monthly, 199 baht) is on `main` and its shop toggle is live,
but the production row still reads `amount = 0, is_active = false`, so the
screen offers something the till refuses. Slice 2 adds `0019`. Both are
operator-gated and money-affecting.

The five DB-backed payment suites are `describe.skipIf(!TEST_DATABASE_URL)` and
the pre-push lane does not run them, so the webhook, reconciler, discount race,
and subscription writer have never been exercised against a real Postgres in the
normal loop. Run them once against the local arena before real money.

Slice 3 is done when the production package rows match the applied migrations,
verified by reading them back, and the five suites have been run green against
the local test database. They are not added to the pre-push gate.

### 4. Prove real money end to end

Install the Omise live keys, including the live webhook signing secret — which
is not a string of our choosing, because the verifier base64-decodes it and it
differs per mode. Then prove, on production and in this order: the dynamic
per-charge webhook arrives with no static endpoint present (`#374`), a card
charge settles, a declined card releases its hold, a PromptPay charge settles, a
QI pack credits the buyer's balance in the engine, and a refund takes the
entitlement back.

Slice 4 is done when each of those is observed on production with live keys and
recorded, and the QI check reads the buyer's engine balance rather than the row.

## Deferred in this lane

Not blocking real money and not serious: `#401` `#443` `#453` `#473` `#480`
`#488` `#504` `#514` `#388`; the sales-copy tickets `#471` `#517` `#535` `#545`
`#555` `#557` `#382`; the unbuilt `#362` `#366` `#378` `#410` `#464`; `#597`,
where the route guard exists and only its test is missing; `#407`, whose safe
workaround is never pointing the suites at a database holding real rows; and
`#582` with the duplicate `0006_` filename, which is a merge-time trap rather
than a money defect.

## Rollback contract

Every step is a forward change. The gate is restored by code and can be removed
again through `#606` B3 by unsetting one variable. Migrations are additive and
re-runnable. Live keys are replaced by reinstalling the test keys and
redeploying. No history is rewritten and no production row is deleted.
