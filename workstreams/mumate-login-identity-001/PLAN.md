# MuMate login identity: FE-native registration and explicit provider linking

**Workstream:** `mumate-login-identity-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** 1
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

Give each MuMate member one provider-independent internal identity and let that
identity carry both Google and LINE login methods. Build a new FE-native
`register-login` route beside the legacy BE route, prove it locally, move
traffic through the existing endpoint seam only after owner acceptance, and
leave the old BE route available for rollback until the observation gate is
closed.

The owner decided on 2026-09-23:

- Keep both Google and LINE on the main login surface.
- Treat `user.user_id` as MuMate's canonical member identifier. It is already
  a UUID primary key and does not belong to a provider.
- A provider identity is only a login credential attached to a `user_id`; it
  must not become the member identifier. Email is discovery/recovery data, not
  sufficient proof for automatic account linking.
- Move `register-login` into `mootech-fe` now because BE retirement still
  requires it, using a strangler sequence: open the new path, prove it, flip,
  observe, then stop using the old path.
- Do not restore `MEMBER_SUB`; do not remove LINE; do not change rich menu or
  LIFF entry behavior in this workstream.
- Do not edit code owned by another lane or repeat another person's attempted
  fix before the owner talks to that person. `mootech-be` is reference-only.

## Revision 0.2 — what changed and why

Revision 0.1 was written before three read-only investigations and a set of
production measurements existed. Revision 0.2 changes no objective and no slice
boundary; it corrects facts that were wrong, records the owner's decisions of
2026-09-23, and adds the acceptance conditions those facts require.

Owner decisions, 2026-09-23:

1. Slice 1 is accepted only after its defects are fixed, not as it stands.
2. The parity table keeps the no-join-by-email rule and must state its cost.
3. The dead `ya29...` credential rows are deleted; recovery for the members
   behind them is routed to support rather than to an email-adoption path.
4. The LINE email scope is wanted, but the owner does not hold the rights to
   request it. It is a team dependency, not an owner action.
5. Collision recovery ships as manual support first. An audited automatic merge
   is a later decision, taken only if manual volume justifies it.

Facts corrected since 0.1:

- **QI is not in a separate database.** `bazi_wallet`, `bazi_ledger_txn` and
  every other engine table live in the same Supabase Postgres as `user` and
  `user_provider`, verified by reading both tables from one connection. Neon
  holds nothing the runtime reads: no `@neondatabase/serverless` import and no
  `NEON_*` variable exists in the engine, and its only DB client is postgres-js
  pointed at Supabase. The remaining Neon references are stale comments, a
  dependency entry, and a README line.
- **QI is a stored balance, not a derived sum.** `bazi_wallet.qi` is written by
  incrementing the column; no code sums the ledger. A merge must therefore
  rewrite the balance, not only append a transfer row.
- **A merge spans far more than the six stores 0.1 implied.** Roughly thirty
  engine tables are keyed per person, several with primary keys that collide on
  merge and several that grant value automatically.
- **Provider spelling is asymmetric, and only for Google.** Both writers spell
  LINE `LINE`. The live path writes Google as `google`; the new route writes
  `GOOGLE`; the legacy backend compares provider case-sensitively.

## Relationship to existing work

This workstream takes ownership of only the login/identity portion formerly
listed in paused `mumate-be-retirement-001` slice 1. That broader workstream
remains paused and continues to own every other BE responsibility and eventual
service retirement. This plan does not edit or delete the BE implementation.

`mumate-infra-move-001` may continue independently. Before any application PR
is pushed, its holder is told that moving `register-login` changes what the
slice-3c parity smoke proves for the BE container. No infrastructure file,
host, DNS record, or provider setting changes here.

## Verified starting evidence

Read-only verification on 2026-09-23:

- `mootech-fe` `origin/main` `4837b4763748`: `user.user_id` is a 36-character
  primary key; `user_provider` holds its own row id, `user_id`, `provider`, and
  `id_token`, but declares no uniqueness for provider identity.
- `mootech-fe/lib/v2/resolve-user.ts` already resolves a signed NextAuth
  provider identity through `user_provider` to internal `user_id`, and returns
  409 rather than guessing when several user ids match.
- `mootech-be` `origin/main` `0705378d8841`: `user.user_id` is generated with
  `@PrimaryGeneratedColumn('uuid')`; the legacy `register-login` path still
  creates and links `user_provider` rows.
- The preceding read-only production research observed provider spelling
  drift, ambiguous identities, and LINE provider identities attached to more
  than one internal user. These aggregate counts are a planning checkpoint,
  not migration input; slice 2 re-measures them before producing SQL.

## Identity contract

```text
MuMate member       user.user_id (canonical UUID)
                           |
                           +-- user_provider(GOOGLE, Google subject)
                           +-- user_provider(LINE, LINE subject)
```

The required invariant is: one normalized `(provider, provider subject)` maps
to exactly one canonical `user_id`. A `user_id` may intentionally have several
provider rows. Email is not part of this key.

When an authenticated member links a provider:

1. No provider row exists: attach it to the current canonical `user_id`.
2. It already points to the current `user_id`: report already linked.
3. It points to another `user_id`: stop. Do not relink, merge, delete, transfer
   value, or choose a winner automatically. That collision is an owner-gated
   later slice.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | New route, identity migration artifact, linking flow, tests | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `ciel-os` | Plan, decisions, and closeouts | `.` |

`mootech-be` and `bazi-sft-dataset` are evidence sources only. They are not
projects claimed by this lane and remain untouched unless a later owner
decision changes the plan.

## Execution slices and acceptance criteria

### 1. Open the FE-native route without moving traffic

Implement a new server-side route in `mootech-fe` behind a distinct local URL.
It derives provider and provider subject from the verified NextAuth session,
never from a client-supplied `user_id`, and returns the response contract the
current callers require. Preserve or intentionally reject each legacy branch
in a written parity table: existing provider, first member, email discovery,
orphan provider, referral/welcome side effects, and LINE-specific behavior.

DoD 1:

- Google and LINE fixtures each resolve to one internal UUID through the new
  route on the local arena while the legacy BE host is unreachable.
- Concurrent first-login requests cannot produce two provider mappings in the
  local proof database.
- Unit tests cover every branch in the parity table; an integration test proves
  the DB transaction and repeated-request behavior.
- No production endpoint constant is flipped, no application PR is pushed,
  and no provider/dashboard setting changes.
- The owner reviews the parity table and local proof before slice 2 or any
  traffic move.

**Defects that must be fixed before slice 1 is accepted (added in 0.2).** An
adversarial review of the delivered code found these by comparing it against the
legacy method and against what the two existing callers actually do with the
response. They are listed in the order they would hurt.

1. **Every failure returns `ok: false`, and both callers read that as "sign the
   user out".** Home and the identity self-heal clear the member cookies and
   call `signOut` on `ok === false`. The legacy route sets that flag only for a
   genuine LINE identity rejection; a backend fault returns a shape without it,
   which the callers treat as a retry. As delivered, a transient database error
   or an unreadable session cookie logs the member out instead of retrying.
   The route must reserve `ok: false` for a real identity rejection.
2. **A referral code forces that same sign-out, and today every member carries
   one.** The route answers `422` to any non-empty `refer_code`. The legacy
   login page writes the `REFCODE_FGF` cookie from its `callback` query
   parameter, which **defaults to `/`** — so the cookie is a non-empty `/` for
   ordinary members who never touched a referral link, and home passes it
   straight into the register call. On the flip this is a login loop for
   effectively everyone, not an edge case. Refusing referral side effects is
   fine; refusing the login is not.
3. **Provider spelling.** The route writes `GOOGLE` while the live path writes
   `google` and the legacy backend matches case-sensitively. A member created by
   the new route and then served by a rollback is not found, falls into email
   discovery, and a duplicate row is written — the exact condition slice 2 exists
   to remove, and a unique-violation 500 once that index exists. Write the
   spelling the live path writes. LINE needs no change.
4. **Empty name or picture is written as SQL NULL and returned as `null`**,
   where the legacy path writes and returns `''`. Callers put the value straight
   into a cookie, so the member gets the literal string `null` as their name or
   avatar. Normalise to `''` as `ref_code` already is.
5. **`updateLoginProfile` overwrites `name`, `picture_url` and `email`
   unconditionally.** The legacy path updates `email` only, only for non-LINE,
   and only when non-empty. As delivered, each LINE login erases a stored email,
   which is the column `checkUserWithLine` branches on.
6. **The parity table must be corrected, not only extended.** Its "first login"
   row claims preservation while `is_info` differs from legacy; its returning
   row leaves `is_email` drift unstated; its LINE row claims the profile image
   is stored when the returning path writes it nowhere the app reads. It also
   needs the rows 0.2 adds: the cost of no-join-by-email, the provider-spelling
   rule, and the treatment of a provider that is neither Google nor LINE.
7. **The concurrency proof must be reproducible.** The proof exists and passed,
   but it is `skipIf` on an environment variable, so the default lane skips it
   and the record holds only a one-line claim. Run it with the arena up and put
   its output in the acceptance record. Note also that it runs against a direct
   connection while production uses the transaction pooler, so state plainly
   what it does and does not prove.

DoD 1 additions: items 1-6 are fixed and covered by a test that asserts the
whole response shape rather than a subset; item 7's output is in the record.

### 2. Clean provider identity and prove the uniqueness migration locally

Re-measure provider values and duplicate mappings through a read-only query.
Prepare a migration and dry-run report that normalizes provider names, handles
blank/invalid provider rows explicitly, resolves every same-user duplicate,
and lists every cross-user collision for owner review. Only after all collisions
are resolved may the migration create the unique normalized provider-identity
index.

DoD 2: on an anonymized local restore, duplicate mappings are zero, the unique
index builds successfully, concurrent registration leaves one mapping, and
rollback SQL is demonstrated. Applying SQL to production is a separate owner
action and is not authorized by this plan opening.

**Normalisation target (settled in 0.2): normalise per provider, to whatever the
live writer already sends — Google to `google`, LINE to `LINE`.** Do not pick one
case for both. The reasoning, which cost two investigations to establish:

- Four backend queries match a *stored* `LINE` exactly — the new-member cohort
  job, the paying-LINE-member audience, `checkUserWithLine`, and a migration
  idempotency check. Lower-casing LINE makes all four return zero rows **without
  raising an error**, so the failure would be silent and slow to notice.
- No query anywhere reads a stored `GOOGLE`. The backend's `PROVIDER.GOOGLE`
  constant is declared and never used. Lower-casing Google is therefore free.
- Choosing the live spelling means **no production code has to change in the same
  deploy**. Normalising upward would force an edit to the live register caller,
  or the legacy path would immediately re-create the lower-case rows it cannot
  find.

**Cleanup inventory, measured 2026-09-23 (a planning checkpoint; re-measure
before writing any migration).** Of 5,951 provider rows across 5,084 members:

- 1,787 rows spell Google `GOOGLE` (last written 2026-06-19) and 468 spell it
  `google` (written today). 3,043 spell LINE `LINE` (written today). One row is
  the `dev` provider.
- 657 rows carry a blank provider and hold a `ya29...` Google **access token**
  in `id_token` — a historical bug that stored a short-lived token as an
  identity. These can never match again under any implementation. Per owner
  decision 3 they are deleted, with the 98 members whose only rows are of this
  kind routed to support; 90 of those hold a computed chart, none hold a
  subscription, and none have signed in since 1 August.
- 20 identities map to more than one member: 15 LINE and 5 Google, 40 members in
  total. Every one of the 40 was created and last seen on the same day and has
  no QI, no ledger row, no subscription, no push subscription and no friend
  rows — they are same-day double registrations, not two people. 15 of the 20
  have a chart on exactly one side (keep that side), 4 have a chart on neither
  (keep the older), and 1 has a chart on both and needs the owner to look.

Every deletion is preceded by a dump of the affected rows, and the owner runs
each statement.

### 3. Link an unused provider to the signed-in member

Add an authenticated linking flow that proves both the current MuMate session
and the provider authorization with state/nonce and server-side token
verification. Connect the existing Connected Accounts UI. An unused provider
identity attaches to the current `user_id`; an existing same-user mapping is
idempotent; a cross-user collision stops and shows a neutral recovery state.

DoD 3: Google-to-LINE and LINE-to-Google linking work on the arena without
changing canonical `user_id`; ordinary NextAuth sign-in does not overwrite the
current session during linking; unlink is designed before production use; and
collision fixtures cause no data or ownership change.

Added in 0.2:

- **The linking round trip cannot go through NextAuth `signIn`.** The session
  strategy is JWT with no database adapter, so starting a second provider
  authorization replaces the current session rather than attaching to it. This
  slice owns its own authorization routes and writes `user_provider` itself.
- **The LINE console work is a team dependency, not an owner action.** The owner
  checked and does not hold the rights to request the email permission or to add
  a redirect URI on that channel. Slice 3 cannot finish until a team member with
  those rights does it; the exact redirect URI is handed over in writing.
- **The email scope, if granted, may suggest but must never bind.** A returning
  LINE member's email may be used to *show* them the account we believe is
  theirs; only completing that provider's sign-in may attach it. Treating a
  matching email as proof would reinstate exactly what owner decision 2 removed.
- LINE login stays on the main surface throughout. Nothing in this slice hides,
  demotes, or removes it.

### 4. Decide collision recovery with the owners of affected data

Before implementation, inventory which systems own QI, subscriptions, chart
data, referrals/friends, payments, push subscriptions, and audit history. The
owner talks to the people who made the existing identity changes and to the
owners of any affected path. Decide whether the first release routes collisions
to manual support or implements an auditable merge.

No default merge policy is authorized. In particular this workstream may not
rewrite Bazi/QI, subscription, referral, payment, rich-menu, or legacy
`MEMBER_SUB` behavior merely because a collision exists.

**Owner decision 5 (2026-09-23): the first release routes collisions to manual
support.** An audited automatic merge is revisited only if manual volume
justifies it. The inventory that this slice was told to produce has now been
done read-only, and it is the reason the decision is right rather than merely
cautious:

- Roughly thirty engine tables are keyed per member, in the same database as
  `user`. A merge is one transaction in principle, but it is a wide one.
- **The QI balance is a stored column**, so a merge must rewrite it; appending a
  transfer row alone changes history without changing what the member sees. The
  routine that writes wallet and ledger is not transactional today, and the
  reason recorded in its comment — a driver that could not do transactions — no
  longer applies. Fixing that is a prerequisite for any automatic merge.
- **Several stores grant value by themselves.** The achievements endpoint
  recomputes from merged statistics and pays on read, with no merge code
  involved. Merged experience also raises the level, which is itself an award
  condition.
- **A lifetime-rights table is keyed by member.** Losing a colliding row there
  re-grants the once-per-account free birth edit and the first-purchase bonus.
  Those rows must be unioned, never dropped.
- **The account-deletion state machine collides on its primary key and is wired
  to a destructive purge job.** A losing member's pending row, if it survives,
  schedules deletion of the merged account.
- **Referral has two member columns and a uniqueness rule on the referee**, so it
  needs two passes, and merging a referrer with their own referee creates a
  self-referral that pays a bonus for the member's own upgrade.
- **Only one birth date can survive**, and both applications read it back, so the
  choice propagates to every chart, reading and mascot.
- Some engine data is keyed on a LINE identity or a browser-local identity rather
  than on `user_id`, and would need its own mapping.

Nothing in this list is a reason to abandon merging. It is the reason the first
release does not attempt it automatically, and the checklist any later automatic
merge must satisfy. No cross-application identity-rewrite tooling exists today;
deleting a member currently leaves the engine rows orphaned by design.

### 5. Flip through the seam, observe, then stop using the old path

After slices 1-4 close and the owner authorizes the flip, repoint the FE client
to the new route with the legacy route retained as a bounded rollback. Test on
local first, then a reviewed PR and owner merge. Notify the infrastructure lane
before push. Observe login success, ambiguous identities, duplicate creation,
and rollback readiness for an owner-decided window. Removing the legacy call
from FE is a later decision; changing or deleting the BE endpoint remains with
`mumate-be-retirement-001`.

## Authority and ownership boundary

- Only slice 1 is authorized by the opening decision.
- The owner approved the overlap with the parked MuMate infrastructure and
  CU12 sessions: this lane owns only its `mootech-fe` topic branch and its
  named HQ paths. No other session may edit that topic branch concurrently.
- Owner actions: production SQL, backup, application PR merge, production
  traffic flip, and rollback decision.
- **Team actions (not the owner's to perform, confirmed 2026-09-23):** the LINE
  console email-scope request and any redirect URI added for the linking flow.
  The owner checked and does not hold those rights. Slice 3 states the exact
  values needed and waits on a team member.
- Agent actions in slice 1: start gate, topic branch, FE-only implementation,
  local arena/tests, draft PR preparation, and CIEL evidence.
- `mootech-be` is read-only. `bazi-sft-dataset`, QI, subscriptions, referrals,
  rich menu/LIFF, and `MEMBER_SUB` are read-only until an owner decision names
  their slice and ownership.
- No secret, personal identity row, session locator, or raw production record
  enters Git, an event, a PR, or a report.

## Review and sequencing

| Slice | Proof | Estimate | Review | Waits on |
|---|---|---:|---|---|
| 1 | FE route works locally with BE unreachable; traffic unchanged | 4-8 h, plus 2-4 h for the 0.2 defect fixes | heavy: auth + new DB write path | opening decision |
| 2 | cleanup and unique index succeed on anonymized restore | 4-8 h | heavy: schema + identity data | slice 1 closeout; owner decision |
| 3 | explicit linking works without identity mutation on collision | 6-10 h | heavy: OAuth + auth + DB | slice 2 closeout; **team** LINE console steps |
| 4 | collision policy and ownership are settled | unknown | owner + affected path owners | slices 2-3 evidence |
| 5 | reviewed flip, observation, old FE path retired later | 4-6 h + observation | owner-attended production gate | slices 1-4 closed |

Every slice after slice 1 requires a new owner decision event. Slices are
sequential because they touch the same identity seam and schema.
