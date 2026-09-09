# MuMate v2 — Payment lane provable before launch

**Workstream:** `mootech-fe-payment-lane-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.4
**Execution phase:** 5
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

`mootech-be` is out of scope in revision 0.3. It may be read for evidence when
a v2 question needs it, and nothing in it is changed.

## Authority boundary

- Merging to `mootech-fe` `main` is a production deploy. Every merge is an
  owner action; the agent prepares the pull request and its proof.
- Writes to the production database, and any change that starts real money
  moving, require explicit owner authorization per instance. Read-only queries
  against production were authorized on 2026-09-08 for this workstream.
- The owner authorized installing Omise live keys **only after** `/v2` is
  provably closed to the public. If that condition is not met, the keys are not
  installed and the agent says so rather than proceeding.
- `mootech-be` and the v1 payment path are outside this lane. Work that exists
  only to keep v1 taking money is not this lane's work. If something in v2 turns
  out to need `mootech-be`, that dependency is established here first and the
  owner decides before anything is changed there.
- No secret value is ever written into a repository file, event, pull request,
  or report. Only names, locations, and mode prefixes are recorded.

## Corrections recorded against this plan

**Slice 1.** Executed before this plan and its decision event existed. The agent
went from Wake straight to Execute on a live production defect and skipped Align
and Plan. The owner caught it. The work and evidence are real and were verified
on production, but the ordering was wrong, and this plan records that rather
than presenting slice 1 as though it had been planned first.

**Slice 4, revision 0.2.** The same thing happened again, and worse. The owner
asked whether `#480` should be repaired before launch and decided yes. `#480`
was sitting in this plan's own **deferred** list, so that decision changed the
plan — and the agent executed it, plus an unrelated stale end-to-end spec,
before revising the plan or recording the decision. The owner caught it again.

Twice is a pattern, not a slip. The failure mode is specific: the agent treats
an owner's answer inside a conversation as sufficient authority to act, and
records it afterwards as narration. An owner answer is authority to *decide*;
this plan and a decision event are where that authority becomes executable, and
they come first. Recorded here rather than turned into a new mechanism — CIEL
already has the vocabulary, and adding a gate would be the meta-optimization
`OWNER.md` warns about.

## Scope narrowed in revision 0.3

The owner decided on 2026-09-09 that v1 is being retired and that `/v2` is what
ships. Revision 0.2 was written for a world where both lanes take money from one
Omise account at the same time, and several of its judgements only make sense in
that world. This revision narrows the plan to v2 rather than leaving the reader
to work out which parts still apply.

**What the narrowing rests on.** The v2 money lane is entirely inside
`mootech-fe`: the browser talks only to same-origin `/api/v2/payment/*`, and the
only hosts the lane reaches outward are `api.omise.co` and the bazi engine at
`BAZI_BASE_URL`, which credits a QI purchase. Settlement, provisioning, and the
reconciler reach Postgres directly. Nothing in the lane calls `mootech-be`. That
was read out of the code on 2026-09-09 and recorded.

**What it changes.** `#374` exists because one Omise account has a single static
webhook per mode and v1 already owns the live one, so v2's charges had to carry
their own endpoint or the two lanes would collide. With v1 retired nothing
contends for that line, and the account's live static webhook can point at the
v2 endpoint directly. The unanswered question — whether the account's pinned
`api_version` `2019-05-29` supports per-charge `webhook_endpoints` — therefore
stops being a launch blocker. It is still worth an answer, because the
per-charge design is the better one and the code refuses to charge without it
configured, but the lane no longer waits on it.

**What it does not change.** Retiring v1 is a decision about the payment lane,
not about the backend: `mootech-fe` still calls `mootech-be` for several flows
that are not money. "Drop v1" must not be read as "shut down Render" without a
separate account of what v2 still depends on, and that account is not this
plan's work.

## What revision 0.4 answers to

Two things happened after revision 0.3 was written, and both change what this
lane must do rather than merely adding to it.

**The webhook's root cause was found, and it is our code.** Omise's
`Omise-Signature` header may carry more than one signature, comma-separated;
`verifyOmiseSignature` compares the whole header as a single 64-character hex
string behind a length check, so a two-signature header is refused before any
comparison happens. Rolling a webhook secret is what produces two: the previous
secret stays valid for twenty-four hours and every delivery inside that window
is signed with both. The account holder rolled at 11:02 on 2026-09-09, and every
delivery since has answered 401. The header format was read from the vendor's
own documentation on 2026-09-09, not inferred from the symptom — which is the
step the whole day had skipped.

This is not a new slice. It is slice 5's first acceptance criterion — the
webhook arrives and is accepted — finally having a cause.

**`mootech-fe#614` merged to `main` at 15:33 on 2026-09-09 and reached
production.** It was not this lane's work and most of it is not this lane's
business, but it touched the money lane in three places, and one of those is a
live disagreement between code and data. Revision 0.4 records those three and
defers the rest by name.

The owner decided on 2026-09-09 that this lane finishes before anything from
`#614` is taken up, unless `#614` blocks it. It does not block it: migrations
`0005` upward are hand-applied SQL chosen one file at a time — the drizzle
journal stops at `0004`, and each DB-backed suite reads the files it needs by
name — so `0020` can be applied to production without `0021` or `0022` riding
along on the same pass.

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

**Changed by `#614`.** The maintenance allow-list now exempts
`/api/v2/payment/webhook` alongside the cron paths — the hole `#606` B1 warned
about, where the launch deletes `guardV2`, the webhook falls through to the
maintenance gate, answers HTTP 200, and Omise reads that as delivered and never
retries. It was written outside this lane. This plan verifies it rather than
claiming it, and does not rewrite it.

### 3. Bring production data and the DB-backed proofs up to the code

**Closed once, and reopened by `#614`.** Slice 3 was delivered on 2026-09-08 at
revision 0.1: `0018` and `0019` were applied to production a whole file at a
time and read back, `0016` and `0017` were established as already applied, the
row counts were unchanged at 12 / 22 / 29, and the five database-backed suites
ran 72 green against a local arena. Everything this plan knows about the
production rows comes from that closeout.

`#614` reopens it, and not hypothetically. That closeout read all four QI pack
rows back as **35, 99, 219 and 449**, active. `#614` then shipped
`lib/payment/catalog.ts` granting **90/300/900/2,100** with bonuses
**0/45/260/816**, and `0020` — which would move `QI_500` to 249 and `QI_1200`
to 499 — has not been applied. The buy screen takes its quantity from the code
and its price from the row, and `grantQiPurchase` credits by the code. So
production sells 900 QI for 219 baht and 2,100 QI for 449 right now.

The preview gate is closed, so no public buyer can reach it, and that is the
only reason this is a plan item and not an incident. It is exactly the
"ตัดแต้มไม่ถูกต้อง" the owner's committed outcome names. The rows are read back
again before `0020` is applied, because the last read was 2026-09-08 and someone
else has been in this repository since.

The five DB-backed payment suites are `describe.skipIf(!TEST_DATABASE_URL)` and
the pre-push lane does not run them, so the webhook, reconciler, discount race,
and subscription writer have never been exercised against a real Postgres in the
normal loop. Run them once against the local arena before real money.

Slice 3 is done when the production package rows match the code that is on
production — `0018`, `0019` and `0020` accounted for, each either applied or
recorded as already true — verified by reading the rows back rather than by
trusting the migration files, and when the five suites have been run green
against the local test database. They are not added to the pre-push gate.

### 4. Repair what the payment screens promise

Promoted out of this plan's deferred list by an explicit owner decision on
2026-09-09, after evidence that the affected path is not rare: of the four real
PromptPay charges on production, three ended `expired` — so three of four real
users of that method saw the screen `#480` is about.

`QR_MAYBE_EXPIRED` names two actions and draws one button, stranding whichever
reader needed the missing one. The row cannot drop either action, because it is
the one row that does not know which of two people is reading it: someone who
never paid and needs a fresh QR, or someone whose money already left and whose
row the reconciler is still working through.

Also repair the browser-truth specs that cover this lane. They are run by hand,
nobody had run them since the Figma-parity rebuild, and one assertion for a
settled charge was looking for a screen that no longer renders — a red spec on
the money lane hides the next real regression behind it.

Slice 4 is done when the screen draws every action its words name, proven by a
test that reddens when the fix is removed and by a photograph at the widths the
ticket names, and when the lane's browser-truth specs pass again.

### 5. Prove real money end to end

Rewritten in revision 0.3 for a v2-only account, and authorized on 2026-09-09
once the account holder produced a working live key pair.

**The account, read on 2026-09-09 with the new key.** `GET /account` answers
`200`, `livemode` is true, and the account's live static webhook already points
at the v2 endpoint — the account holder moved it. `GET /capability` reports both
`card` and `promptpay` enabled. The last live charge on the account is dated
2026-08-17, so v1 has taken no real money for three weeks and moving that
webhook cost nothing.

Because the account's live static webhook now points at v2, `#374` cannot be
proven by this slice: an event would arrive whether or not the per-charge
mechanism works. That is the same objection revision 0.2 raised about the
test-mode line, and it now applies to live. The slice therefore records the
static webhook's state alongside the observation rather than claiming the
per-charge path was what delivered.

**Two things must ship before the money moves.**

- The live key pair, the live webhook signing secret, and nothing else, into the
  three production variables that still hold test values. The public key is
  inlined at build time, so this needs a real rebuild and not a cache reuse; the
  postbuild guard fails the build if the value is not in the bundle.
- The PromptPay QR lifetime, raised from five minutes to fifteen. Under five
  minutes the lane is 0 for 2 on production: both charges carrying a
  `charge_expires_at` expired, and the only PromptPay success this product has
  ever had was created while the lifetime was still Omise's 24-hour default.
  Proving the QR lane with real money under a window that has never once worked
  would measure the window, not the lane.

Then prove, on production with the preview gate still closed, in this order: the
webhook arrives and is accepted, a card charge settles, a PromptPay charge
settles, a QI pack credits the buyer's balance in the engine, and a refund takes
the entitlement back.

**Where slice 5 stands on 2026-09-09.** Real money moved twice, both charges
settled, and both credited QI that was read back from the engine's own wallet.
Both were settled by the reconciler and not by a webhook, because no webhook has
ever been accepted by this endpoint. The refund proof has not been attempted.
What remains is the webhook and then the refund, in that order.

**The webhook fix.** Split the `Omise-Signature` header on commas, decode each
candidate from hex, and accept the delivery when any of them matches the digest.
Three details are deliberate rather than incidental. The comparison moves to
decoded bytes instead of hex text, because the specification promises nothing
about hex case. Each candidate is trimmed, because the specification says
nothing about whitespace after the comma. The loop neither stops at the first
match nor assumes exactly two, because the specification promises neither. The
length check stays, moved inside the loop, because `timingSafeEqual` throws on
unequal lengths.

Every existing test of this verifier builds its own single-signature header, so
the suite is green against a shape the vendor stops sending the moment a secret
is rolled. A green suite is what let this defect reach production. The fix needs
a header carrying two signatures in both orders, one carrying only a wrong
signature, one with whitespace after the comma, and one in upper-case hex — each
reddening when the split is removed.

**The window the fix has to be proven in.** The twenty-four hour grace from the
11:02 roll closes at about 11:02 on 2026-09-10. After that Omise sends one
signature again and the unfixed code would begin answering 200 on its own. That
is a trap and not a remedy: the fault would look repaired and would return at
the next roll, which is exactly when somebody is already handling a security
event. It also means a delivery Omise genuinely signed with two signatures can
only be observed before that hour — unless the account holder rolls again, which
would work, because the value production holds becomes the expiring half of the
new pair, but which then obliges installing the newer secret inside its own
twenty-four hours or every delivery 401s again.

**What the 401s do not yet prove.** No raw `Omise-Signature` header from a real
delivery has been read. The defect in our code is certain and the vendor's
specification is now first-hand, but that this defect produced today's seven
401s is inference from timing rather than observation, and one competing
explanation survives it: that the installed secret is simply not the one the
account signs with. A self-signed probe cannot tell those apart, because both
sides of that test carry the same value — the 11:47 record already conceded
this about itself. Logging the header's length and its comma count at the 401
branch costs nothing, leaks no secret and no PII, and settles the question on
the next delivery. The fix is necessary either way; only its sufficiency is in
doubt.

**Two proofs are shaped by what the code and the account actually allow.**

- The refund proof uses a **membership** package. `revokeByChargeId` returns
  early for `tier_code = 'QI'` — taking granted QI back is an undecided policy,
  not an oversight — so a QI refund would prove nothing about entitlement.
- A declined card releasing its hold is **not** claimed by this slice. Live mode
  refuses test card numbers, and producing a genuine decline on a real card is
  not something this lane can arrange reliably. It moves to the deferred list
  with its reason, rather than being quietly dropped from the acceptance check.

Slice 5 is done when each of those is observed on production with live keys and
recorded; when the QI check reads the buyer's balance through the engine rather
than a row, because a row that says granted is not a balance the buyer has — and
no QI pack has ever been bought through this lane, in any mode, so that call has
never run from a real charge; and when the static webhook's state at the time of
the webhook observation is recorded alongside it, so a later reader can tell
that the per-charge mechanism was not what the observation proved.

## Deferred in this lane

Not blocking real money and not serious: `#401` `#443` `#453` `#473`
`#488` `#504` `#514` `#388`; the sales-copy tickets `#471` `#517` `#535` `#545`
`#555` `#557` `#382`; the unbuilt `#362` `#366` `#378` `#410` `#464`; `#597`,
where the route guard exists and only its test is missing; `#407`, whose safe
workaround is never pointing the suites at a database holding real rows; and
`#582` with the duplicate `0006_` filename, which is a merge-time trap rather
than a money defect; and, added in revision 0.3, **proving that a declined card
releases its hold**, because live mode refuses test card numbers and this lane
cannot reliably arrange a genuine decline on a real card. It is deferred with its
reason rather than dropped from slice 5's acceptance check in silence.

`#480` was on that list in revision 0.1 and the owner took it off on
2026-09-09. Deferral is a judgement about blocking and harm, and the owner
holds it; the evidence that changed it is in slice 4.

Added in revision 0.4, from `#614`, by the owner's decision on 2026-09-09 that
this lane finishes first: the `/ops` admin surface and its `OPS_ADMIN_SECRET`,
migrations `0021` and `0022`, the destiny cache and birth merge, and the
manifest and chat changes.

The `/ops` surface earns a note rather than silence. It grants tier and adjusts
QI without money moving, which is money-adjacent even though it is not this
lane's objective, and whether it must be covered before launch is an owner
decision this plan does not make. Deferring it is defensible rather than merely
convenient because its gate fails closed when `OPS_DASHBOARD_KEY` is unset and
every mutation writes to `ops_audit_log`. `OPS_ADMIN_SECRET` must be set on both
`mootech-fe` and the engine or the admin actions that reach the engine fail
closed — the same two-ended shape as the `QI_GRANT_SECRET` gap found on the
morning of 2026-09-09, recorded here so it is not rediscovered as an incident.

Also recorded and deferred: `mootech-be` carries the identical signature defect,
ported line for line, and would break the same way the first time anyone rolls a
secret while it is taking money. Revision 0.3's boundary puts it outside this
lane.

## Rollback contract

Every step is a forward change. The gate is restored by code and can be removed
again through `#606` B3 by unsetting one variable. Migrations are additive and
re-runnable. Live keys are replaced by reinstalling the test keys and
redeploying. No history is rewritten and no production row is deleted.
