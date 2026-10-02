# MuMate — a member's user_id stops being a key, then members can hand it to support

**Workstream:** `mumate-member-identity-hardening-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

The owner wants members to be able to copy their own member ID (the `user_id`
UUID) from settings and send it to the team on LINE, so support finds the right
account in `/ops/users` at once instead of comparing screenshots
(2026-10-02, aligned in a syncup round: full UUID with a copy button, no short
code, no diagnostic export, no extra protection layer, no auto-attach to the
LINE button yet).

While aligning, the agent found that a `user_id` already works as a key to the
member's data and actions (record
`memory/events/2026/10/02/20261002T102627_mumate_member_identity_forgeable_cookie_finding.yaml`).
The owner's condition: **close the hole first, without breaking any member's
use**, then ship the support ID; build on staging, the owner tests, then
production. The owner asked to open this workstream on 2026-10-02.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | the member cookie, the API routes, the settings screen | `/Users/non/ghq/github.com/mojisejr/mootech-fe` (work in worktree `../mootech-fe-support-id`, branch `feat/member-support-id`) |
| `bazi-sft-dataset` | member routes keyed by `anonId` must require the FE's client secret; production branch `pdf-dev` | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `mumate-infra` | staging release (button) and the host env of both droplets | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (verified 2026-10-02, mootech-fe origin/main bfcef7a, bazi origin/pdf-dev 04bc24a)

- `GET /api/user?user_id=` (pages/api/user.ts:55) has no identity check and returns the full `user` row (name, email, tel, dob, birth time, place) plus payment. Production answered a random UUID with 400 "User not found", not 401.
- Client-supplied `user_id` with no check also in: member-with-friend GET/DELETE, member-with-friend/detail (by friend row id, no identity at all), quota (no caller), log-activity, log-survey, log-save-image, chinese-calendar diary/month (v1 callers unreachable).
- About 30 v2 routes take identity from the raw `cookie-mumate-id` (client-set, not httpOnly): account delete and export, profile, avatar, display name, consent, notification prefs, Qi spend/earn/wallet/entitlements/streak, coupon, referral, missions, phone charge, destiny, chat, prayer, fortunes, home/element caches, manifest.
- `resolveSessionUserId` (lib/v2/resolve-user.ts:86) falls back to that cookie when no NextAuth session exists (#391: browsers that drop the session cookie), checking only UUID shape and that the user row exists. `resolveSignedSessionUserId` (no fallback) is used only by auth/liff-carry. `memberCookieMismatch` -> 409 `reason: 'identity'` is already understood by clients.
- The session holds `providerId`/`provider`, not `user_id`; `user_id` comes from `user_provider` (resolve-user.ts:98-103).
- member-with-friend GET returns `member_id` (another member's `user_id`) to the client.
- bazi on Vercel (`bazi-sft-dataset.vercel.app`) answers member routes by `anonId` with no caller authentication; `x-mumate-client-secret` is used only for rate-limit IP trust (src/lib/rate-limit.ts:93-100). On DigitalOcean bazi has no public hostname (D3).
- Tests: vitest; specs in `scripts/*.test.ts(x)` listed by hand in `vitest.config.mts` include (drift test enforces it); route pattern `scripts/friend-write-routes.test.ts`, resolver pattern `scripts/resolve-user.test.tsx`.
- verify-architecture is red on main for teammate files; FE pushes need `--no-verify` (owner pushes if the harness refuses). Run `npm run build` locally before every staging image.

## Execution slices and acceptance criteria

### 1. Hardening + support ID, on staging only

1. **Signed member cookie.** At sign-in (register-login-fe / mint-member and the self-heal path) set an httpOnly, Secure, SameSite=Lax cookie carrying `user_id` and an HMAC signature with a server secret (NEXTAUTH_SECRET or a dedicated one). `resolveMemberIdFallback` accepts only a valid signature; the raw `cookie-mumate-id` stays for client reads but is no longer trusted by the server.
2. **Routes onto the helper.** Every route in the raw-cookie group and the client-`user_id` group resolves identity with `resolveSessionUserId` (session, or the signed fallback) and scopes to `who.userId`; where a client value is still sent, a mismatch answers 409 `reason: 'identity'` (the existing pattern). `/api/user` serves only the caller's own row; member-with-friend/detail scopes by owner. Unused and v1-only routes answer 410. Friend lists stop returning another member's `user_id` unless a caller needs it (verify).
3. **bazi.** Member routes keyed by `anonId` require `x-mumate-client-secret` = `BAZI_CLIENT_ID_SECRET`; the FE already holds the secret (verify every FE -> bazi call sends it).
4. **Support ID.** Settings shows "ID สมาชิก" with the full UUID from the server-resolved identity (not the raw cookie) and a copy button, with one line telling members to send it when the team asks.

DoD:
- Tests per route: no identity -> 401; another member's id (query, body or forged raw cookie) -> 401/403/409 and no data; own identity -> same response as before. The signed-cookie verifier rejects a forged or unsigned value. Each guard proven red without it.
- `tsc`, eslint, full vitest, `npm run build`, gitleaks green; verify-architecture adds no new violation.
- Staging walk by the owner on a phone: sign in (LINE, Google, inside LINE), home, chat, Qi, calendar, compatibility, settings, account; the support ID shows and copies; pasting it into `/ops/users` finds exactly that member.
- A forged-cookie probe on staging with the walking member's own id from another browser gets no data.

### 2. Production

Owner merges (FE and bazi), Vercel production deploys, the agent verifies with probes that use random or the owner's own ids only, the owner walks production. The forged-cookie and `/api/user` probes return no data. Members on a dropped-session browser sign in once.

## Boundaries

- No production change before the owner's merge. No reading of another member's data, ever; probes use random UUIDs or the owner's own account.
- Details of the hole stay out of public channels until slice 2 is live; PR text describes the change, not a recipe.
- Not in scope: auto-attaching the ID to the LINE support button, short codes, diagnostic exports, the ops page itself.

## Relations to other workstreams

- `mumate-login-identity-001`: owns sign-in and the member cookie; this plan changes the cookie and resolver it built (#391 fallback, liff-carry). The finding is recorded in that lane.
- `mumate-vercel-to-do-001`: both change mootech-fe and need a freeze; the owner decides the order (agent recommends this hardening first, the cutover later in the week of 2026-10-05 or the week after). After the cutover bazi has no public hostname; the Vercel bazi project stays public while kept as flip-back.
- `mumate-be-retirement-001`: independent (Render suspended 2026-10-02).

## Open owner questions

1. Order against the cutover (agent recommends hardening first).
2. Who tells เอ็ม, privately (agent recommends the owner, before the PR is opened).

## Review and estimated effort

About 1-2 days including the staging walk. Risk is in step 1 (sign-in cookie) and in pages that send a stale cookie value; the 409 path and a one-time sign-in are the designed outcomes.
