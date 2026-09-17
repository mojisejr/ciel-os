# mootech-be retirement — consumers outside the frontend, v1 money, identity contract, prior decisions (read-only, 2026-09-18)

Measured against: `mootech-be` main `57da359`, `mootech-fe` main `1312292`, `bazi-sft-dataset` pdf-dev `04bc2bd`, ciel-os `hq/20260917`. Produced by a read-only research agent on the owner's instruction; nothing was modified. GitHub issues were read with `gh issue view`.

## 1. Consumers of mootech-be other than the frontend

| Consumer | Verdict | Evidence |
|---|---|---|
| bazi-sft-dataset (engine) → BE | **None.** Grep for `onrender|mootech-be|BACKEND` hits only docs/comments. Engine's own map: "bazi ⟂ BE: no direct code dependency" | `bazi-sft-dataset/project_map.md:9,14,24`; `src/app/api/bazi/public-calc/route.ts:159` (comment) |
| BE → engine (reverse) | BE *can* call the engine for pair matching when `MATCHING_ENGINE=bazi` (default `legacy`) | `mootech-be/src/matching/bazi/bazi-pair.adapter.ts:15,20` |
| Omise webhook (inbound) | **The only third-party inbound route:** `POST /omise/webhook`, raw-body + HMAC | `mootech-be/src/main.ts:31-38`; `src/omise/omise.controller.ts:49-57` |
| LINE Messaging webhook / LIFF → BE | **No.** BE has no LINE controller; `line-message` is outbound only. The LINE bot webhook lives in the engine (`bazi/src/app/api/webhooks/line`) | `mootech-be/src/line-message/` (service+module only) |
| SMS (8x8) / SendGrid callbacks | **No.** `POST /sms` and `POST /email` are FE-triggered senders | `src/sms-sender/sms-sender.controller.ts:5-9`; `src/send-grid/send-grid.controller.ts:13-17` |
| Google/Facebook OAuth callbacks | **No.** NextAuth handles OAuth entirely in FE | `mootech-fe/pages/api/auth/[...nextauth].ts:36-53` |
| Mobile app | **None found** — UNVERIFIED beyond grep | — |
| Cron / pingers | (a) Render health check on `GET /`; (b) a **local pm2 monitor** polls `https://mootech-be.onrender.com` every ~60 s and posts Discord cards — will alarm "down" the day BE is retired | `mootech-be/render.yaml:17`; `scripts/monitor/README.md:1-18` |
| `project_map.md` drift | Says `POST /callback/omise`; real route is `/omise/webhook` | `mootech-be/project_map.md:90,159` |

**Hidden third-party dependency inside register-login:** for `provider == 'LINE'`, BE calls the LINE Messaging API `GET {LINE_HOST}/profile/{userId}` with the OA channel token and returns `{ok:false, reason:'PROFILE_NOT_FOUND'}` on 404 — the FE self-heal then **signs the user out**. Porting identity means either carrying `LINE_TOKEN` into FE or dropping the check. `mootech-be/src/user/user.service.ts:279-285`; `src/line-message/line-message.service.ts:12-45`; `mootech-fe/lib/auth/use-self-heal-identity.ts:134-142`.

## 2. Payments in v1

**Flow today (all in BE, no auth on any route):**

| Step | Route | Writes | Cite |
|---|---|---|---|
| Card | `POST /omise/charge` → amount from `payment_package` → `omise.charges.create` | `payment` row PENDING | `omise.service.ts:46-57,121-182`; `payment.service.ts:67-95` |
| PromptPay | `POST /omise/promptpay` → source + charge with `metadata.orderId` | `payment` | `omise.service.ts:60-114` |
| Poll | `POST /omise/retrieve` | – | `omise.controller.ts:12-16` |
| Webhook | `POST /omise/webhook` — HMAC-SHA256, `charge.complete`/`charge.create` → approve/reject by order_id; idempotent on terminal status | see approve | `omise.service.ts:190-292` |
| Approve | `payment.status=APPROVED`; SendGrid receipt; FAMILY → `payment_code` + `member_payment_code`; MEMBER/FAMILY → `member_payment` + `_log`; PAYASUSE → `member_pay_as_use` | | `payment.service.ts:199-350` |
| Manual | `POST /payment`, `GET /payment`, `POST /payment/approve|reject` (unauthenticated admin ops) | | `payment.controller.ts:12-34` |

Webhook URL shape Omise would be registered with: `https://mootech-be.onrender.com/omise/webhook`. Known defect: handles only one signature; Omise sends two after a secret roll (`ciel-os/memory/events/2026/09/09/20260909T144000_payment_lane_webhook_root_cause.yaml:37-40,88-91`).

**Is v1 money still live? Effectively no:**
- Sales entrances closed 2026-08-24 (mootech-fe#376 CLOSED): lifetime 18 successful payments / ฿3,890; 2026-08: 1 × ฿60; 2026-07: 1 × ฿200; May 2026 failure rate 82%. `pages/payment/**` left reachable by direct URL, accepted knowingly.
- BE runs on an **expired Omise live secret key** (403 `key_expired_error`) — `…20260909T090000_payment_lane_session_record.yaml:19-26,102-104`.
- The account's single **live static webhook now points at the v2 endpoint** — `…20260909T193600_payment_lane_webhook_accepted.yaml:85-89`. Last 200 delivery to BE: 2026-08-17.
- Owner decisions recorded: "v1 is being retired … work that exists only to keep v1 taking money is out of scope" (`…091300_payment_lane_focus_narrowed_to_v2.yaml:20-23,68`; `…092500_payment_lane_revision_03_authorized.yaml:15-16,35-37,75`).

**Conclusion:** v1 payment can be **frozen, not ported**. Current payment volume through BE since 2026-08-24: UNVERIFIED (needs `payment` rows or Render logs). Open consequence: existing v1 subscriptions (`member_payment` rows) and mid-purchase users.

## 3. Identity contract (`POST /user/register-login`)

**Request** (JSON; `callApi` sends empty `Authorization`/`x-api-key`): `{ idToken, image, email, name, provider, refer_code }` — `mootech-be/src/user/dto/user-register-with-email.input.ts`; `mootech-fe/constants/api/api-user-register-or-login.ts:13-22`; `utils/fetch.ts:21-25`.
- `idToken` = LINE `lineProfile.sub`, else NextAuth `session.providerId` (= `account.providerAccountId`); `provider` = `"LINE"` | `session.provider`; email empty for LINE — `mootech-fe/lib/auth/register-params.ts:26-60`; `pages/api/auth/[...nextauth].ts:58-82`.

**Response** (200 always): `{ is_user_new, is_email, is_info, user_id, name, ref_code, picture_url, is_refresh, result_code }` or `{ok:false, reason, status, line}` for LINE profile failure — `user.service.ts:335-360,373-385,465-476`.

**BE logic / tables** (`user.service.ts:259-477`):
1. `user_provider` lookup by `(id_token, provider)` — `user-provider.service.ts:81-89`.
2. Found → update email/picture on `user`, `ensureReferCode` (20 random A–Z, saved), optional `addFriend` (`user_friend_get_friend`).
3. Not found, email matches another provider → insert `user_provider` linking to existing `user`.
4. First time → insert `user` (`refer_code`, `create_at/update_at/login_at` = `YYYY-MM-DD HH:mm:ss`, empty dob/time/place/result_code) → insert `user_provider` → insert `log_activity` `{activity_id:1, point:20}` — `user.service.ts:425-462`.
- Orphan provider (user deleted) → returns nulls — `user.service.ts:362-385`.
- Column lists: `user` — `src/user/entity/user-entity.model.ts:6-76`; `user_provider` — `src/user-provider/entity/user-provider-entity.model.ts:6-30`. Both declared in FE Drizzle.

**No JWT.** BE has no `@nestjs/jwt`/passport, no guards. Every BE route trusts body/query `user_id`. FE sets client cookies `MEMBER_ID/MEMBER_NAME/MEMBER_REFER_CODE/MEMBER_IMAGE` from the response (`use-self-heal-identity.ts:158-161`; `pages/index.tsx:187-206`); v1 pages send `MEMBER_ID` as `user_id` on later calls (forgeable — `lib/v2/resolve-user.ts:8-10`). v2 API routes derive identity from the signed NextAuth JWT → `user_provider.id_token`, with UUID `MEMBER_ID` fallback verified against `user` (`resolve-user.ts:56-89`). Self-heal retries with 10 s then 70 s timeouts for Render cold start (`use-self-heal-identity.ts:37-41,127-132`).

## 4. Prior decisions already recorded

**`mumate-be-decoupling-001/PLAN.md`**: revision 0.3, state paused, 2026-09-06. Six v2→BE dependencies ranked (:80-86): onboarding→`/consent`; self-heal→`/user/register-login`; useCompatibility→`/member-with-friend`; hybrid BFF→`GET /chinese-horoscope`; useV2ProfileForm→`POST /chinese-horoscope`; wallet-client→`/ai/balance`,`/ai/consume`. Settled consent scope (:25-39, :249-269): only first-run's `user_id`-keyed acceptance moves to FE; the five engine `anon_id` purposes stay; `kind:'pdpa'` overlap accepted. Two findings contradicting `docs/be-phase1-consolidation.md` §I (:111-116, :123-131). Explicit: "does not launch v2 and does not retire mootech-be" (:41).

**CIEL events:** decoupling opened/paused 2026-09-06; owner 2026-09-09: "v1 is being retired … mootech-be not touched unless v2 provably needs it"; "drop v1 must not be read as shut down Render" (`…091300…yaml:89-93`); infra-move baseline 2026-09-17: cutover order bazi → be → fe, BE rides to DO as third container (now superseded by this workstream).

**GitHub issues:**
- **#247** (OPEN): launch = remove `guardV2`; owner 2026-08-30: leave v1 screens (9 BE calls for compatibility) until launch — then flip `endpoint.ts:110-115` to `localApi` or delete v1 screens; `re_calculate` has no v2 route; "merge BE before FE always"; cut `MATCHING_LIMIT.FREE` in BE and FE together; 2026-09-08: deleting `guardV2` also deletes the Omise webhook exemption → blocker B1 in #606.
- **#606** (OPEN, 2026-09-08): launch order: maintenance ON → `/`→`/v2` → drop passkey → maintenance OFF; gated on #605. Owner: "v1 ยังอยู่ แต่ user ไม่สามารถเข้าถึงได้". 27 v1 top-level routes; v1 traffic not measured. Says v1 sales already closed (#376).
- **#637 §3** (proposed): "ตัด BE ได้ไหม — ยังไม่ได้ · ต้องย้าย 4 อย่างก่อน" — the four v2 dependencies with S/M sizes; v1-only list; "ห้ามตัด Render ก่อน 4 ข้อนี้เสร็จ". Render 7-day: 0.001 CPU, ~120 MB, ~1,400 req/day mostly health checks. #637 says plan standard; `render.yaml:15` says starter — UNVERIFIED which is live.

## 5. Data owned only by BE

- TypeORM entities: 85; FE `lib/db/schema.ts` declares 101 `pgTable`s. **Only one BE table is missing from FE: `consent`** (`id uuid, user_id text, accepted_at text, policy_version text`, index on user_id) — created by `migrations/2026-08-09_onboarding-consent.sql:40-48`.
- Seed/reference data BE ships: **none as JSON/SQL/CSV** in `src/` or `assets/` (only fonts/images). Reference values live in code constants that FE would need to mirror: `src/constants/{payment-package,payment-plan,payment-topup,email-template,matching-limit,ai-limit,fortune-limit}.ts` (e.g. `MATCHING_LIMIT.FREE=100`, SendGrid template ids). Chart logic is code, not data: `src/chinese-horoscope/chinese-horoscope.service.ts` (1,380 lines) — the "TRAP: do NOT switch" contract per `mootech-fe/docs/be-phase1-consolidation.md:77-82`.
- One-off SQL: `src/member-pay-as-use/migrations/2026-06-26-wallet-balance.sql`, `supabase-migration/*.sql`, `scripts/phase3-backfill-urls.sql`.

## 6. Runtime / infra facts

- **Render blueprint** `mootech-be/render.yaml`: web, docker, branch main, region singapore, plan starter, `healthCheckPath: /`, `autoDeploy: true`. Non-secret: `ENVIRONMENT, APP_DEBUG, DB_TYPE, DB_SYNCHRONIZE=false, AWS_S3_SIGNED_URL_TIMEOUT, SMS_8X8_ENCODING`. `sync:false` secrets: `DB_*`, `AWS_*`, `SENDGRID_*`, `SMS_8X8_*`, `LINE_HOST`, `LINE_TOKEN`, `OMISE_PUBLIC_KEY`, `OMISE_SECRET_KEY`, `OMISE_RETURN_URI`, `DIFY_API_KEY`, `DIFY_API_URL`, `CORS_ORIGINS`. `MIGRATION_ENABLED` deliberately unset.
- **Env read by code but absent from render.yaml** (must exist on the dashboard or default): `AI_CONSUME_SECRET, CONSENT_SECRET, CREDIT_ENFORCE, MORNING_CRON_ENABLED, OMISE_WEBHOOK_SECRET, PV_TIMEOUT, SUPABASE_PROJECT_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET, SUPABASE_SIGNED_URL_TIMEOUT, BAZI_BASE_URL, BAZI_PAIR_TIMEOUT_MS, MATCHING_ENGINE, APP_PORT, PORT`.
- **Dockerfile**: `node:19-alpine`, apk cairo/pango/jpeg/giflib/rsvg, IBM Plex Thai font fetched from GitHub at build, `EXPOSE 3000`, `CMD npm run start:prod`. `main.ts:45-46` binds `PORT || APP_PORT || 3000`.
- **Cron**: two `@Cron` jobs (06:00 member LINE multicast, 09:00 free) — **default OFF** unless `MORNING_CRON_ENABLED=true`. Whether set on Render: UNVERIFIED.
- **CI**: `.github/workflows/main-guard.yml`, `secret-scan.yml`; deploy = merge to main. Last commit 2026-08-18.
- **Local monitor**: `scripts/monitor/` pm2 process polls FE + BE + Render metrics → Discord.
