# MuMate login identity: FE-native registration and explicit provider linking

**Workstream:** `mumate-login-identity-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
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

### 4. Decide collision recovery with the owners of affected data

Before implementation, inventory which systems own QI, subscriptions, chart
data, referrals/friends, payments, push subscriptions, and audit history. The
owner talks to the people who made the existing identity changes and to the
owners of any affected path. Decide whether the first release routes collisions
to manual support or implements an auditable merge.

No default merge policy is authorized. In particular this workstream may not
rewrite Bazi/QI, subscription, referral, payment, rich-menu, or legacy
`MEMBER_SUB` behavior merely because a collision exists.

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
- Owner actions: production SQL, backup, LINE Console scopes/redirects,
  application PR merge, production traffic flip, and rollback decision.
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
| 1 | FE route works locally with BE unreachable; traffic unchanged | 4-8 h | heavy: auth + new DB write path | opening decision |
| 2 | cleanup and unique index succeed on anonymized restore | 4-8 h | heavy: schema + identity data | slice 1 closeout; owner decision |
| 3 | explicit linking works without identity mutation on collision | 6-10 h | heavy: OAuth + auth + DB | slice 2 closeout; LINE Console owner steps |
| 4 | collision policy and ownership are settled | unknown | owner + affected path owners | slices 2-3 evidence |
| 5 | reviewed flip, observation, old FE path retired later | 4-6 h + observation | owner-attended production gate | slices 1-4 closed |

Every slice after slice 1 requires a new owner decision event. Slices are
sequential because they touch the same identity seam and schema.
