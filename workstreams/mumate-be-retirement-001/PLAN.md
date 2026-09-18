# MuMate — retire `mootech-be`: every live responsibility moves into `mootech-fe`

**Workstream:** `mumate-be-retirement-001`
**State:** paused
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Take the legacy NestJS backend `mootech-be` out of the MuMate system completely,
so that v1 and v2 both keep working with `mootech-fe` talking only to the bazi
engine and to Supabase, and the Render service can be suspended and then
deleted.

## Why this plan is paused before slice 1

On 2026-09-18 afternoon the owner separated the team's v2 launch from the
owner's infrastructure lane. The migration now reproduces the launched system
first, including `mootech-be`, while the old Vercel and Render stack stays live.
Only after the DigitalOcean stack matches production, passes a controlled
maintenance-window flip, and is stable does backend retirement become a
candidate again.

That decision supersedes this plan's former ordering rule that retirement must
finish before the server move. No slice ran and no application repository was
changed for this workstream. Its inventory remains useful evidence, but it must
be re-measured against the post-launch revisions before resumption.

The owner's direction, 2026-09-18 morning:

> ตัด be ออกจากระบบ ให้มีแค่ fe คุยกับ bazi เท่านั้น … ให้ทั้ง v1 และ v2
> ยังใช้งานได้อยู่ 100% ก่อนจะย้าย server เพื่อที่จะได้เหลือแค่ 2 และ
> takedown be ได้อย่างสะอาดปลอดภัย

"100%" is taken literally for everything a user can reach today, with two
exceptions the evidence justifies and the owner accepted in the same
conversation: v1 payment is frozen (not ported), and dead code the UI no longer
mounts is deleted, not ported.

This plan supersedes `mumate-be-decoupling-001` (paused at revision 0.3, never
started). Its six dependencies and its settled consent scope are carried
forward unchanged; its narrow objective (first-run only) is widened to the whole
backend.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | receives every ported responsibility; the only code that changes | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `mootech-be` | read for the port, never changed; suspended in slice 4 | `/Users/non/ghq/github.com/mojisejr/mootech-be` |
| `bazi-sft-dataset` | engine already used by v2; read only to confirm what v1 may reuse | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `ciel-os` | this plan, its research, and its events | `.` |

## Starting evidence

Measured 2026-09-18 by three read-only research passes against `mootech-fe`
`main` `1312292`, `mootech-be` `main` `57da359`, `bazi-sft-dataset` `pdf-dev`
`04bc2bd`. The full reports are in `research/` beside this plan and every
`path:line` below is taken from them.

**The backend is smaller than it looks and has no security of its own.**
68 routes in 32 controllers, 83 TypeORM entities, no global prefix. There is
**no user authentication anywhere**: no JWT, no guard, no session; every route
trusts the `user_id` in the body or query (`research/be-inventory.md` §4). Three
routes carry a shared secret or HMAC (`/ai/consume`, `/consent`, `/omise/webhook`).
Two LINE crons exist and are off by default (`MORNING_CRON_ENABLED`). Nothing
runs on boot except the TypeORM connection, and `DB_SYNCHRONIZE` must stay
`false` (pgloader-migrated schema; a synchronize run would be destructive).

**Nobody but the frontend calls it.** The engine has no dependency on BE; LINE's
webhook lives in the engine; there is no mobile client; the Omise account's
single live webhook already points at the v2 endpoint
(`research/consumers-and-decisions.md` §1). The only inbound third party is the
Omise webhook route, which no longer receives live deliveries.

**v1 payment is dead in fact.** Sales entrances closed 2026-08-24
(`mootech-fe#376`), lifetime volume 18 payments / ฿3,890, the BE runs on an
expired Omise secret key (403 `key_expired_error`), and the owner recorded on
2026-09-09 that work existing only to keep v1 taking money is out of scope.
The `/payment/*` pages are still reachable by direct URL
(`research/fe-call-sites.md` §5).

**The frontend already holds almost all the data.** Of 85 BE tables, `lib/db/schema.ts`
declares all but one: **`consent`** (`id, user_id, accepted_at, policy_version`).
Column-level parity is UNVERIFIED. BE ships no seed data files; its reference
values are code constants (`src/constants/*`).

**26 live call sites remain, collapsing into eleven pieces of work**
(`research/fe-call-sites.md` §1):

| # | BE responsibility | Used by | Size |
|---|---|---|---|
| 1 | `POST /user/register-login` — mints `user` + `user_provider`, refer code, welcome points, optional LINE profile check, LINE avatar copy | every login, v1 and v2 (`lib/auth/use-self-heal-identity.ts:118`, `pages/index.tsx:187`) | M |
| 2 | `POST /consent` — first-run acceptance row + `user.onboarded_at/onboarding_goal` | v2 first-run (`pages/api/v2/onboarding.ts:79`) | S |
| 3 | `member-with-friend` create / update / profile / new-friend | v1 friends, v2 compatibility (`useCompatibility.ts:196,213`) | S |
| 4 | `object-storage/upload-file` — Supabase Storage put, returns key | v1 + v2 profile and friend images | S |
| 5 | `POST /chinese-horoscope` + `GET /chinese-horoscope` — the v1 chart: 1,380-line orchestration over ~45 reference tables, 810-line 8-square arithmetic, node-canvas share card, writes `log_calculate` and `user` | v1 register / edit / my-destiny / share; **v2 register, edit-birth, home, first-run**; public calculator | **XL** |
| 6 | `user-matching` ×4 | v1 ดวงสมพงษ์ | S (v2 lane exists) |
| 7 | `survey/calculate` | v1 survey | S |
| 8 | `fortune-telling` | v1 fortune stick | S |
| 9 | `member-payment-code/check` | v1 profile, friend page | M |
| 10 | `ai/chat-streaming`, `ai/balance` | v1 MATE chat modal, credit counter | S (v2 chat on engine exists) |
| 11 | `omise/charge|promptpay|retrieve` | `/payment/*` v1 pages | freeze, S |

Fifteen further `endpoint.ts` constants and their wrappers have **no mounted
caller** (OTP, register-tel, register-line, check-line, card, ai/card,
fortune-stick GET, heaven-spirit-card, upload-slip, payment create, compat
POSTs) and are deleted, not ported.

**Two documents are wrong where it matters.** `docs/be-phase1-consolidation.md`
says BE `/consent` has no frontend caller (it is the only production writer of
`user.onboarded_at`) and that `chinese_horoscope.get` is migrated (its BFF still
returns 502 without BE); it never mentions `register-login` as the v2 login
dependency (`research/fe-call-sites.md` §7). `project_map.md` in BE names a
webhook route that does not exist.

**The chart port can be proven, not guessed.** `log_calculate` holds, for every
user who ever computed a chart, the inputs (date, time, gender) and the full
output JSON the BE produced. A replay harness can run the ported compute over
every row and diff against the stored result.

## Decisions — recorded 2026-09-18

**D1 · Chart compute is ported verbatim and proven by replay (path C).** The
owner chose 100% over speed. `POST /chinese-horoscope` is rewritten in
`mootech-fe` against Drizzle, preserving the exact JSON shape of
`log_calculate.result` and every side effect (`user` update, share JPEG to
Supabase Storage). Before the frontend route replaces the BE call, a replay
harness runs the port over every `log_calculate` row (or a large random sample
if the full table is too slow) and the diff must be empty, with every
non-empty diff explained and either fixed or accepted in writing. Replacing the
chart with the engine's `calculate` (path B) was rejected because
`/my-destiny` renders the full legacy JSON and would break for v1.

**D2 · v1 payment is frozen, not ported.** `/payment`, `/payment/creditcard`,
`/payment/qrcode/scan`, `/payment/callback` render the same `SalesClosedNotice`
the package pages already show. No Omise v1 code moves. Existing `member_payment`
rows keep working because their readers are already local.

**D3 · Dead code is deleted, not ported.** Constants, wrappers, and components
with no mounted caller are removed in slice 3.

**D4 · Superseded at revision 0.2.** `mumate-infra-move-001` now moves the
launched FE + BE + Bazi system as-is. BE therefore becomes a DigitalOcean
container in that workstream. This retirement plan stays paused until the
migration's observation period closes and the owner explicitly reopens it.

**Open questions the owner has not decided** (each has a proposed default the
slice will follow unless the owner says otherwise before that slice starts):

- **Q1 · LINE profile check at login.** BE verifies a LINE `sub` against the
  LINE Messaging profile API using the OA channel token
  (`be:src/user/user.service.ts:279-285`). Default: **drop it** — NextAuth
  already verified the LINE id token at OAuth time, so the check adds a
  dependency on `LINE_TOKEN` without adding trust. Slice 1.
- **Q2 · v1 MATE chat modal.** Default: **turn it off** (`NEXT_PUBLIC_ENABLE_CHAT=false`
  is already honoured) rather than port the Dify proxy; v2 chat on the engine
  is the product. Slice 3.
- **Q3 · v1 matching.** Default: **repoint the four v1 wrappers at the v2
  matching lane** (`pages/api/v2/matching/*`), which `mootech-fe#247` already
  planned; port only if the v2 lane cannot serve a v1 screen. Slice 3.
- **Q4 · member code redemption.** Default: **port** (money-adjacent, still
  used on the v1 profile). Slice 3.

## Execution slices and acceptance criteria

### 1. v2 stops needing the backend, except for the chart

Add `pages/api/identity/register-login.ts` (or under `/api/v2/`) implementing
the register-login contract from `research/consumers-and-decisions.md` §3:
lookup `user_provider` by `(id_token, provider)`; found → refresh email/picture,
ensure refer code; email match on another provider → link; first login →
insert `user`, `user_provider`, `log_activity` welcome row; return the same
response shape `{is_user_new, is_email, is_info, user_id, name, ref_code,
picture_url, is_refresh, result_code}`. Identity comes from the NextAuth
session on the server, never from the body. Q1 default applies. Repoint
`constants/api/endpoint.ts:55` to `localApi`.

Add migration for table `consent` (mirror of the BE entity) and promote the
Drizzle fallback in `pages/api/v2/onboarding.ts:62-74` to the production path;
delete the BE call and `CONSENT_SECRET`.

Add POST / PUT / PUT profile / GET new-friend to `pages/api/member-with-friend/`
(read and delete are already there), with the member/free quota read from
`member_payment` as BE does. Repoint `endpoint.ts:104-109`.

Add `pages/api/upload/profile-image.ts` writing to Supabase Storage with a
server-side service-role key (new env `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_STORAGE_BUCKET`), returning the same `s3_key`; or route through the
engine's existing avatar upload if its bucket and key shape match — decided in
the slice by reading both. Repoint `endpoint.ts:66`.

Slice 1 is done when: a fresh incognito login (LINE and Google) on the arena
creates `user` + `user_provider` rows through the frontend with
`NEXT_PUBLIC_BACKEND_URL` pointed at a dead host; v2 first-run completes and
`user.onboarded_at` is set; v2 compatibility can add and edit a friend with a
photo; `bun run typecheck` and `vitest run` are green; a unit test covers each
branch of register-login (found / link / new / orphan); the four BE constants
are `localApi`; and a draft pull request holds the change with no behaviour
change for anything not listed.

### 2. The chart moves, proven by replay

Port `POST /chinese-horoscope` and `GET /chinese-horoscope` (+ `share-profile`,
the two compatibility `check` GETs) into `lib/horoscope/` + `pages/api/chinese-horoscope*`
per D1. The 8-square arithmetic and the analytic lookups become plain functions
over Drizzle queries; the share card uses the same fonts and layout (node-canvas
or an equivalent that renders identically — decided in the slice by pixel
comparison on three fixtures). `log_calculate` and `user` writes match BE
column for column.

Build `scripts/horoscope-replay.ts`: read `log_calculate` rows (read-only
connection), run the ported compute with the stored inputs, deep-diff against
the stored `result`, print a summary and every differing path. Run it on the
arena database restored from the production dump.

Slice 2 is done when: the replay reports zero differences over the full table
(or the owner accepts a written list of explained differences); v1 register,
profile edit, my-destiny, share link, the public calculator, v2 register,
edit-birth, home and first-run all work on the arena with BE unreachable;
`pages/api/chinese-horoscope.ts` and `pages/api/calculator/compute.ts` no longer
reference BE; and a draft pull request holds the change.

### 3. v1 leftovers, payment freeze, dead code

Per Q2–Q4 defaults: repoint v1 matching to the v2 lane; port `survey/calculate`,
`fortune-telling`, `member-payment-code/check`, `ai/balance` display (or drop
the counter); turn off the MATE chat modal; apply D2 to `/payment/*`; delete the
fifteen dead constants, their wrappers and unmounted components; change
`lib/ops/health.ts` to stop reading Render; update `scripts/monitor` to stop
pinging BE.

Slice 3 is done when: `grep -rn backendURLGenerator` in `mootech-fe` returns
only `endpoint.ts`'s own definition; every v1 page in
`research/fe-call-sites.md` §6 works on the arena with BE unreachable, or is a
`SalesClosedNotice`; and a draft pull request holds the change.

### 4. The backend leaves the system

Remove `NEXT_PUBLIC_BACKEND_URL` from code and env (note `endpoint.ts:16-21`
throws at build time on a bazichart host — that guard goes too); remove
`CONSENT_SECRET`, `AI_CONSUME_SECRET`, `RENDER_API_KEY` from the frontend's
env contract; merge the slice PRs in the order 1 → 2 → 3 → 4 with the owner;
owner suspends the Render service; seven days of production with no error
attributable to BE; owner deletes the Render service and its env; archive
`mootech-be` on GitHub.

Slice 4 is done when: production has run seven days with Render suspended and
the frontend reports no BE-related error; the Render service is deleted; the
archived repository is recorded; and this workstream closes
`ready-for-owner-merge`.

## Authority boundary

- Merging to `mootech-fe` `main` is a production deploy and an owner action.
- Suspending or deleting the Render service, adding or removing Vercel env, and
  any Supabase Storage key are owner actions per instance.
- No route ported here may trust a `user_id` from the client where BE did; the
  session is the identity. Where a v1 page genuinely has no session (public
  share link, public calculator) the route stays public but read-only, as BE's
  was.
- The replay harness reads production data only through the arena restore or a
  read-only connection; it never writes.
- No secret value enters a repository file, event, pull request, or report.
- `mootech-be` code is read, never edited; its repository is archived, not
  deleted.

## Out of scope

The server move (`mumate-infra-move-001`); launching v2 (`#606`); retiring v1
screens; column-level schema parity beyond what the ported routes touch;
porting Omise v1, OTP/SMS, SendGrid email, the LINE morning crons, the employee
admin routes, or the migration route; changing the bazi engine.

## Rollback contract

Every slice ships behind the existing `endpoint.ts` seam: a route is repointed
from `backendURLGenerator` to `localApi` in one line, and repointing it back
restores the BE call while Render is still up. Render stays up through slice 3
and is only suspended (reversible) in slice 4; deletion waits seven quiet days.
`log_calculate` rows written by the port carry the same shape as BE's, so a
rollback of slice 2 leaves readable data. No table is dropped and no history
rewritten.
