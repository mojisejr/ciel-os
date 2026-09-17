# mootech-be inventory (read-only audit, 2026-09-18)

Repo: `/Users/non/ghq/github.com/mojisejr/mootech-be` @ `57da359` (NestJS 9, TypeORM 0.3, Postgres/Supabase). Paths relative to that root. Produced by a read-only research agent on the owner's instruction; nothing was modified.

Global facts used throughout:
- No global prefix: `src/main.ts` has no `setGlobalPrefix`. Routes are exactly `@Controller(prefix)` + method path.
- No guards anywhere: grep for `UseGuards|CanActivate|jwt|passport|APP_GUARD|ValidationPipe` over `src/` returns nothing. No DTO validation pipe either.
- Only three request-level checks exist: `x-ai-secret` header (`src/ai/ai.service.ts:213-222`), `x-consent-secret` header (`src/consent/consent.service.ts:37-45`), Omise HMAC webhook signature (`src/omise/omise.service.ts:210-233`). Everything else is open.
- CORS is restricted to `CORS_ORIGINS` (default `http://localhost:3000`) with credentials (`src/main.ts:20-24`). This is the only thing limiting browser callers; curl is unrestricted.
- Body limit 100 MB JSON on all routes except `/omise/webhook` which gets `express.raw` (`src/main.ts:29-34`).
- Port: `PORT` → `APP_PORT` → 3000, bound `0.0.0.0` (`src/main.ts:38-39`).

## 1. Endpoint inventory

Size key: S <2h, M half-day, L 1-2 days, XL >2 days. "Auth" = none unless stated. Table names are TypeORM default snake_case of the entity class (see §6).

### app (root)
| Controller | Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|---|
| `src/app.controller.ts:8` | GET `/` | none | Health / hello string (`src/app.service.ts`). Render healthCheckPath (`render.yaml:15`) | – | – | S trivial |

### ai (`src/ai/ai.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| POST `/ai/fortune-stick` (`:21`) | none | Oracle-card AI answer: yearly usage gate (`ai.service.ts:57-137`, `AI_CHAT_LIMIT.FREE_FORTUNE=3`), then POST to hardcoded n8n webhook `https://n8n.chatify.cloud/webhook/mumate-oracle-agent-blocking` (`ai.service.ts:321-345`), logs to `log_ai` (`:271`) | R `member_payment`, `member_pay_as_use`, `log_ai`; W `log_ai` | n8n (hardcoded URL) | M |
| POST `/ai/chat` (`:29`) | none | General bazi chat: wallet gate (`checkWalletGate` `:178-211`), builds bazi profile from `log_calculate.result` JSON (`:552-660`), POST to Dify blocking (`callAiChat` `:375-437`), logs | R `member_payment`, `member_pay_as_use`, `user`, `log_calculate`, `log_ai`; W `log_ai`, `member_pay_as_use` (lazy wallet seed `:167-173`) | Dify (`DIFY_API_URL`, `DIFY_API_KEY`) | L |
| POST `/ai/chat-streaming` (`:35`) | none | Same but streams Dify SSE to `res` (`chatAIStreaming` `:700-861`, `callAiChatStream` `:438-531`) | same | Dify | L |
| GET `/ai/balance/:user_id` (`:45`) | none | Wallet balance info (`getBalanceInfo` `:139-176`); seeds a wallet row if none | R `member_payment`, `member_pay_as_use`, `log_ai`; W `member_pay_as_use` | – | S |
| POST `/ai/consume` (`:52`) | header `x-ai-secret` == `AI_CONSUME_SECRET` (`:213-222`) | Spend one credit atomically (`member-pay-as-use.service.ts:70-90` raw `UPDATE … WHERE balance>0 RETURNING`) | W `member_pay_as_use` | – | S |

### card (`src/card/card.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| POST `/card` (`:16`) | none | Generate 1080x1920 JPEG share card with node-canvas (`card.service.ts:21-169`), returns Buffer as JSON | – | Fetches arbitrary `mascotUrl` via `loadImage` (`card.service.ts:57`) – SSRF-shaped | M (fonts in `src/assets/fonts`, images in `public/images/mumate`) |
| POST `/card/preview` (`:26`) | none | Same, responds `image/jpeg` inline | – | same | (same work) |

### chinese-horoscope (`src/chinese-horoscope/chinese-horoscope.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| POST `/chinese-horoscope` (`:13`) | none | Full 4-pillar (bazi) chart + all analytics, mascot, element cycle, decade cycle; if `user_id` given also generates share card, uploads to Supabase Storage, writes `log_calculate`, updates `user` (`chinese-horoscope.service.ts:124-984`, side effects `:919-978`); optional family code redemption `:132-138` | R ~40 seed tables (all `chinese_horoscope8_square_*`, `calendar100_year`, `analytic_*`, `power_*`, `prediction_work*`, `mascot_v2`, `scared_thing`, `color`, `element_cycle`); W `log_calculate`, `user`, `member_payment_code_log` | Supabase Storage (share image) | XL – ~860 lines orchestration + 810 lines 8-square + card |
| POST `/chinese-horoscope/compatibility-love` (`:21`) | none | Love compatibility: bazi engine first if `MATCHING_ENGINE=bazi` (`:1069-1095`), else legacy (two charts + `compatibility_love*` lookup `:1123-1168`); writes log + user counter | R chart tables + `compatibility_love`, `compatibility_love_rating`, `compatibility_love_description`; W `log_love_mate`, `user`, `log_activity` | bazi engine HTTP (`BAZI_BASE_URL`) | L |
| GET `/chinese-horoscope/compatibility-love` (`:29`) | none | Usage check: counts `log_love_mate` vs membership (`isCheckCompatibilityLove` `:1313-1338`) | R `user`, `member_payment`, `log_love_mate` | – | S |
| POST `/chinese-horoscope/compatibility-work` (`:37`) | none | Work/friend/boss compatibility, same pattern (`:1171-1284`) | R chart + `compatibility_work*`; W `log_work_vibe`, `user`, `log_activity` | bazi engine | L |
| GET `/chinese-horoscope/compatibility-work` (`:45`) | none | Usage check (`:1286-1311`) | R `user`, `member_payment`, `log_work_vibe` | – | S |
| GET `/chinese-horoscope` (`:53`) | none | Fetch saved chart by `code`+`userId` → `{data}` (`:1340-1351`) | R `log_calculate` | – | S |
| GET `/chinese-horoscope/share-profile` (`:61`) | none | Public share payload by `code` only (`:1353-1379`) | R `log_calculate` | – | S |

### chinese-calendar (`src/chineses-calendar/chinese-calendar.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| GET `/chinese-calendar/diary` (`:12`) | none | Day almanac; `is_allow` from membership (`chinese-calendar.service.ts:65-140`) | R `chinese_calendar`, `scared_thing`, `analytic_color`, `color`, `direction`, `member_payment` | – | M (already local in FE) |
| GET `/chinese-calendar/month` (`:20`) | none | Month view + Thai holidays (`:146-233`) | R `chinese_calendar`, `holiday`, `member_payment` | – | S/M (already local in FE) |

### consent (`src/consent/consent.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| POST `/consent` (`:18`) | header `x-consent-secret` == `CONSENT_SECRET`, fail-closed (`consent.service.ts:37-45`) | Record PDPA consent + onboarding goal + `onboarded_at` (`:49-95`) | W `consent`, `user` | – | S |

### employee (`src/employee/employee.controller.ts`)
| Route | Auth | Purpose | Tables | Size |
|---|---|---|---|---|
| POST `/employee` (`:10`) | none (anyone can create admin accounts) | Create employee with bcrypt hash (`employee.service.ts:21-47`) | W `employee` | S |
| POST `/employee/auth` (`:16`) | none | bcrypt compare, returns full row incl. hash (`:50-73`) | R `employee` | S |

### fortune-stick / fortune-telling / heaven-spirit-card
| Route | Auth | Purpose | Tables | Size |
|---|---|---|---|---|
| GET `/fortune-stick` (`src/fortune-stick/fortune-stick.controller.ts:9`) | none | Random `mascot_v2` row, logs (`fortune-stick.service.ts:18-29`); no limit | R `mascot_v2`; W `fortune_stick` | S |
| GET `/fortune-telling` (`src/fortune-telling/fortune-telling.controller.ts:9`) | none | Random card with monthly limit for free users (`FORTUNE_LIMIT.FREE=1`, `fortune-telling.service.ts:32-130`) | R `member_payment`, `fortune_telling`, `fortune_telling_log`; W `fortune_telling_log` | S |
| GET `/heaven-spirit-card` (`src/heavenly-spirit-card/fortune-stick.controller.ts:11`) | none | Random card with daily limit (free 1 / member 10) (`heavenly-spirit-card.service.ts:28-127`) | R `member_payment`, `heavenly_spirit_card`, `heavenly_spirit_card_log`; W log | S |

### log-* (read/write of activity logs)
| Route | Auth | Purpose | Tables | Size |
|---|---|---|---|---|
| GET `/log-activity` (`src/log-activity/log-activity.controller.ts:8`) | none | Points history joined to `activity` (`log-activity.service.ts:32-46`) | R `log_activity`, `activity` | S (already local in FE) |
| GET `/log-love-mate` (`src/log-love-mate/log-love-mate.controller.ts:9`) | none | List love logs by user | R `log_love_mate` | S |
| POST `/log-love-mate` (`:15`) | none | Insert love log | W `log_love_mate` | S |
| POST `/log-save-image` (`src/log-save-image/log-save-image.controller.ts:8`) | none | Insert save-image log | W `log_save_image` | S (already local in FE) |
| GET `/log-survey` (`src/log-survey/log-survey.controller.ts:8`) | none | Survey results by user (`log-survey.service.ts:43-67`) | R `log_survey` | S (already local in FE) |
| GET `/log-work-vibe` (`src/log-work-vibe/log-work-vibe.controller.ts:9`) | none | List work logs | R `log_work_vibe` | S |
| POST `/log-work-vibe` (`:15`) | none | Insert work log | W `log_work_vibe` | S |

### user-matching (`src/matching/matching.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| POST `/user-matching` (`:11`) | none | Match user vs saved friend: yearly limit 100 (`MATCHING_LIMIT.FREE`), delegates to `compatibilityLove/Work` (`matching.service.ts:98-230`) | R `user`, `member_payment`, `member_with_friend`, `user_matching` + all of compatibility; W `user_matching`, `log_matching` | bazi engine (via horoscope) | M on top of compatibility |
| POST `/user-matching/recalculate` (`:18`) | none | Recompute a stored match (`:352+`) | same | same | S |
| GET `/user-matching` (`:27`) | none | Paged match list (`:231-310`) | R `log_matching`, `member_with_friend` | – | S |
| GET `/user-matching/detail` (`:34`) | none | One match (`:311-351`) | R `log_matching` | – | S |

### member-payment-code (`src/member-payment-code/member-payment-code.controller.ts`)
| Route | Auth | Purpose | Tables | Size |
|---|---|---|---|---|
| POST `/member-payment-code/check` (`:11`) | none | Redeem promo/family code: validates owner, expiry, max_use; may create membership (`member-payment-code.service.ts:116-226`) | R `payment_code`, `member_payment_code`, `member_payment_code_log`, `member_payment`; W `member_payment`, `member_payment_log`, `member_payment_code` | M – branching rules |

### member-with-friend (`src/member-with-friend/member-with-friend.controller.ts`)
| Route | Auth | Purpose | Tables | Size |
|---|---|---|---|---|
| POST `/member-with-friend` (`:23`) | none | Add friend profile with member/free cap (`member-with-friend.service.ts:101-144`) | R `member_payment`, `member_with_friend`; W `member_with_friend` | S |
| GET `/member-with-friend` (`:32`) | none | List friends (joins `user` for registered) (`:180-251`) | R `member_with_friend`, `user` | S (already local in FE) |
| GET `/member-with-friend/detail` (`:41`) | none | One friend (`:253-281`) | same | S (already local in FE) |
| GET `/member-with-friend/new-friend` (`:50`) | none | Unnotified registered friends, marks notified (`:283-304`) | R/W `member_with_friend` | S |
| PUT `/member-with-friend` (`:60`) | none | Update friend image (`:306-317`) | W `member_with_friend` | S |
| PUT `/member-with-friend/profile` (`:69`) | none | Update friend profile (`:319-337`) | W `member_with_friend` | S |

### migration (`src/migration/migration.controller.ts`)
| Route | Auth | Purpose | Tables | Size |
|---|---|---|---|---|
| POST `/migration` (`:14`) | 404 unless `MIGRATION_ENABLED=true` (`:20-22`) | One-time bulk user import (`migration.service.ts:16-130`) | W `user`, `user_provider` | Not needed – retire |

### object-storage (`src/object-storage/object-storage.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| POST `/object-storage/upload-file` (`:15`) | none | Multipart (50 MB) → Supabase Storage `mumate/profile/...` public URL (`object-storage.service.ts:51-74`) | – | Supabase Storage (service-role key) | S |
| POST `/object-storage/upload-slip` (`:35`) | none | Same → `mumate/slip/...` (`:76-93`) | – | Supabase Storage | S |

### omise (`src/omise/omise.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| POST `/omise/retrieve` (`:12`) | none | Retrieve charge by id (`omise.service.ts:117-119`) | – | Omise | S |
| POST `/omise/promptpay` (`:18`) | none | Create PromptPay source+charge, amount resolved server-side from `package_code` (`:46-114`), creates `payment` row PENDING | R `payment_package`, `payment_plan`; W `payment` | Omise | M |
| POST `/omise/charge` (`:29`) | none | Card charge by token (`:121-182`) | same | Omise | M |
| POST `/omise/webhook` (`:49`) | HMAC-SHA256 over `ts.rawBody` with `OMISE_WEBHOOK_SECRET`, timing-safe, fail-closed (`:190-233`) | `charge.complete`/`charge.create` → approve/reject payment idempotently (`:235-292`) | R/W `payment` + everything `PaymentService.approve` touches | Omise, SendGrid (via approve) | M |

### otp (`src/otp/otp.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| POST `/otp` (`:10`) | none | Upserts user by tel, generates 6-digit OTP + 4-letter ref, 5-min expiry, sends SMS (`otp.service.ts:32-80`) | W `user`, `otp` | 8x8 SMS | M |
| POST `/otp/verify` (`:17`) | none | Verify code+ref, returns user (`:82-129`). Also does `oTPRepository.find()` full table scan for logging (`:90`) | R/W `otp`; R `user` | – | S |

### payment (`src/payment/payment.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| POST `/payment` (`:12`) | none | Manual slip payment submission (`payment.service.ts:48-65`) | W `payment` | – | S |
| GET `/payment` (`:18`) | none (admin list is public) | Paged/search list joined to `user`, `member_payment_log` (`:98-197`) | R `payment`, `user`, `member_payment_log` | – | M |
| POST `/payment/approve` (`:24`) | none (anyone can approve) | Approve: status, SendGrid emails by plan, family code generation, membership creation, top-up credits (`:199-350`) | W `payment`, `payment_code`, `member_payment_code`, `member_payment`, `member_payment_log`, `member_pay_as_use`, `log_member_pay_as_use` | SendGrid | L – most business rules of the product live here |
| POST `/payment/reject` (`:30`) | none | Reject + email (`:352-382`) | W `payment` | SendGrid | S |

### payment-package / product / survey
| Route | Auth | Purpose | Tables | Size |
|---|---|---|---|---|
| GET `/payment-package` (`src/payment-package/payment-package.controller.ts:9`) | none | Package by code | R `payment_package` | S (already local in FE) |
| GET `/product` (`src/product/product.controller.ts:9`) | none | Recommended products by page/element/love% (`product.service.ts:18-61`) | R `product` | S (already local in FE) |
| GET `/survey` (`src/survey/survey.controller.ts:7`) | none | Hardcoded questions (`survey.service.ts:22-190`) | – | S (already local in FE) |
| POST `/survey/calculate` (`:13`) | none | Score 6 personality types, priority tie-break, log with share code (`:194-305`) | W `log_survey` | S |
| GET `/survey/share-type` (`:19`) | none | Result by code (`:307-311`) | R `log_survey` | S (already local in FE) |

### email / sms
| Route | Auth | Purpose | External | Size |
|---|---|---|---|---|
| POST `/email` (`src/send-grid/send-grid.controller.ts:17`) | none (open relay) | Send any SendGrid template to any address (`send-grid.service.ts:18-36`) | SendGrid | drop |
| POST `/sms` (`src/sms-sender/sms-sender.controller.ts:9`) | none (open relay) | Send any SMS via 8x8 (`sms-sender.service.ts:37-88`) | 8x8 SMS | drop |

### user (`src/user/user.controller.ts`)
| Route | Auth | Purpose | Tables | External | Size |
|---|---|---|---|---|---|
| GET `/user/search` (`:25`) | none | Returns **all users** (`user.service.ts:804-807` `find()` with no filter) | R `user` | – | drop |
| GET `/user` (`:31`) | none | User by id + payment/limits summary (`:731-775`) | R `user`, `member_with_friend`, `member_payment`, `fortune_telling_log` | – | S/M (already local in FE) |
| GET `/user/tel` (`:37`) | none | User by tel (`:777-793`) | R `user` | – | S |
| POST `/user/check-line` (`:43`) | none | LINE id → routing flags (`:178-257`) | R `user_provider`, `user` | – | S |
| POST `/user/register-login` (`:49`) | none | Social register/login (GOOGLE/LINE/X/FACEBOOK by `provider`): verifies LINE via Messaging API profile (`:279-286`), links providers, downloads avatar to storage, refer-code credit, activity points (`registerOrLogin` `:259-604`) | R/W `user`, `user_provider`, `user_friend_get_friend`, `log_activity`, `member_with_friend` | LINE API, Supabase Storage | L – ~350 lines of branching |
| POST `/user/register-tel` (`:65`) | none | Upsert by tel (`:137-176`) | W `user` | – | S |
| POST `/user/register-line` (`:73`) | none | Body is entirely commented out; returns undefined (`:606-659`) | – | – | drop |
| POST `/user/verify-tel` (`:81`) | none | Delegates to OTP verify (`:722-729`) | see OTP | – | S |
| PUT `/user/profile-pic` (`:87`) | none | Update picture URL (`:909-926`) | W `user` | – | S |

Total: 68 routes across 32 controllers.

## 2. Compute-heavy / domain-logic modules

| Module | What it computes | Logic size | Seed/data tables | Purity |
|---|---|---|---|---|
| `src/chinese-horoscope/chinese-horoscope.service.ts` | Bazi 4-pillar chart orchestration: year/month/day/hour pillars, ascendant, hidden zodiac, counting-im, strength score, decade + yearly cycles, all descriptive analytics, mascot, product/power scores, share card, log + user update | 1380 lines; `chineseHoroscope4Rows` alone `:124-984` | Reads via 25 injected services | Entangled: orchestrator over 30 services + TypeORM; side effects mixed in (`:919-978`). Pure helpers only in `src/utils/calculate-year.ts` (`CalculateDateEngToDAteChinese` `:8-20`, Chinese New Year approximated as Feb 4) and `src/utils/thai-date-time-format.ts` |
| `src/chinese-horoscope-8-square/chinese-horoscope-8-square.service.ts` | Pillar lookups: 9-Feb epoch arithmetic (`get9FebruaryOfYear` `:199-249`, `getFactorYear` `:251-267`), month/time Hong-Hou-Tung, ascendant (`:350-475`), decade cycle direction and onset (`getChineseHoroscope8Cycle` `:476-648`, `getChineseHoroscope8YearCycle` `:649-724`), counting-im, hidden zodiac | 810 lines | 8 `chinese_horoscope8_square_*` tables + `calendar100_year` (solar-term boundaries, `calendar-100-year.service.ts:15-134` – full-table scan per call `:27`) | Mixed: arithmetic is pure-ish but interleaved with repository lookups and `console.log`; has a spec (`.spec.ts` 194 lines) |
| `src/analytic-elemental-characteristics/…service.ts` | Element strength score from gain/lose element lists per pillar (`:22-124`) | 156 lines | `analytic_elemental_characteristics_calculate`, `_result`, `_element_result` | Table-driven, moderately portable |
| `src/power-finance/power-finance.service.ts` | Real/hidden fortune matching across pillars, extra, description bands (`getAnalytic` `:23-302`) | 315 lines | `power_finance`, `_fortune`, `_extra`, `_description` | Table-driven, simple loops |
| `src/power-{knowledge,customer,education,friendly}`, `src/prediction-work` | Score lookup + description band | ~40-47 lines each | own table + `_description` | Thin CRUD |
| `src/compatibility-love`, `src/compatibility-work` (legacy engine) | Score lookup by day-pillar × year-pillar, band via `src/utils/rating-band.ts:30-41` | 57 / 65 lines | `compatibility_love{,_rating,_description}`, `compatibility_work{…}` | Thin, portable |
| `src/matching/bazi/*` (new engine seam) | Pure mappers request/response for external bazi engine (`bazi-pair.mapper.ts` 223 lines, `bazi-pair-match.mapper.ts` 155 lines, both with specs); adapters are `fetch` wrappers | ~380 lines | none | Pure; only active when `MATCHING_ENGINE=bazi` (`bazi-pair.adapter.ts:13-17`) |
| `src/matching/matching.service.ts` | Friend matching wrapper + yearly quota + logs | 405 lines | `user_matching`, `log_matching`, `member_with_friend` | Entangled with horoscope service |
| `src/chineses-calendar/chinese-calendar.service.ts` | Day/month almanac assembly, membership gate | 233 lines | `chinese_calendar`, `holiday`, `direction`, `scared_thing`, `analytic_color`, `color` | Thin joins |
| `src/card/card.service.ts` | node-canvas share image (1080x1920), word-wrapping Thai text, fonts registered at import time (`:5-18`) | 169 lines | files under `public/images/mumate`, `src/assets/fonts` | Pure but native dep (`canvas`), Dockerfile installs cairo/pango (`Dockerfile:6-8`) |
| `src/survey/survey.service.ts` | Hardcoded 10-question personality quiz + scoring | 311 lines | `log_survey` | Pure data + trivial scoring |
| `src/cronjob/cronjob.service.ts` | Thai morning message composer (`generateMessage` `:24-107`) | 274 lines | see §3 | Pure helpers in `cronjob.util.ts` |
| `src/ai/ai.service.ts` | Bazi-profile shaping for LLM, wallet gate, Dify proxy (blocking + streaming) | 861 lines | `log_ai`, `member_pay_as_use`, `member_payment`, `log_calculate` | Entangled |
| `src/member-pay-as-use/wallet.util.ts` | Credit formula `max(0, 3 + purchased − used)` (`:19-26`), `CREDIT_ENFORCE` flag (`:33-35`) | 35 lines | – | Pure, tested |
| `src/payment/payment.service.ts` | Approve state machine (plan → email template, family code, membership, top-up) | 393 lines | see §1 | Entangled |
| `src/user/user.service.ts` | Social login/link/referral flows | 1091 lines (roughly 300 are commented-out dead code `:556-720`) | see §1 | Entangled |

## 3. Background work

| Job | Schedule | What | Enabled by default? |
|---|---|---|---|
| `CronjobService.sendMorningNotification` (`src/cronjob/cronjob.service.ts:109-182`) | `0 0 6 * * *` Asia/Bangkok | Day almanac → Thai message → LINE multicast to paid MEMBER LINE users, deduped | **No** – requires `MORNING_CRON_ENABLED=true` (`cronjob.util.ts:10-15`); skips silently if no `chinese_calendar` row |
| `CronjobService.sendMorningNotificationFree` (`:184-273`) | `0 0 9 * * *` Asia/Bangkok | Same + upsell footer to LINE users created in last 3 days minus members | **No** – same flag |
| `ScheduleModule.forRoot()` (`src/app.module.ts:90`) | – | Scheduler always started; only the two crons above exist | – |
| Queues / event listeners | none | grep for `Bull|Queue|@OnEvent|EventEmitter` returns nothing | – |

`render.yaml` does not set `MORNING_CRON_ENABLED`, so on Render the crons are no-ops unless set in dashboard (UNVERIFIED what is set live).

## 4. Auth model

- **No user authentication.** No JWT is issued or verified, no cookies, no session. The only `Authorization` headers are outbound to 8x8, LINE, Dify.
- Identity is a plain `user_id` (UUID) in body/query trusted as-is; login endpoints return `user_id` + flags in the JSON body (`src/user/user.service.ts:199-256`, `:336-380`). `POST /user/register-login` verifies a LINE id only by calling the LINE Messaging profile API with the bot token (`:279-286`); other providers' `idToken` are stored, never verified (`user-provider.service.ts:81-90` lookup by token).
- Caller-level shared secrets (BFF→BE): `AI_CONSUME_SECRET` on `/ai/consume` (`src/ai/ai.service.ts:213-222`, plain `!==`, not timing-safe); `CONSENT_SECRET` on `/consent` (`src/consent/consent.service.ts:37-45`, fail-closed).
- Webhook: Omise HMAC verification, timing-safe, fail-closed when secret unset (`src/omise/omise.service.ts:210-233`).
- Employee/admin: bcrypt username/password on `/employee/auth` returning the row; nothing is protected by it afterwards.
- Public routes: all 68 except the 3 secret/HMAC-gated ones and `/migration`. Notably public: `GET /user/search` (all users), `GET /payment`, `POST /payment/approve`, `POST /payment/reject`, `POST /employee`, `POST /email`, `POST /sms`, `POST /object-storage/*`.
- Network-level: CORS allowlist only (`src/main.ts:20-24`).

## 5. Environment variables (names only)

| Name | Read at | Purpose |
|---|---|---|
| `PORT`, `APP_PORT` | `src/main.ts:38`, `src/config/app/configuration.ts:6` | listen port |
| `CORS_ORIGINS` | `src/main.ts:20` | comma-separated allowed origins |
| `ENVIRONMENT`, `APP_DEBUG` | `src/config/app/configuration.ts:4-5` | app config |
| `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | `src/config/database/configuration.ts:4-9` | Postgres connection (`app.module.ts:72` hardcodes `type: 'postgres'`) |
| `DB_SYNCHRONIZE` | `src/config/database/configuration.ts:10` | `=== 'true'` → TypeORM synchronize; see §6 |
| `SUPABASE_PROJECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (default `mootech`), `SUPABASE_SIGNED_URL_TIMEOUT` | `src/config/supabase/configuration.ts:4-7` | Storage client |
| `AWS_*` (5 keys) | `src/config/aws/configuration.ts:4-8` | **Dead**: `AwsConfigModule` imported nowhere; still listed in `render.yaml:44-53` and `.env.example` |
| `SMS_8X8_HOST`, `SMS_8X8_TOKEN`, `SMS_8X8_TOPIC`, `SMS_8X8_ENCODING` | `src/config/sms8x8/configuration.ts:4-7` | OTP SMS provider |
| `LINE_HOST`, `LINE_TOKEN` | `src/config/line-message/configuration.ts:4-5` | LINE Messaging API (profile check + multicast) |
| `OMISE_PUBLIC_KEY`, `OMISE_SECRET_KEY`, `OMISE_RETURN_URI`, `OMISE_WEBHOOK_SECRET` | `src/config/omise/configuration.ts:4-7` | Omise client + webhook HMAC |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` | `src/send-grid/send-grid.service.ts:7-11` | transactional email (template ids hardcoded in `src/constants/email-template.ts`) |
| `DIFY_API_URL`, `DIFY_API_KEY` | `src/ai/ai.service.ts:383,401,446,462` | LLM chat backend |
| `AI_CONSUME_SECRET` | `src/ai/ai.service.ts:215` | BFF secret for `/ai/consume` |
| `CONSENT_SECRET` | `src/consent/consent.service.ts:38` | BFF secret for `/consent` |
| `CREDIT_ENFORCE` | `src/member-pay-as-use/wallet.util.ts:34` | `off` disables wallet blocking |
| `MATCHING_ENGINE`, `BAZI_BASE_URL`, `BAZI_PAIR_TIMEOUT_MS` | `src/matching/bazi/bazi-pair.adapter.ts:15,20,25` | `bazi` switches compatibility to external engine (default `legacy`) |
| `MORNING_CRON_ENABLED` | `src/cronjob/cronjob.util.ts:12` | enables both LINE crons |
| `MIGRATION_ENABLED` | `src/migration/migration.controller.ts:20` | exposes `/migration` |
| `PV_TIMEOUT` | sms/line/object-storage services | outbound HTTP timeout ms |

## 6. Entities / tables

- 83 entities, all matched by `entities: ['dist/**/*.model.js']` + `autoLoadEntities: true` (`src/app.module.ts:82-86`). None sets a `name` in `@Entity(...)`; table names come from TypeORM's `DefaultNamingStrategy` (`snakeCase(className)`). Spot-verified against `supabase-migration/schema-parity-fixups.sql:17-52` and `scripts/phase3-backfill-urls.sql`.
- `DB_SYNCHRONIZE`: read as boolean, passed straight to TypeORM (`src/app.module.ts:79`); `render.yaml:33-34` pins `"false"`; `migrations/README.md:4-6` states no migration runner exists and DDL is applied by hand. If anyone sets it `true`, TypeORM would try to ALTER 83 tables — the schema was pgloader-migrated from MySQL, so a synchronize run would be destructive. Must stay false.
- One raw SQL dependency on a table name: `member_pay_as_use` in `src/member-pay-as-use/member-pay-as-use.service.ts:72-77`.

Table families: core (`user`, `user_provider`, `user_friend_get_friend`, `member_with_friend`, `consent`, `otp`, `employee`); money (`payment`, `payment_plan`, `payment_package`, `payment_code`, `member_payment`, `member_payment_log`, `member_payment_code`, `member_payment_code_log`, `member_pay_as_use`, `log_member_pay_as_use`); logs (`log_ai`, `log_calculate`, `log_activity`, `activity`, `log_love_mate`, `log_work_vibe`, `log_save_image`, `log_survey`, `user_matching`, `log_matching`, `fortune_stick`, `fortune_telling_log`, `heavenly_spirit_card_log`); seed (`fortune_telling`, `heavenly_spirit_card`, `mascot`, `mascot_v2`, `product`, 8× `chinese_horoscope8_square_*`, `calendar100_year`, 3× `chinese_calendar*`, 14× `analytic_*`, 11× `power_*`, 2× `prediction_work*`, 6× `compatibility_*`, `color`, `direction`, `element_cycle`, `holiday`, `scared_thing`).

`supabase-migration/schema-parity-fixups.sql:8` mentions 87 tables in the source DDL vs 83 entities here; which 4 tables have no entity is UNVERIFIED.

## 7. Dead or unreachable code

- Every `*.module.ts` with a controller is reachable (transitive imports via `chinese-horoscope.module.ts:40-74` / `user.module.ts:18-28`).
- `src/config/aws/*`: not imported anywhere; `aws-sdk` dep unused. `mysql2` and `claude` deps not imported.
- `POST /user/register-line` handler body fully commented out (`src/user/user.service.ts:606-659`); large commented blocks `:556-604`, `:661-720`.
- `UserService.registerAndLoginWithEmail` (`:60-135`) not called by any controller.
- `MascotService.getMascot` / `getMascot60Character` only referenced in a commented line.
- `src/otp/otp.service.ts:90-93` loads the whole `otp` table only to `console.log` it.
- `src/migration/*` effectively disabled.
- `ObjectStorageService.getSignedUrl` and `putObjectThumb`: no callers found (UNVERIFIED beyond grep).

## 8. Startup side effects

| What | Where | Effect |
|---|---|---|
| `pg` type parser for int8 → number | `src/main.ts:14` | global |
| TypeORM connection with `ssl: { rejectUnauthorized: false }`, `synchronize` from env | `src/app.module.ts:69-89` | connects on boot; no migrations runner |
| `ScheduleModule.forRoot()` | `src/app.module.ts:90` | starts scheduler; both jobs gated |
| `ObjectStorageService.onModuleInit` | `src/object-storage/object-storage.service.ts:30-44` | polyfills WebSocket, creates Supabase client with the **service-role key** |
| `registerFont(...)` at module import | `src/card/card.service.ts:5-18` | reads fonts from `process.cwd()` at import time |
| `OmiseService`, `SendGridService` constructors | – | instantiate clients (no network) |
| No seeders, no DB writes on boot | – | |

Infra context: Render Docker web service, `node:19-alpine` + cairo/pango for canvas, `npm run build` then `node dist/main` (`Dockerfile`, `render.yaml:10-17`).
