# MuMate — decouple v2 first-run from `mootech-be`

**Workstream:** `mumate-be-decoupling-001`
**State:** paused
**Execution lane:** single
**Plan revision:** 0.3
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Make the MuMate v2 first-run path independent of `mootech-be`, so that the one
route every new user must pass cannot be broken by the legacy backend, and
record precisely what still binds the v2 surface to it.

The owner directed the approach after reviewing the evidence: move first-run's
write **up into `mootech-fe` itself**, not sideways into the bazi engine. The
recorded reasons are that `mootech-fe` and `mootech-be` already share one
Supabase database, the two `user` columns are already declared in the FE Drizzle
schema, and the engine's consent record is keyed by `anonId` while this one is
keyed by `user_id` — moving it to the engine would place a `user_id`-scoped
legal record in a different database from the `user` table it refers to.

The owner then settled the scope question this plan had reserved. MuMate's
consent surface is two different models, not one record kept twice, and only the
first-run half is ours to move:

- **first-run's policy acceptance** — one row per acceptance of the policy as a
  whole, keyed by `user_id`. This is the half we built and the half this plan
  takes over.
- **the five granular purposes** — `pdpa`, `history`, `analytics`, `marketing`,
  `ads`, insert-only and keyed by `(anon_id, kind)`, each individually
  switchable, rendered by `/v2/privacy/consent`. The owner's decision is that
  this model stays where it is. This plan does not touch it, does not migrate it,
  and does not claim it should move.

The two overlap only on `kind: 'pdpa'`. That overlap is recorded and accepted, not
resolved.

This plan does not launch v2 and does not retire `mootech-be`.

## Why this plan is paused before any slice

The owner asked the product team whether this work was needed now. The team's
answer, relayed by the owner on 2026-09-06, is that nothing is required from us
yet. No slice was started, so the plan is paused rather than withdrawn: the
evidence behind it has a shelf life, and pausing keeps it readable instead of
forcing whoever picks this up to measure it again.

**Nothing in this plan is retracted.** The six dependencies, the two findings
that contradict `docs/be-phase1-consolidation.md`, and the settled consent scope
all still stand as measured on 2026-09-05 and 2026-09-06.

**What would unpause it,** in the order that makes each one matter:

- The product team asks for it, or `#247` moves and launching v2 becomes real.
  Path 1 is the one every new user passes, so it becomes urgent the day the
  preview gate comes off, not before.
- Someone acts on `docs/be-phase1-consolidation.md` section I. That document
  still says `src/consent/` is deletable because it has no FE caller. Slice 2
  exists partly to correct it, and the correction is worth making even if
  nothing else here is executed.
- `mootech-be` stops being reliable. It has had no commit since 2026-08-18 and
  carries `mootech-be#23`, so the day it needs work is the day these six
  dependencies stop being a plan and start being an outage.

**What goes stale first while paused.** Every measurement here is a snapshot of
`mootech-fe` at `3c5e5bd`, and that repository moved 100 commits in the three
days before this plan was written. Re-measure the six dependencies before acting
on them; do not treat this plan's list as current.

## Starting evidence

Measured 2026-09-05 and 2026-09-06 against `mootech-fe` at `3c5e5bd`,
`mootech-be` at `57da359`, and `bazi-sft-dataset` at `pdf-dev` `4a3bd54`. All
observations are from repository files and GitHub metadata; nothing below was
produced by running either application.

- The v2 surface reaches `mootech-be` on **six** paths. Ranked by user impact:
  1. `pages/api/v2/onboarding.ts` → BE `POST /consent`
  2. `lib/auth/use-self-heal-identity.ts` → BE `POST /user/register-login`
  3. `features/v2-service/hooks/useCompatibility.ts` → BE `POST /member-with-friend` and `/member-with-friend/profile`
  4. `pages/api/chinese-horoscope.ts` (hybrid BFF) → BE `GET /chinese-horoscope`
  5. `features/auth/hooks/useV2ProfileForm.ts` → BE `POST /chinese-horoscope`
  6. `lib/credit/wallet-client.ts` → BE `/ai/balance/:id` and `/ai/consume`
- Path 1 is the **only** file in `pages/api/v2/` (20 files) that reads
  `NEXT_PUBLIC_BACKEND_URL`. The five v2 payment routes carry zero references to
  it, so the money lane is already free of `mootech-be`.
- `pages/api/v2/onboarding.ts` states in its own header that BE `/consent`
  "stamps `user.onboarded_at` — which is what stops the first-run gate from
  looping the user forever". A failure there returns 502 or 504 and the gate
  never releases.
- The same file already contains a non-production fallback that writes
  `onboarded_at` and `onboarding_goal` directly through the FE database, with the
  comment that these are "คอลัมน์เดียวกับที่ BE /consent เขียน". Production is
  deliberately fail-closed and must not be widened without this plan.
- `lib/db/schema.ts` lines 1033 to 1038 already declare `onboardedAt` and
  `onboardingGoal` on the FE `user` model, citing the same BE migration file that
  created them.
- BE's `consent` table is four columns — `id`, `user_id`, `accepted_at`,
  `policy_version` — and its entity comment records that it deliberately stores
  no PII beyond `user_id`, not even an IP address.
- `consent.service.ts` performs two writes that are **not** in one transaction:
  append the consent row, then update the user row. A failure between them leaves
  a consent record with the gate still looping.
- The same service records its own weakness: "`user_id` is still trusted from the
  body (the BE has no user auth), so this does not prove the user consented". The
  FE route already derives the subject from the signed session and no longer
  sends `user_id` at all.
- `docs/be-phase1-consolidation.md` section I calls consent the safest Phase 1
  switch and lists `src/consent/` as deletable, on the basis that it has "no
  other FE caller". `pages/api/v2/onboarding.ts` is that caller; it reaches BE
  through `NEXT_PUBLIC_BACKEND_URL` directly rather than through `endpoint.ts`,
  which is where that document looked. Acting on that section as written would
  break v2 first-run.
- MuMate's two consent surfaces are **different models**, not one record kept
  twice. An earlier reading in this workstream called them two stores of the same
  thing; reading `ConsentScreen.tsx` corrected it. BE `consent` is one row per
  acceptance of the whole policy keyed by `user_id`. Engine `bazi_consent` is
  insert-only, keyed by `(anon_id, kind)`, carries an `accepted` boolean that can
  be switched off, and covers five purposes. They overlap only on `kind: 'pdpa'`.
- 🔑 **`pages/api/v2/first-run-reset.ts` already writes both targets directly from
  the FE**, in shipped code that runs against production:
  `UPDATE "user" SET onboarded_at = NULL, onboarding_goal = NULL` followed by
  `DELETE FROM consent WHERE user_id = ...`. Its header states the writes are
  "the exact inverse of what `consent.service.ts` does". The capability slice 1
  needs is therefore already present and already exercised; only the insert
  direction is missing. That file is gated to the team preview and is marked
  `🔴 TEMPORARY (#249)` for deletion by `#248` before launch, so it is a reference
  and a precedent, never a place to build on.
- first-run reaches `mootech-be` at **two** points, not one. Besides the consent
  write, `useFirstRunSource` calls `ChineseHoroscopeGet`, which resolves to the
  hybrid BFF `pages/api/chinese-horoscope.ts`, which reads the chart from BE.
- first-run also reaches the **engine**, through that same hybrid BFF, which
  overlays consumer readings from `POST /api/reading/topic`. That call is
  **optional by design**: the BFF header records that if the engine is
  unreachable "that section KEEPS its be value (graceful, page never breaks)".
  So the engine can be down and first-run still completes; `mootech-be` cannot.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan, decisions, and events for this work | `.` |
| `mootech-fe` | the repository the change lands in | machine-local, outside this HQ tree |
| `mootech-be` | the repository whose caller must be proven gone before retirement | machine-local, outside this HQ tree |

`bazi-sft-dataset` is deliberately **not** bound. This workstream changes nothing
in it, and the open question about the second consent store is surfaced for the
owner rather than resolved here. Its state is read as unverified external context.

Observed at plan time: the `mootech-fe` checkout is clean on `main` but **100
commits behind** its fetched `origin/main`, and `mootech-be` is clean and current
at `0 0`. The FE start gate must pass before any tracked change is made there.

## Authority and scope

- The owner confirms this plan and any reframe before execution starts, and
  authorizes each slice by naming this plan path, revision, and slice.
- Every change in `mootech-fe` and `mootech-be` follows those repositories' own
  contract, not CIEL's: `MUMATE-GITHUB-FLOW.md`, `.githooks/pre-push`, one topic
  branch, one draft pull request, and **the owner merges**. An agent never merges
  its own pull request and never deploys.
- 🔴 `mootech-fe` has **no CI on GitHub**. The only enforced gate is
  `.githooks/pre-push` on the machine that pushes. Verify `git config
  core.hooksPath` prints an absolute path before the first push, and do not use
  `--no-verify`. If the gate blocks, report it rather than bypassing it.
- The database is treated as the owner's. No schema change, migration, data
  mutation, production query, or backfill happens without explicit owner
  approval naming the exact operation.
- 🔴 A second worktree, `lamun-585-colleague`, is attached to the `mootech-fe`
  checkout on `feat/585-colleague-multi`. Do not check it out, move it, or delete
  it. It belongs to someone else's work.
- Agent sessions are disposable and are not stored as evidence or locators.
- One execution lane. Any parallel lane or same-project overlap is surfaced for
  owner confirmation before it begins.

## Invariants

1. The PDPA consent record is a legal record. It is appended, never overwritten,
   and no acceptance already stored is edited, moved, or deleted by this work.
2. No data migration. The FE writes the same physical table in the same Supabase
   database that BE already writes, so existing rows are untouched by design.
3. Identity comes from the signed session only. No path introduced here reads a
   client-supplied subject, and the forgeable `user_id` contract BE accepts is
   not reproduced.
4. Fail-closed stays fail-closed. If the FE cannot complete the write, first-run
   must report failure and must not stamp `onboarded_at`, because a false stamp
   silently releases a gate for a user who never consented.
5. Additive first. `mootech-be` keeps serving `/consent` until a later slice
   proves nothing calls it. Nothing in BE is deleted by this workstream.
6. One timestamp format. The column is `text` and currently receives two shapes;
   this work picks one, records which, and does not leave the choice implicit.
7. Every claim about behaviour is either measured or labelled as unverified. A
   comment in the code is evidence of intent, not proof of behaviour.

## Execution slices and acceptance criteria

### 1. `mootech-fe` owns the first-run consent write

Move the three writes BE performs into one FE transaction, keeping the identity
model the FE already has and the append-only shape the record requires.

- Add the `consent` table to `lib/db/schema.ts` as a Drizzle model matching the
  existing physical columns. No migration creates it; it already exists.
- Replace the BE call in `pages/api/v2/onboarding.ts` with one `db.transaction`
  that appends the consent row and updates `onboarded_at` and `onboarding_goal`
  together, so the two cannot land apart.
- Keep the existing goal and policy-version validation. They already exist on the
  FE side and are not weakened.
- Decide and record the `accepted_at` format. BE writes
  `YYYY-MM-DD HH:mm:ss` with no timezone; the FE fallback writes an ISO 8601
  instant. State which one the column carries from now on, and state explicitly
  whether existing rows are left in the older shape.
- Acceptance: first-run completes with `mootech-be` unreachable. Demonstrated,
  not reasoned.
- Acceptance: a forced failure inside the transaction leaves no consent row and
  no `onboarded_at`, and the screen reports failure. The gate must still loop,
  because a user who did not consent must not be released.
- Acceptance: the route still refuses an unauthenticated caller before it
  inspects the body, and still never reads a subject from the request.
- Acceptance: covered by tests. State plainly which of them run under
  `npm test` and which need `TEST_DATABASE_URL`, since the database-backed lane
  is skipped by default and reports as passed when it is not run.
- Acceptance: `CONSENT_SECRET` is no longer required by `mootech-fe`. Say whether
  it is removed from `.env.example` or retained, and why.
- Acceptance: the insert and the delete agree on shape. `first-run-reset.ts`
  already deletes exactly these rows; after slice 1 the two must remain exact
  inverses, and that must hold until `#248` removes the reset route.

### 2. Prove the BE caller is gone, and hand off retirement

- Search `mootech-fe` for every remaining reference to BE `/consent`, including
  paths that do not go through `constants/api/endpoint.ts`, which is how the
  existing consolidation document missed this caller.
- Search `mootech-be` for internal callers of `ConsentService.completeOnboarding`
  — a cron job or another service, not only an HTTP route.
- Correct `docs/be-phase1-consolidation.md` section I so the next reader is not
  told the module is already dead from the FE side.
- Acceptance: a written statement of what still calls BE `/consent`, with the
  command that produced it, or a statement that nothing does.
- Acceptance: no BE module is deleted by this workstream. Retirement is handed to
  the owner as a separate decision with the evidence attached.
- Acceptance: the five remaining v2 dependencies on `mootech-be` are restated
  with their current status, so the next workstream starts from a measured list
  rather than this plan's snapshot.

## The settled scope question, and what it leaves open

Revision 0.1 reserved one question for the owner: where MuMate's consent record
should live. The owner answered it after being shown that the two surfaces are
different models rather than one record kept twice.

**Settled:** this workstream touches only what first-run touches. The five
granular purposes behind `/v2/privacy/consent` are a separate model with a
separate identity key, and they are not this workstream's to move.

**Left open on purpose, and named so nobody has to rediscover it:**

- `kind: 'pdpa'` exists on both sides. After slice 1, a person's acceptance of the
  policy at first-run lives in Supabase keyed by `user_id`, while the `pdpa`
  switch on the settings screen reads the engine keyed by `anon_id`. Those two
  will still not see each other. This plan accepts that rather than hiding it.
- Whether that matters is a question about a legal record, not a refactor, and it
  is the owner's to answer in its own time.

Slice 2 states the overlap in writing so the next reader inherits a measured fact
instead of an assumption.

## Boundaries and delivery

- No launch of v2, no removal of the preview gate, and nothing that depends on
  `#247`.
- No change to the other five BE dependencies, to the bazi engine, to payments,
  to authentication, or to any screen outside first-run.
- **No change to the five granular consent purposes or to `/v2/privacy/consent`.**
  That model stays where it is by owner decision.
- **No change to the chart read.** first-run's other `mootech-be` dependency,
  `ChineseHoroscopeGet` through the hybrid BFF, is blocked on the engine being
  able to reproduce `analytic`, which no slice here attempts. first-run therefore
  still needs `mootech-be` after slice 1 ships, for a different reason than
  before, and this plan says so rather than implying the path is free.
- No schema change, no migration, no data backfill, no production query.
- No deletion in `mootech-be`.
- No new service, generator, adapter layer, or dependency.
- Record outcomes in append-only CIEL events. Deliver each product change through
  a topic branch and a draft pull request in its own repository, with the phase
  closeout verified on the pull-request head before it is advanced for owner
  review.

## Explicit non-goals

- Decoupling `mootech-fe` from `mootech-be` in general. Five paths remain and are
  named, not addressed.
- Reconciling the two consent models, or moving the five granular purposes. The
  owner scoped them out; the `pdpa` overlap is recorded, not resolved.
- Freeing first-run from `mootech-be` entirely. Slice 1 closes the write; the
  chart read stays and is blocked elsewhere.
- Proving that the bazi engine could host this record. It could; the owner chose
  otherwise and the reason is recorded.
- Any claim about production behaviour. Nothing here is verified against
  production, and no slice authorizes touching it.
