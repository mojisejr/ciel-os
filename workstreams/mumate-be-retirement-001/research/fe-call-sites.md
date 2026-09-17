# mootech-fe → mootech-be dependency inventory (read-only, 2026-09-18)

Repo: `/Users/non/ghq/github.com/mojisejr/mootech-fe` @ `1312292` (main). BE cross-checked read-only at `mootech-be` @ `57da359`; BE paths are prefixed `be:`. Produced by a read-only research agent on the owner's instruction; nothing was modified.

**How BE is addressed.** `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:4000`) is read in exactly 5 files: `constants/api/endpoint.ts:14`, `lib/credit/wallet-client.ts:6`, `pages/api/calculator/compute.ts:19`, `pages/api/chinese-horoscope.ts:19`, `pages/api/v2/onboarding.ts:31`. `BAZI_BASE_URL` (54 refs) is the *engine*, not BE.

## 1. Call-site inventory — BE endpoints still called

Surface: v1 = legacy pages; v2 = `pages/v2/*`; BFF = server-side `pages/api/*`; global = mounted in `_app.tsx` (both).

| # | BE endpoint | `endpoint.ts` const (line) | Wrapper | Callers (path:line) | Surface | Feature | If BE down |
|---|---|---|---|---|---|---|---|
| 1 | `POST /user/register-login` | `user.register_or_login` (:59) | `UserRegisterOrLogin` `api-user-register-or-login.ts:22` | `pages/index.tsx:187` (:349-366); `lib/auth/use-self-heal-identity.ts:118` ← `components/identity-self-heal.tsx:1` ← `pages/_app.tsx:81` | **global (v1+v2)** | Mints `MEMBER_ID` cookie = internal `user_id` after OAuth; creates `user` + `user_provider` on first login | **No new user; existing user on a fresh device never gets `MEMBER_ID` → every gated v1 page and every v2 page stuck (`lib/v2/resolve-user.ts:81-84`).** Self-heal retries 10s then 70s |
| 2 | `POST /chinese-horoscope` | `chinese_horoscope.calculate` (:33) | `ChineseHoroscopeCalculate` `api-chinese-horoscope.ts:34` | v1: `pages/register/index.tsx:140`, `pages/profile/edit/index.tsx:696`, `pages/friend/[friend_id]/index.tsx:162` (anonymous). v2: `features/auth/hooks/useV2ProfileForm.ts:96` ← `pages/v2/register.tsx:16`; `features/v2-account/components/EditBirthScreen.tsx:114` ← `pages/v2/settings/edit-birth.tsx:4`. BFF: `pages/api/calculator/compute.ts:216` ← `components/calculator/CalculatorHomeExperience.tsx:111` ← `pages/index.tsx:452`, `pages/calculator/index.tsx:15` | **both + BFF** | Chart compute + persist: writes `log_calculate`, updates `user`, uploads share JPEG (`be:src/chinese-horoscope/chinese-horoscope.service.ts:920-972`) | v1 register/profile-edit fail; **v2 register cannot finish**; v2 edit-birth chart stale; public calculator 502 |
| 3 | `GET /chinese-horoscope?userId&code` | `chinese_horoscope.get` → `localApi` (:36) but **BFF proxies to BE** | `ChineseHoroscopeGet` → `pages/api/chinese-horoscope.ts:74-75` | `pages/my-destiny/index.tsx:191`; `features/auth/hooks/useV2Home.ts:158`; `features/v2-first-run/hooks/useFirstRunSource.ts:75` | **both + BFF** | Stored chart (`log_calculate.result`) — whole `/my-destiny`; v2 home mascot/element; v2 first-run element | `/my-destiny` empty (502); v2 home fallback mascot; v2 first-run `unavailable` |
| 4 | `GET /chinese-horoscope/compatibility-love` | `check_compatibility_love` (:40) | `CompatibilityLoveCheck` | `pages/my-destiny/index.tsx:704` | v1 | Gate love CTA | CTA not allowed |
| 5 | `GET /chinese-horoscope/compatibility-work` | `check_compatibility_work` (:39) | `CompatibilityWorkCheck` | `pages/my-destiny/index.tsx:714` | v1 | Gate work CTA | same |
| 6 | `GET /chinese-horoscope/share-profile?code` | `get_share_profile` (:38) | `ChineseHoroscopeGetShareProfile` | `pages/share/profile/[code]/index.tsx:31` | v1 (public) | Public share card | Share link redirects home |
| 7 | `POST /member-with-friend` | `member_with_friend.create` (:104) | `MemberWithFriendCreateApi` | v1: `components/modal-add-freind.tsx:80` ← `pages/matching/index.tsx:549`. v2: `features/v2-service/hooks/useCompatibility.ts:196` ← `pages/v2/service/compatibility/[kind].tsx:12` | **both** | Add friend row (quota via `member_payment`) | add friend fails |
| 8 | `PUT /member-with-friend/profile` | `.update_profile` (:108) | `MemberWithFriendUpdateProfileApi` | v1: `pages/friend/[friend_id]/edit/index.tsx:698`. v2: `useCompatibility.ts:213` | **both** | Edit friend birth data | edit fails |
| 9 | `PUT /member-with-friend` | `.update` (:107) | `MemberWithFriendUpdateApi` | `components/modal-image-crop.tsx:96` ← friend pages, `modal-add-freind.tsx:548` | v1 | Set friend picture key | photo save fails |
| 10 | `GET /member-with-friend/new-friend` | `.new_friend` (:109) | `MemberWithFriendGetNewFriendApi` | `pages/index.tsx:164` | v1 home | "X added you" toasts | silent |
| 11 | `POST /object-storage/upload-file` | `object_storage.upload` (:66) | raw `callApiUpload` (`utils/fetch.ts:93`) | v1: `components/modal-image-crop.tsx:73`. v2: `features/v2-service/components/AddFriendSheet.tsx:160` | **both** | Upload image to Supabase Storage via BE, returns `s3_key` | upload fails |
| 12 | `PUT /user/profile-pic` | `user.update_profile_pic` (:56) | `UserUpdateProfilePic` | `components/modal-image-crop.tsx:101` ← register/profile pages | v1 | Save own picture URL | save fails |
| 13 | `POST /user-matching` | `user_matching.calculate` (:113) | `UserMatchingCalculateApi` | `pages/matching/index.tsx:95` | v1 | v1 ดวงสมพงษ์ compute | dead |
| 14 | `GET /user-matching` | `.get` (:114) | `UserMatchingGetApi` | `pages/matching/recent/index.tsx:53` | v1 | recent list | empty |
| 15 | `GET /user-matching/detail` | `.get_detail` (:115) | `UserMatchingGetDetailApi` | `pages/matching/result/index.tsx:125` | v1 | result page | blank |
| 16 | `POST /user-matching/recalculate` | `.re_calculate` (:116) | `UserMatchingReCalculateApi` | `pages/matching/recent/index.tsx:153` | v1 | re-open | fails |
| 17 | `POST /member-payment-code/check` | `member_payment_code.check` (:120) | `MemberPaymentCodeCheckApi` | `pages/profile/index.tsx:252`, `pages/friend/[friend_id]/index.tsx:268` | v1 | Redeem member code | error toast |
| 18 | `POST /survey/calculate` | `survey.calculate` (:63) | `SurveyCalculate` | `pages/survey/index.tsx:154` | v1 | Survey scoring → `log_survey` | result never shows |
| 19 | `GET /fortune-telling` | `fortune_telling.get` (:88) | `FortuneTellingGet` | `pages/fortune-stick/index.tsx:130` | v1 | Draw fortune stick | can't draw |
| 20 | `POST /ai/chat-streaming` | `ai.general_streaming` (:98) | `AIGeneralStreamingAPI` (raw SSE) | `components/modal-ai-chat-general-streaming.tsx:158` mounted at `my-destiny:1417`, `chinese-calendar:409`, `fortune-stick:364`; gated by `NEXT_PUBLIC_ENABLE_CHAT !== 'false'` | v1 | Legacy MATE chat (BE → Dify) | modal errors |
| 21 | `GET /ai/balance/:user_id` | none — `lib/credit/wallet-client.ts:26` | `fetchBalance` | `pages/api/chat/balance.ts:26` ← `components/bazi-chat-modal.tsx:98`, `pages/profile/index.tsx:115` | v1 + BFF | Display-only credit counter | counter hidden (best-effort) |
| 22 | `POST /ai/consume` | none — `wallet-client.ts:39` | `consumeCredit` | **no caller** | — | — | — |
| 23 | `POST /consent` (header `x-consent-secret`) | none — `pages/api/v2/onboarding.ts:79` | BFF | `features/v2-first-run/hooks/useSaveOnboarding.ts:26` ← `pages/v2/first-run.tsx:27` | **v2 + BFF** | Finish first-run: `consent` row + `user.onboarded_at/onboarding_goal` | **v2 first-run loops forever** (`useV2Home.ts:143-146`); dev-only DB fallback `onboarding.ts:62-74` |
| 24 | `POST /omise/charge` | `payment.pay_via_credit_card` (:91) | raw fetch | `pages/payment/creditcard/index.tsx:225` (live) | v1 | Legacy card charge | fails |
| 25 | `POST /omise/promptpay` | `payment.pay_via_qr_code` (:92) | raw fetch | `pages/payment/qrcode/scan/index.tsx:156` (live) | v1 | Legacy PromptPay | fails |
| 26 | `POST /omise/retrieve` | `payment.retrieve` (:94) | `PaymentRetrieveApi` | `pages/payment/qrcode/scan/index.tsx:90` (3s poll), `pages/payment/callback/index.tsx:28` | v1 | Poll paid state | stuck → `/payment/failure` |

Ops-only coupling: `lib/ops/health.ts:14-64` reads Render API for BE status on `/ops` (`RENDER_API_KEY`).

**Constants/wrappers on `backendURLGenerator` with NO live caller (dead):** `chinese_horoscope.compatibility_love` (:37), `compatibility_work` (:38); `otp.get` (:45), `otp.verify` (:46) — only in `components/modal-otp.tsx` which is not mounted; `user.register_tel` (:50) — only in unmounted `modal-register.tsx`; `user.register_line` (:51); `user.check_line` (:58) — import only; `object_storage.upload_slip` (:67); `card.download` (:70); `fortune_stick.get` (:82), `heaven_spirit_card.get` (:85); `payment.create` (:93); `ai.card` (:97), `ai.card_streaming` (:98) — `modal-ai-chat.tsx` unmounted; `ai.general` (:99) — mount commented out at `my-destiny:1425-1432`; `UserMatchingCalculateWithStatusApi` — no caller.

## 2. Already migrated (`localApi` → `pages/api/*`, Drizzle)

| const (line) | FE route | Backing |
|---|---|---|
| `user.get` (:49) | `pages/api/user.ts:53` | `lib/db` |
| `survey.get` (:62) | `pages/api/survey/index.ts:89` | static |
| `survey.get_share_type` (:64) | `pages/api/survey/share-type.ts:9` | `lib/db` |
| `product.get` (:67) | `pages/api/product.ts:9` | `lib/db` |
| `log_activity.get` (:70) | `pages/api/log-activity.ts:14` | `lib/db` |
| `log_survey.get` (:73) | `pages/api/log-survey.ts:16` | `lib/db` |
| `log_save_image.insert` (:73) | `pages/api/log-save-image.ts:25` | `lib/db` |
| `member_with_friend.get` (:105), `.get_detail` (:106), `.delete` (:110) | `pages/api/member-with-friend/index.ts`, `detail.ts` | `lib/db` |
| `chinese_calendar.diary` (:123), `.month` (:124) | `pages/api/chinese-calendar/diary.ts`, `month.ts` | `lib/db` |
| `payment_package.get` (:127) | `pages/api/payment-package.ts:9` | `lib/db` |
| `v2_payment.*` (:133-137) | `pages/api/v2/payment/*` | `lib/payment/*` (Omise/Beam direct) |
| `v2_matching.*` (:143-150) | `pages/api/v2/matching/*` | `lib/matching/*` → engine + `lib/db` |
| `chinese_horoscope.get` (:36) | `pages/api/chinese-horoscope.ts` | **NOT migrated** — still fetches BE (:74-75) |

Other: `pages/api/consent.ts:18-21` (PDPA five-purpose consent → engine; a different feature from BE `/consent`); `pages/api/chat/bazi.ts` (engine chat).

## 3. Data coverage — tables vs `lib/db/schema.ts`

Method: BE entity classes snake-cased vs FE `pgTable(...)` names (96 tables). **Every BE entity table is declared in FE except `consent`** (`id, user_id, accepted_at, policy_version`; `be:src/consent/entity/consent-entity.model.ts`). `user.onboarded_at/onboarding_goal` present (`schema.ts:1052-1053`). `object-storage` needs Supabase Storage service-role key + bucket on the FE side. Column-level parity UNVERIFIED.

FE-only tables (no BE entity): `book_order, calculator_usage_log, dashboard_users, discount_code, discount_redemption, manifest_reminder, matching, member, member_subscription, payment_quote, push_subscription, reminder, share_snapshot, use_provider, v2_payment, work_comparison, work_comparison_candidate`.

## 4. Auth coupling

| Aspect | Finding | Evidence |
|---|---|---|
| Transport auth to BE | **None.** Every wrapper passes token `''`; `utils/fetch.ts:21-25` sends empty `Authorization: Bearer ` and `x-api-key: ''` | all `constants/api/api-*.ts` |
| Identity sent to BE | Plain `user_id` in body/query (forgeable). BFF exceptions: `x-consent-secret` (`pages/api/v2/onboarding.ts:84`), `x-ai-secret` (`lib/credit/wallet-client.ts:42`) | `.env.example` "BFF -> BE shared secrets" |
| Session | NextAuth JWT (LINE/Google/Facebook/Twitter + dev Credentials), cookie `__Secure-next-auth.session-token`; `providerId = account.providerAccountId`, `provider`, `lineProfile` copied into session | `pages/api/auth/[...nextauth].ts:58-85, 93-104` |
| Where `MEMBER_ID` is minted | Only from BE `register-login` response: `pages/index.tsx:206`, `lib/auth/use-self-heal-identity.ts:159` (global). Dev bypass `pages/dev-login.tsx:39`. Cookie names `constants/cookie-key.ts` | — |
| Request built from session | `lib/auth/register-params.ts:26-60`: LINE → `id_token = lineProfile.sub`; others → `providerId`; body `{idToken,name,image,refer_code,email,provider}` | — |
| v1 identity | Client: NextAuth status + `MEMBER_ID` cookie UUID (`lib/auth/use-current-user.ts:26-32`); pages send `userId` from cookie | — |
| v2 identity | Server: `resolveSessionUserId` → `getServerSession` → `user_provider WHERE id_token=providerId AND provider` → `user_id` (`lib/v2/resolve-user.ts:69-89`); cookie fallback only without session (`:56-65`). **Both need rows only BE writes** (`user`, `user_provider` — FE has no INSERT). `useV2Login.ts:6-9` relies on global self-heal → BE | — |
| Conclusion | Retiring BE requires a FE replacement for `POST /user/register-login` before anything else | |

## 5. Payment coupling

**v1 (Omise via BE):** card `POST /omise/charge` `{token, amount, email, user_id, payment_by:'CREDIT_CARD', package_code}` → `authorize_uri` (`pages/payment/creditcard/index.tsx:224-243`; tokenised with `NEXT_PUBLIC_OMISE_KEY`); PromptPay `POST /omise/promptpay` → QR (`qrcode/scan/index.tsx:153-176`); poll `POST /omise/retrieve` (`:88-96`, `callback/index.tsx:27-35`); BE webhook `POST /omise/webhook` → `payment.approve/reject` → `member_payment`, `payment_code`, `member_payment_code`, `member_pay_as_use`, SendGrid. Package pages closed (#376): `pages/package-price/index.tsx:33-35`, `pages/package-horoscope/index.tsx:29-31` render `SalesClosedNotice`; but `/payment`, `/payment/creditcard`, `/payment/qrcode/scan`, `/payment/callback` still reachable by direct URL; `/payment/failure` links back to `/payment`.

**v2 (FE-only) — confirmed:** `pages/api/v2/payment/{preview,charge,promptpay,status,webhook,webhook-beam}.ts` use `lib/payment/*`; no BE reference in `pages/api/v2/payment`, `lib/payment`, `features/v2-shop`. Separate key `NEXT_PUBLIC_OMISE_KEY_V2`. Middleware exempts both webhooks from the v2 gate.

## 6. v1 features whose entire backend is BE

| Feature | Page(s) | BE endpoints | Notes |
|---|---|---|---|
| Register / profile edit (chart) | `pages/register/index.tsx:140`, `pages/profile/edit/index.tsx:696` | `POST /chinese-horoscope`, `PUT /user/profile-pic`, upload | **Shared with v2** — must port |
| My destiny chart | `pages/my-destiny/index.tsx:191,704,714` | `GET /chinese-horoscope`, compat checks | Shared with v2 via same BFF |
| Public share links | `pages/share/profile/[code]/index.tsx:31` | `share-profile` | v1-only |
| Friend profile / edit / add | friend pages, `modal-add-freind.tsx:80` | `POST /chinese-horoscope` (anon), `member-with-friend` writes, upload | create/update shared with v2 |
| v1 ดวงสมพงษ์ | `pages/matching/*` | `/user-matching*` | v2 lane exists; #247 planned the flip |
| Personality survey | `pages/survey/index.tsx:154` | `POST /survey/calculate` | v1-only |
| Fortune stick | `pages/fortune-stick/index.tsx:130` | `GET /fortune-telling` | v1-only; v2 has `pages/v2/fortune/*` on engine |
| Legacy MATE chat | modals on my-destiny, chinese-calendar, fortune-stick | `POST /ai/chat-streaming` (+ balance) | v1-only; env-gated |
| AI credit counter | `pages/profile/index.tsx:115`, `bazi-chat-modal.tsx:98` | `GET /ai/balance/:id` | display-only |
| Member code redemption | `pages/profile/index.tsx:252`, friend page `:268` | `POST /member-payment-code/check` | money-adjacent |
| Legacy Omise payment | `pages/payment/*` | `/omise/*` | sales closed but reachable |
| Home login + new-friend toast | `pages/index.tsx:187,164` | `register-login`, `new-friend` | login shared with v2 |
| Public calculator | `pages/index.tsx:452`, `pages/calculator/index.tsx:15` | `POST /chinese-horoscope` (anon) via `compute.ts:216` | engine enrichment is add-on |
| OTP / register-tel / register-line / check-line | none mounted | `/otp*`, `/user/register-tel|register-line|check-line` | **Already dead in UI** |
| Card, upload-slip, fortune-stick/heaven-spirit GETs, `POST /payment`, compat POSTs, `ai/fortune-stick*` | none | — | dead constants |

## 7. `docs/be-phase1-consolidation.md` vs code

| Doc claim (line) | Verdict |
|---|---|
| L15-17 `endpoint.ts` holds only BE or same-origin bases | Confirmed (minor: `NEXT_PUBLIC_WHATIF_API_URL` client-side engine override) |
| L38-39 OTP + register-tel/register-line/check-line "UNIQUE-KEEP (auth)" | **Contradicted**: no mounted caller |
| L43-44 fortune_stick/heaven_spirit "DUPLICATE, lane not built" | Constants have no caller |
| L47 `ai.card(_streaming)` DUPLICATE | No live caller |
| L51 `member_payment_code.check` listed as GET | **Contradicted**: POST |
| L54 "already migrated: `chinese_horoscope.get` (hybrid)" | **Contradicted**: BFF still 502 without BE |
| L56-58 BFF proxies list | Incomplete: also `calculator/compute.ts:216`, `v2/onboarding.ts:79`, `chat/balance.ts:26` |
| L69 all `log-*` writes UNIQUE-KEEP | Contradicted: `log_save_image.insert` already local |
| L71 `useCompatibility.ts` keeps Create/GetDetail on BE | Half right: Create BE; GetDetail/Get/Delete local |
| L118 `chat/bazi.ts` reuses wallet-client | **Contradicted**: gates via engine `/api/qi/feature-*` |
| L121-123, L133-138 "consent 100% on engine; BE `consent` has no FE caller; delete `src/consent/`" | **Contradicted — deleting it breaks v2 first-run** (`onboarding.ts:79`) |
| Missing entirely | `POST /user/register-login` as the v2 login dependency; `pages/api/calculator/compute.ts` |

`project_map.md:22,125` in BE still says FE base is `https://bazichart.mumate.co/api/v1` → BE; code forbids that host (`endpoint.ts:16-22`).

**Bottom line:** the FE must absorb, in priority order: (1) `register-login`, (2) `POST/GET /chinese-horoscope`, (3) `POST /consent`, (4) `member-with-friend` writes + upload, then v1-only items (matching, survey, fortune-telling, member-code, MATE chat, legacy Omise, share-profile, ai balance). Only `consent` is missing from `lib/db/schema.ts`; Supabase Storage credentials would be a new FE dependency.
