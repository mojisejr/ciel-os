# MuMate — the check-in promo popup shows only to a signed-in member who has not checked in today

**Workstream:** `mumate-promo-popup-auth-001`
**State:** completed
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

The owner reported (2026-10-03 morning, with a screenshot) that the home-page
popup "Check-in ทุกวัน รับ Qi ฟรี" appears to visitors who are not signed in,
and wants it shown only to a signed-in user. After the agent's research the
owner asked to do two parts together in one slice:

1. Show the popup only when the visitor is signed in.
2. Do not show it to a member who has already checked in today.

The owner confirmed nothing else is being built in mootech-fe at the moment, so
this lane may run beside the active workstreams that also list mootech-fe. After
the merge the change goes to production on Vercel and staging is rebuilt and
released to the same SHA.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | `features/v2-home/components/PromoPopup.tsx` and its test | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (verified 2026-10-03, mootech-fe origin/main fb1f037)

- `PromoPopup` is mounted once in `pages/_app.tsx` for every `/v2` path. Before opening it checks only the path (excluding login, register, onboarding, first-run and element-finder), the 7-day hide in localStorage and the once-per-session flag in sessionStorage. It never reads sign-in state, so an anonymous visitor on `/v2` sees it over the onboarding carousel.
- Its effect runs once on mount (`[]` deps), so it cannot react to sign-in finishing after the page loads.
- Sign-in state for every `/v2` page comes from `useCurrentUser()` (cookie-truth, via `useV2AuthGate`): `anon`, `loading` or `authed`. A member returning from LINE can stay `loading` for up to about 17 s while the identity is minted (slice 7b note in `useV2AuthGate`).
- "Checked in today" is `checkedInToday(wallet.history, todayBangkok())` in `features/v2-qi/qi-model.ts`, read from `GET /api/qi-wallet` — the same rule the check-in screen uses.
- No test covers `PromoPopup` today.
- A previous promo change that touched the login path was reverted (d1314a3, #841); this lane does not touch login.

## Execution slices and acceptance criteria

### 1. Members-only popup, hidden once checked in today

1. The popup opens only when `useCurrentUser()` reports `authed`; `anon` never opens it and `loading` waits. The effect re-runs when the status changes, so a member whose identity settles after load still sees it once.
2. Before opening, one `GET /api/qi-wallet`; if `checkedInToday` is true the popup stays closed. If the wallet request fails, the popup opens as it does today.
3. Unchanged: the excluded paths, once per session, "ไม่แสดงอีกใน 7 วัน", the 1.2 s delay, the image and its link.
4. Tests: anonymous does not open; signed-in without a check-in opens; signed-in with a check-in today does not open; wallet failure opens; `loading` then `authed` opens.

DoD:
- The new test and the repository's existing checks are green.
- On the Vercel preview: signed out, `/v2` shows no popup; signed in before checking in, it shows; after checking in and opening a new tab, it does not.
- Owner merges; Vercel production serves the merge SHA; staging is built and released to the same SHA and `/api/health` on staging reports it.

## Boundaries

- One component and its test. No change to login, identity, the check-in screen, the wallet API or the popup image.
- Merge, production and the staging release follow the owner's go for this lane (2026-10-03).

## Relations to other workstreams

- `mumate-vercel-to-do-001`: every production merge in mootech-fe needs a staging build and release before the team's sign-off counts (event 2026-10-03T05:35:18); this lane does that release for its own SHA.
- `mumate-alert-messages-001`: slice 1 proves alerts by stopping fe on mumate-2; the staging release here must not run during that proof.

## Review and estimated effort

About 2–3 hours. Risk is low: one client component, no server change.
