# MuMate — retire `mootech-be`: every live responsibility moves into `mootech-fe`

**Workstream:** `mumate-be-retirement-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.4
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

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

## Revision 0.3 — re-measured after the v2 launch and the login flip (2026-09-27)

The owner asked on 2026-09-27 whether the backend can now be taken out, leaving
only `mootech-fe` and the engine. He said v2 is launched and **v1 is no longer
used at all**, and asked that the legacy calls be removed and the endpoints
closed in the same work, rehearsed completely on staging before production.
Four read-only research passes re-measured the system. They read FE `f3ba279`,
BE `0705378`, engine `origin/pdf-dev` `72ca612`, infra `bfbc59a`, and Render
production metrics and logs for 2026-09-20 → 2026-09-27. Their findings replace
the 2026-09-18 evidence wherever the two differ.

### What changed since 0.2

- **Login no longer uses the backend.** `register_or_login` was flipped to
  `/api/auth/register-login-fe` on production at 06:47 today
  (`mumate-login-identity-001` 6g, mootech-fe PR 828). Group #1 of the 0.2
  table is gone. The BE route stays live only as that flip's rollback, until
  its observation window closes on **2026-10-04**.
- **v1 is dead in use but alive by URL.** Only `/` redirects to `/v2`
  (`pages/index.tsx:36-37`). No middleware or `next.config` rule covers the
  other v1 routes. `/my-destiny`, `/register`, `/profile*`, `/friend/*`,
  `/matching*`, `/survey`, `/fortune-stick`, `/chinese-calendar`, `/share/*`,
  `/calculator`, `/welcome`, `/login` and `/payment/*` all still render. v2
  never links into v1. The BE logs agree: v1 matching and friend-list calls
  appeared once, on launch day 09-20, and never again.
- **D1's reason is gone.** The verbatim chart port existed because v1
  `/my-destiny` renders the full legacy JSON. v2 reads five values from the
  chart: year animal, day-stem element, day-stem yin/yang, the `element_cycle`
  row, and dob/time/gender. It also needs a non-empty `user.result_code` as its
  "registered" gate. No v2 screen reads the analytics, the 8-square cycles, the
  power scores, the share card or `share_img_profile_url`. The engine's
  `public-calc` plus two reference tables already in Supabase
  (`element_cycle`, `chinese_horoscope8_square_above`) cover every one of those
  values.

### v2's remaining backend dependencies: 7 call sites in 4 groups

| # | Dependency | v2 caller | Without BE today | FE replacement | Size |
|---|---|---|---|---|---|
| A1 | `POST /chinese-horoscope` (compute, writes `log_calculate` + `user`) | `/v2/register` (`useV2ProfileForm.ts:96`), `/v2/settings/edit-birth` (`EditBirthScreen.tsx:114`) | register cannot finish: every new member is stuck | FE route: engine `public-calc` + Drizzle lookups, subset JSON, the same `user` writes | M |
| A2 | anonymous `POST /chinese-horoscope` | `/v2/element-finder` via `pages/api/calculator/compute.ts:216` (new since 09-18) | error | derive the animal from the engine enrichment the route already fetches (`compute.ts:152`) | S |
| A3 | chart read (`GET`, via FE BFF `pages/api/chinese-horoscope.ts:74-85`) | `/v2` home mascot, `/v2/first-run` | home falls back to the default mascot; first-run shows "unavailable" | Drizzle `SELECT result FROM log_calculate WHERE code AND user_id` (BE's own query, `be:chinese-horoscope.service.ts:1340-1351`) | S |
| A4 | `POST /consent` | `/v2/first-run` via `pages/api/v2/onboarding.ts:79` | first-run gate loops | migration for `consent`; the existing Drizzle fallback (`onboarding.ts:62-74`, today non-production only) becomes the path | S |
| A5/A6 | `POST /member-with-friend`, `PUT /member-with-friend/profile` | `/v2/service/compatibility/[kind]` (`useCompatibility.ts:196,213`) | cannot add or edit a friend | FE POST + PUT beside the existing GET/DELETE, with BE's quota rule from `member_payment` | S–M |
| A7 | `POST /object-storage/upload-file` | friend photo in `AddFriendSheet.tsx:160` | cannot upload a friend photo | FE server route writing to Supabase Storage, needs a service-role key and bucket in FE env | S–M |

v1-only call sites: 19, all deleted rather than ported once v1 is retired.
Dead call sites: about 20 (OTP, register-tel/line, check-line, card, ai/*,
upload-slip, payment.create, compat POSTs, `consumeCredit`, `new_friend`).

### Production traffic, measured on Render (7 days to 2026-09-27 07:00)

- 11,921 requests in total. About 84% (roughly 1,440 a day) come from the
  owner's local pm2 `mootech-monitor`, which polls the BE root every 60 s. It
  also watches the FE, and it lives in the BE repository
  (`mootech-be/scripts/monitor`).
- Real traffic in the logs: register-login **442 calls in 09-20 → 09-26
  (UTC days), of which 200 (45%) were LINE `PROFILE_NOT_FOUND` rejections**
  and 125 were known-member logins; 109 first-time creations and 7 email
  links. These are attempts, not people, because one person may retry.
  Zero after the flip at 23:47Z; 48 chart computes plus 10 that failed with 500 in
  the share-card renderer; 7 + 7 v1 matching calls and 14 v1 friend lists,
  all on 09-20. In 7 days there was no call to `/ai/*`, fortune, survey,
  member-code, Omise, OTP, SMS or SendGrid.
- No third party calls the BE. The Omise webhook points at v2 and nothing
  arrived. BE has no LINE webhook or QStash. The engine does not call BE.
- The crons run and skip every day (`MORNING_CRON_ENABLED != true`). No
  scheduled writes.
- Render plan: standard (1 CPU / 2 GB), one instance, about 90 MB used.

### A finding that belongs to the login lane, recorded here because this research found it

Legacy `register-login` checked every LINE login against the LINE Messaging
API `/profile/{userId}` with the OA channel token
(`be:src/line-message/line-message.service.ts:12-24`,
`user.service.ts:279-285`). That API only knows users who have **added the OA
as a friend**. Everyone else was rejected with `PROFILE_NOT_FOUND`, and the FE
signed them out: 200 of 442 login attempts in the seven days before the
flip, about 29 a day. The FE route does not make
this call (0.2's Q1 default, never put to the owner). So since 06:47 today, a
LINE user who is not an OA friend can sign in and register. That is a product
change as well as a fix. It can also push new members per day above the
login lane's "3× baseline" rollback trigger for a benign reason. The owner
decides whether OA friendship should gate login (decision R11 below).
Production at 07:04: 0 new members since the flip.

### Data and schema the FE must own before the BE repository is archived

- `consent` table (+ `idx_consent_user_id`), `user.onboarded_at`,
  `user.onboarding_goal`: DDL exists only in
  `mootech-be/migrations/2026-08-09_onboarding-consent.sql:44-56`.
- `member_pay_as_use.balance`: DDL only in BE
  (`src/member-pay-as-use/migrations/2026-06-26-wallet-balance.sql:23-24`).
- A latent FE bug that the BE call currently hides: `/api/profile.ts:84-90`
  writes `"time" = NULL` for an unknown time, but `user.time` is NOT NULL, so
  the write fails silently. Today BE's recompute rewrites `time=''` afterwards.
  Any replacement writes `time=''`.

### Everything outside the app code (names only)

- FE env: `NEXT_PUBLIC_BACKEND_URL` (5 readers: `endpoint.ts:14`,
  `onboarding.ts:31`, `chinese-horoscope.ts:19`, `compute.ts:19`,
  `wallet-client.ts:6`), `CONSENT_SECRET`, `AI_CONSUME_SECRET`,
  `CREDIT_ENFORCE`, `RENDER_API_KEY`. Also `.env.example`, `Dockerfile`,
  `container-build.yml:64` and the GitHub Environment variable, with
  `scripts/env-example-drift.test.ts` enforcing that they change together.
- Ops: `lib/ops/health.ts` reads Render and folds `health.be` into `/ops`
  overall health. `scripts/ops-health.test.ts`, the consent tests, e2e and
  testenv all expect a BE on :4000.
- Infra: `docker-compose.yml:7` requires `BE_TAG` for **every** compose
  command, and `deploy.sh`/`rollback.sh` run `up -d --remove-orphans`, which
  restarts `be` unless it is moved to a profile. `ops-status.sh` loops over
  `be`. The Caddy `api.staging.mumate.co` site and the Grafana synthetic check
  `mumate-be-staging` also depend on it.
- Production BE has no custom domain. It is only `mootech-be.onrender.com`,
  so there is no mumate.co DNS record to remove.

### Decisions proposed in 0.3 (open until the owner decides)

- **R1 · Retire v1 by redirect, then delete it.** One middleware rule
  redirects every v1 route to its v2 counterpart, or to `/v2`; for example
  `/calculator` goes to `/v2/element-finder`, and `/payment/*` and `/share/*`
  go to `/v2`. The v1 pages, components, wrappers and their 19 BE call sites
  are deleted in the same slice. Supersedes D2 (payment freeze) and D3.
- **R2 · Chart: engine plus a small FE writer, staged.** Replaces D1. Ship the
  Drizzle read first, then the writer. Existing `log_calculate` rows are never
  rewritten; new rows carry the subset. The proof is a replay restricted to
  the fields v2 reads.
- **R3 · Engine wins where it disagrees with the legacy chart.** For example,
  births near 3-5 Feb or between 23:00 and 24:00. The replay counts these. They
  affect only new charts and edits, because stored rows are kept.
- **R4 · Friend photos:** an FE server route to Supabase Storage with a
  service-role key the owner adds to Vercel, rather than moving photos to the
  engine's avatar model.
- **R5 · Uptime monitoring:** drop the BE target from the pm2 monitor, and
  move FE monitoring out of the BE repository (for example, into the existing
  Grafana synthetic checks) before the repository is archived.
- **R6 · Production order:** the FE changes may reach production before
  2026-10-04. Anything that removes the flip's rollback path
  (`backendURLGenerator`, `NEXT_PUBLIC_BACKEND_URL`) and the Render suspend
  wait until the login lane's observation closes on 2026-10-04.
- **R7 · Render:** suspend, then seven quiet days, then delete. Archive the
  GitHub repository; never delete it. Rotate BE-only credentials (SendGrid,
  8x8, Dify, expired v1 Omise); check before rotating any shared ones (DB
  role, Supabase service key, LINE token).
- **R11 · LINE OA friendship at login** (login lane, live now): either keep
  the check dropped, or restore it in the FE route.

## Revision 0.4 — the owner's answers (2026-09-27)

The owner answered 0.3's proposals on the same day. Where an answer differs
from a proposal, the answer wins and the slices below are edited to match.

- **R1 → disable v1, do not delete it.** "ไม่ต้องลบ code แต่ทำให้ใช้ไม่ได้" (don't
  delete the code; make it unusable). One middleware rule redirects every v1
  route. The v1 code stays in the tree, unreachable; git history holds it
  anyway. Deleting it is an optional cleanup for later, not part of this plan.
  Consequence: the seam closes by making code **unreachable** and removing the
  env, not by deleting every BE constant. Unreachable v1 code may still name
  `backendURLGenerator`.
- **R2/R3 → v2 becomes bazi-only.** The owner asked whether v2 is not already
  pure bazi. Checked in code at `f3ba279`: v2's content (fortune, element,
  destiny, matching) is from the engine. The legacy chart is still used in
  three places:
  1. the "registered" gate: register needs BE's `result.code`
     (`useV2ProfileForm.ts:96-114`), and home sends anyone without
     `user.result_code` to `/v2/register` (`useV2Home.ts:131-135`);
  2. the home mascot's **animal**: `animalFromCompute(computeSource)` reads
     BE's stored chart (`pages/v2/index.tsx:90`), while the element already
     comes from the engine persona;
  3. first-run's mascot and six-facet `elementCycle`, read from BE's stored
     chart (`useFirstRunSource.ts:75-80`).

  So slice 1 takes 0.3's option C1: home and first-run derive the animal,
  day stem and the `element_cycle` row **live from the engine** for every
  member, existing and new. Register and edit-birth write the `user` columns
  and mint `result_code` as the "registered" flag, with a minimal
  `log_calculate` row kept only for the ops calc count. After slice 1, v2
  reads no legacy chart. The replay becomes a measurement shown at staging
  acceptance: how many existing members' mascot animal or `element_cycle` row
  would change (births near 3-5 February and 23:00-24:00 are expected). It
  is not a port-fidelity gate.
- **R4 → yes.** Friend photos go to Supabase Storage through an FE server
  route. The owner adds the service key to FE env.
- **R5 → drop the BE target; keep production watched.** The owner expected
  the new setup to cover it. Checked: `mumate-infra`
  `observability/grafana/synthetic-checks.json` probes only the three
  `*.staging.mumate.co` hosts. Production FE (`bazichart.mumate.co`) is
  watched today only by the pm2 monitor. The BE target leaves the pm2
  monitor. Production FE and bazi checks are added to the Grafana synthetic
  checks before the pm2 monitor itself is retired, so production is never
  unwatched.
- **R6 → staging first; production is decided afterwards.** The owner wants
  staging to be convincing before choosing what production does, and when.
  This plan authorizes slices 1-3 (staging) one slice at a time. Slice 4 is
  re-planned with the owner after slice 3's acceptance.
- **R7 → agreed in principle, decided last.** Suspend, then seven quiet days,
  then delete. The repository is archived, not deleted. BE-only credentials
  are rotated. The owner confirms each irreversible step at the end, after
  the removal has held, keeping rollback open until then.
- **R11 → recorded in the login lane** as owner decisions 30-31: no OA-friendship
  gate, and the volume trigger raised to ~80 a day.

## Execution slices and acceptance criteria

**Rewritten in revision 0.3.** The 0.2 slices ("v2 stops needing the backend,
except for the chart"; "the chart moves, proven by replay"; "v1 leftovers";
"the backend leaves") assumed v1 had to keep working and that login still ran
on the backend. Neither is true now. Their acceptance ideas survive where they
still apply; their text is superseded. Every slice is rehearsed on the shadow
over the arena before it reaches production. That is the pattern
`mumate-login-identity-001` slice 6 proved on 2026-09-27: FE and engine on a
restored copy of production, with row counts, Caddy logs and
`pg_stat_activity` as the proof.

### 1. v2 stops needing the backend

One mootech-fe pull request, on one topic branch:

- **1a Mascot and element cycle from the engine (S–M, rev 0.4).** Home and
  first-run stop reading the stored chart. The animal, day stem and
  `element_cycle` row come live from the engine on the member's merged birth.
  `pages/api/chinese-horoscope.ts` no longer calls BE: it either goes, or
  answers from Drizzle for any remaining reader.
- **1b Chart write (M).** A session-bound FE `POST` computes through the
  engine's `public-calc`: year branch, then `yearBelow`; day stem, then element
  and power via `chinese_horoscope8_square_above`; then `element_cycle` by
  (element, power, gender). It inserts `log_calculate` with a subset JSON that
  keeps the paths v2 reads. It updates `user` (`dob`, `time` = `''` when
  unknown, `is_remember_time`, `gender`, `result_code`, `is_refresh=false`,
  `name`, `surname`, `account_name`) and returns `{ code }`. Register and
  edit-birth point at it. The `/api/profile` `time=NULL` bug is fixed in the
  same change.
- **1c Element finder (S).** `compute.ts` builds the animal from the engine
  enrichment and stops calling BE.
- **1d Consent (S).** An FE migration for `consent` (a mirror of BE's DDL,
  idempotent against the existing table). The Drizzle path in `onboarding.ts`
  becomes the production path. `CONSENT_SECRET` and the BE call go.
- **1e Friends (S–M).** `POST /api/member-with-friend` and
  `PUT /api/member-with-friend/profile`, bound to the session, with BE's
  member/free quota rule read from `member_payment`.
- **1f Friend photo (S–M).** A server route that stores the image in Supabase
  Storage and returns the same key shape (R4).
- The seven v2 constants become `localApi`.

DoD 1:

| # | Criterion | Proof |
|---|---|---|
| B1 | No v2 page or v2 API route reaches BE: `/v2/register`, edit-birth, home, first-run, element-finder, compatibility add/edit with photo | code search + staging walk with BE stopped (slice 3) |
| B2 | Measurement on the arena: for every member's current chart, how many would show a different mascot animal or `element_cycle` row under the engine, counted and classified (new-year boundary, 23:00 boundary, other) | report shown at staging acceptance (rev 0.4) |
| B3 | A member created through the FE route has the same `user` columns and `log_calculate` shape v2 needs as one created through BE; `time` is never NULL | tests + arena rows |
| B4 | Consent: first-run completes and writes `consent` + `onboarded_at` in a production-mode build | tests + staging walk |
| B5 | Friend add/edit respects the member/free quota exactly as BE did; photos land in Storage and render | tests + staging walk |
| B6 | Tests, typecheck, lint, build (VAPID gate) and gitleaks pass; the PR carries both templates | CI + local |

### 2. v1 retires, and the legacy seam closes

A second mootech-fe pull request, stacked on slice 1:

- **2a Disable v1 (R1, rev 0.4).** One middleware rule maps every v1 route
  to its v2 counterpart or to `/v2`, and is tested route by route. The v1
  code stays in the tree, unreachable; deleting it is optional later
  cleanup.
- **2b Close the seam.** No reachable code calls BE. Every server-side BE
  reader (`onboarding.ts`, `chinese-horoscope.ts`, `compute.ts`,
  `wallet-client.ts` via `/api/chat/balance`) is removed or unreachable, and
  `NEXT_PUBLIC_BACKEND_URL` leaves the env contract. Unreachable v1 code may
  still name `backendURLGenerator`, which then points nowhere.
  `CONSENT_SECRET`, `AI_CONSUME_SECRET`, `CREDIT_ENFORCE` and `RENDER_API_KEY`
  leave the code and `.env.example` in the same commit, so
  `env-example-drift` stays green.
- **2c Ops and tests.** `lib/ops/health.ts` and `/ops` stop reading Render. The
  consent, ops-health, e2e and testenv expectations of a BE on :4000 are
  rewritten or removed. The Render cold-start comment in `mint-member.ts`
  goes. The docs are corrected: `project_map.md`, `MUMATE-GITHUB-FLOW.md`,
  `docs/be-phase1-consolidation.md` (retired) and
  `docs/auth/register-login-fe-parity.md`.

**2b removes the login flip's rollback path, so this PR merges only after
2026-10-04 (R6).**

DoD 2:

| # | Criterion | Proof |
|---|---|---|
| V1 | Every former v1 route answers a redirect to its mapped v2 target; no v1 page renders | route-table test + staging walk of every v1 URL |
| V2 | No reachable page or API route can call BE: every remaining reference to `backendURLGenerator` or `ENDPOINT` sits in a v1 file behind the redirect, and is listed | reachability list in the PR body |
| V3 | The served client bundle carries no BE host and no BE path | bundle probe on staging, then production |
| V4 | `/ops` overall health no longer depends on Render | test + screen |
| V5 | Tests, typecheck, lint, build and gitleaks pass; both templates filled | CI + local |

### 3. Rehearse "BE gone" on staging

Infra and the shadow (mumate-infra PR plus host steps, all on staging):

- Compose: `be` moves to a profile and `BE_TAG` becomes optional
  (`${BE_TAG:-unset}`). `ops-status.sh` stops looping over `be`.
  `.githooks/pre-push` drops `BE_TAG`.
- Caddy: `api.staging.mumate.co` becomes a **logging tombstone** answering
  410. That keeps it out of the 5xx-burst alert, while any leftover call still
  lands in the access log. Grafana's `mumate-be-staging` check is paused.
- `arena.sh up` from the latest backup. FE and bazi point at the arena (env
  backups with written reverse steps, as on 2026-09-27). `be` is stopped and
  stays stopped across deploys.
- The FE image is built from the slice 1+2 branch (`container-build`,
  `target=staging`), keeping the staging `NEXT_PUBLIC_BACKEND_URL` until 2b
  removes it, so nothing falls back to `localhost:4000` in a tester's browser.
- The owner walks: a new member through LINE and through Google, register,
  first-run and consent, home mascot, edit birth (with an unknown time),
  element-finder signed out, compatibility add plus edit plus photo, the
  existing-member login, and every v1 URL (it must redirect).

DoD 3:

| # | Criterion | Proof |
|---|---|---|
| S1 | During the walk window, the Caddy access log shows **0** requests to `api.staging.mumate.co` (apart from paused probes), `be` is not running, and the arena's `pg_stat_activity` shows only fe and bazi | logs, `docker compose ps`, pg_stat_activity |
| S2 | Every walk passes, with arena row counts matching (one new member per new-account walk, no member without a provider, consent row written, friend and photo rows present) | walk results + counts |
| S3 | The bundle probe on staging finds no BE host or path | probe |
| S4 | The shadow is returned (env restored, arena down) with reverse steps proven, and the compose profile change is left in place | health + `arena.sh status` |
| S5 | The owner accepts the rehearsal | record |

### 4. Production: the backend leaves the system

**Re-planned with the owner after slice 3 is accepted (R6, rev 0.4).** The
sequence below is 0.3's proposal and is kept as the starting point, not as an
authorization. In order, each step an owner action or gated on one:

1. Merge PR 1 (may precede 2026-10-04, R6). Verify that the deployment exists
   and carries the change (bundle probe, not assumption). The owner walks
   register, first-run and compatibility; row counts are taken.
2. On or after 2026-10-04, once the login lane's 6h has closed: merge PR 2 and
   verify the same way.
3. Remove the FE env keys from Vercel (all environments) and the GitHub
   Environment variable, then redeploy and probe.
4. Drop the BE target from the pm2 monitor, and move FE uptime monitoring
   (R5). Confirm in Omise that no webhook targets BE.
5. **Suspend** the Render service (reversible). Seven quiet days: Render
   metrics show no non-monitor traffic, and the FE shows no BE-related error.
6. **Delete** the Render service (irreversible). Archive `mootech-be` on
   GitHub, after copying its `consent` and `balance` DDL into
   `mootech-fe/lib/db`. On the DO host, remove the `be` service from compose
   (mumate-infra PR), the container, and `env/be.env` with its `.bak` copies.
   Rotate the BE-only credentials (R7).

DoD 4:

| # | Criterion | Proof |
|---|---|---|
| P1 | PR 1 and PR 2 live; production bundle carries no BE host or path | probe per deploy |
| P2 | Production walks pass with row counts | walk + counts |
| P3 | Seven days with Render suspended: no non-monitor request reached it and no FE error names BE | Render metrics + FE logs |
| P4 | Render deleted, repository archived, host and env cleaned, BE-only credentials rotated | record, with names only |
| P5 | This workstream closes `ready-for-owner-merge` | closeout |

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
