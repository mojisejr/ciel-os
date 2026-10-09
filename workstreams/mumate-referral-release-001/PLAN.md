# MuMate — referral retry fix through the first release after the server move

**Workstream:** `mumate-referral-release-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** 1
**Execution state:** executing
**Parallelism:** none

## Objective and owner intent

Fix referral-code collisions and prove the existing build-and-release path
after MuMate moved to DigitalOcean: reviewed code, named images, staging
acceptance, owner-authorized production release, verification and rollback
readiness. The owner requested opening this workstream on 2026-10-09 after
reviewing the diagnosis and proposed DoD. Opening the plan does not authorize
either execution slice or a production release. The later owner go authorized slice 1; on 2026-10-09 the owner accepted proceeding past unrelated baseline lint failures and delegated merge, staging and production release if staging proves readiness. This revision records that conditional production authority.

The product fix is the main line. Workflow changes are considered only if an
observed blocker prevents this release; optional CI or infrastructure improvements
are deferred. This is a use of the existing release procedure, not a new platform.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `bazi-sft-dataset` | referral GET fix, regression tests, container build; integration branch `pdf-dev` | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `mootech-fe` | unchanged FE commit selected for release; authenticated referral and invite acceptance | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `mumate-infra` | existing container release, staging gate, verification and rollback runbooks | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and semantic checkpoints | `.` |

## Starting evidence and uncertainty

- Caddy recorded `GET /api/referral` returning 500 at 2026-10-09 08:31:53
  Bangkok, request ID `1b2b21a9-b2ea-4bce-8742-cde78d34e9f0`, body size 237
  bytes; a second nearby request had the same status and size.
- The read-only host check found healthy FE `83ed2f10a6649874a32dfbfcec9c02220a2b5b52`
  and bazi `40e8ebf7db0e574b3352c2a745ab04a3b110f04e`. These are the investigation
  baseline, not a promise that these will still be the selected release pair.
- At bazi `40e8ebf`, `src/app/api/referral/route.ts` creates a code on GET
  for a member without one. The generator has 900 possibilities. A read-only
  production query found 204 allocated codes, the expected columns, the two
  unique indexes, INSERT privilege and no application trigger on that table.
- The insert handles only an `anon_id` conflict. Its catch checks `error.code`,
  whereas the installed Drizzle wraps PostgreSQL's `23505` under `error.cause`.
  A local simulation using the installed Drizzle stopped after one attempt and
  produced a 237-byte error response. This proves the retry defect; a collision
  is the strongest explanation for the reported request, not a recovered
  historical exception. Its response body and database cause were not logged.
- FE `pages/api/referral.ts` forwards the engine's response. GET does not call
  the QI reward functions. No QI loss was established in this investigation;
  correctness of the separate reward flow must be checked, not assumed.
- Release sources: `mumate-infra/runbooks/01-deploy-rollback.md`,
  `.github/workflows/release.yml`, `bin/release-check.sh`, and bazi's
  `.github/workflows/container-build.yml`. Dispatch is manual. Staging images
  use `<sha>-staging`; production images use `<sha>` from the same source
  commit, with environment-specific public build values.
- The cutover and its remaining observation/cleanup are recorded in
  `memory/events/2026/10/09/20261009T044129_mumate_cutover_gate_opened_on_digitalocean.yaml`
  and `20261009T044823_mumate_handoff_after_cutover_24h_watch_lessons.yaml`.
  This workstream does not close that observation or authorize its cleanup.

## Proposed change and boundaries

In the referral-code insert, use untargeted `onConflictDoNothing()` to cover
the table's existing unique constraints. If a row was inserted, return it.
Otherwise read the member's code again: return it if a concurrent request
created it, or retry a new candidate if the collision belongs to another member.
Keep the existing ten-attempt limit. Other database failures remain failures.

Return a safe Thai response with HTTP 503 when candidates collide through the
entire retry budget. For other GET failures return a generic 500, and log only
an event name, retry count, SQLSTATE and constraint where available, plus a
request ID if present. Never log raw queries, parameters, member IDs, credentials
or request headers. Add focused tests; register them in the appropriate gate
if the current explicit test list would omit them. A small internal helper is
allowed only if needed to test the algorithm; no public test controls.

Existing codes, three-digit format, invite links, authentication, redemption
rules and QI amounts stay. No production database migration, test writes,
data rewrite, new dependency, FE feature, Caddy/env/cron change, workflow
redesign, Vercel retirement, Render deletion or code-space expansion is in scope.

## Execution slices and acceptance criteria

### 1. Fix, review and prove the named commit on staging

Before execution, obtain a decision naming this plan revision and slice.
Resolve same-project overlap with the owner: `mumate-vercel-to-do-001` and
`mumate-be-retirement-001` still occupy these projects, and Wake cannot tell
whether another session is running. This is a sequential release lane; no
parallel execution is inferred from opening it. Pass the child's clean Git
start gate against fetched `origin/pdf-dev`, then use a bounded fix branch.

Develop the regression proof first. Tests use a disposable PostgreSQL database
with the actual unique constraints and installed Drizzle; mock only the random
sequence where necessary. Do not point fixtures at production or export staging
member rows. The original code must fail the collision regression.

Prepare an owner-reviewed draft PR and its committed closeout before presenting
the final review. The agent may merge PR 48 under the owner's direct delegation recorded for revision 0.2. Select and record the resulting full
bazi SHA and the FE SHA intended for the release; verify that any reused FE
image exists for both targets. Agent-operated staging build/push and release
are included only when the slice decision explicitly authorizes those external
actions. Use the existing Actions buttons and record run URLs and image digests.

Before staging writes, verify the apps target isolated `pgstaging` per runbook
05. If it needs refresh, surface that destructive operation for owner approval.
Use designated synthetic test accounts; no real payment or LINE-message test.

DoD:

| ID | Acceptance evidence |
|---|---|
| R1 | A forced occupied code followed by a free code returns 200 with the free code; the same test fails on the original revision. |
| R2 | Collision is exercised through real PostgreSQL and Drizzle, not an invented unwrapped error. |
| R3 | An existing member gets the original code with no extra row; concurrent requests for one member produce one row and the same code. Different members keep unique codes. |
| R4 | Ten occupied candidates stop at the limit and return the intended safe 503. A non-collision DB failure returns a safe failure without collision retries. Logs and response exclude sensitive data. |
| R5 | GET success, retries and failure leave wallet, ledger and redemption unchanged in fixtures. A valid existing code still awards the current documented rewards once; self-use and repeated use remain rejected. |
| R6 | Focused tests, default runtime-critical tests, changed-file lint and production build pass. The owner accepts the full-lint baseline exception: 35 errors in 14 files byte-identical to the integration baseline, with no new errors from this change. Full gate remains failed, not relabelled as passed. The container build's no-DB smoke is recorded separately from the real-DB proof. |
| R7 | Staging release uses the selected FE/bazi SHA pair; deploy-history records `ok`, image tags/digests and runtime health agree, and release-check accepts that pair. |
| R8 | Through the staging FE, authenticated new-code creation, existing-code retrieval, invite landing and redemption pass using test accounts. Record row-count and QI deltas only. |

Slice-1 completion presents the exact release pair, checks, staging acceptance,
known limitations and the production/rollback card for the owner's review.

### 2. Release production under owner delegation; verify and close

After slice-1 acceptance, record that the condition in the owner's 2026-10-09 delegation is met, naming revision 0.2 and slice 2. The agent operates production
`container-build` (`push=true`, `target=production`) for the accepted bazi SHA
and `release` (`env=production`) with the accepted full FE/bazi SHAs. Reuse an
existing FE image only after verifying its SHA and digest. Staging and production
images differ by target; the promotion proof is the same source SHA.

Before the button, re-read production's actual image pair, health and selected
rollback pair, and verify the previous images remain available. If the baseline
has moved, reconcile and repeat acceptance for the final selected pair before
release. Confirm the production RELEASE_ACTORS gate and staging release-check;
manual SSH deployment is not the normal path.

DoD:

| ID | Acceptance evidence |
|---|---|
| P1 | Owner-authorized build/release run URLs, exact source SHAs, image digests and passing staging gate are recorded. |
| P2 | Production deploy-history says `ok`; configured image, running image and runtime health agree; the selected FE SHA remains unchanged. |
| P3 | A designated account that already has a referral code gets the same code through production FE; invite lookup is read-only. No synthetic new-code/redemption/QI write is performed on production without a specific owner decision. |
| P4 | Observe at least 30 minutes after release: FE/bazi health and synthetics stay healthy, cron outcomes stay at baseline, and attributable referral failures or new regressions are investigated. Record the sample count; zero referral traffic is not proof of a successful new-code path. |
| P5 | Automatic unhealthy-deploy rollback is understood from the existing script; the prior SHA pair and manual rollback card are ready. No production rollback drill is run. On failed health, new referral regression or affected QI behaviour, stop progression and offer rollback; manual rollback needs the owner's instruction. |
| P6 | Append a release closeout with actual results, evidence and remaining limits; final delivery names slice 2 and uses `ready-for-owner-merge` only once its acceptance is met. Publishing the HQ record follows the standing-branch owner workflow. |

## Unresolved and next action

- The historical request's exact database error remains inferred. Safe failure
  logging in this fix supplies evidence for a future occurrence.
- The namespace remains limited to 900 codes; retry fixes collision handling,
  not capacity. Expansion needs its own approved scope across generator,
  validators and invite handling while preserving old codes.
- Production authorization is conditional on passing staging acceptance; final SHA pair and readiness still require proof. The unchanged full-lint baseline is accepted for this bounded release, not established harmless in every unrelated flow.
- Pending cutover observation, Beam test-purchase refund, host cleanup and
  retirement decisions remain with their existing workstreams.
- Human approval, review and external rules are unknown beyond explicit
  owner decisions and the cited repository records.

Next: execute slice 1 under the owner's 2026-10-09 go, in this bounded lane.
Merge PR 48, prove staging acceptance, then record condition fulfilment before executing slice 2 under the owner's delegation.
