# MuMate v2 — Google Analytics that counts members, not cookies

**Workstream:** `mootech-ga4-instrumentation-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Give the team one number they asked for and can trust — **the share of v2
members active each day** — and the two events under it, `login` and
`sign_up`, measured so that only signed-in members count and only real hosts
feed the property, with a consent switch that actually governs the tag. Everything else the team may
want later (conversion buttons, purchase, feature use) is designed to hang off
the same seam but is not built here.

The team's ask, relayed by the owner from a chat with พี่ปอง (Janjarat) on
2026-09-15:

> วันนี้ที่อยากรู้คือ DAU … Daily active user per total user … Active User,
> Recurring user ก็ดี … พวก Login, Sign up ก็ใช่ … เบื้องต้น เอา DAU, Total
> users ก่อนได้

The owner's two decisions the same day, which this plan rests on:

1. **DAU means members of the app, not visitors of the landing site.**
   `mumate.co` is a WordPress marketing site; the product lives at
   `bazichart.mumate.co` and stays there through the v2 launch
   (`mootech-fe#606`) and the server move (`mootech-fe#637` §4.6). The
   owner first asked for a separate property and then, the same evening,
   chose to keep one property and count members only (D1, revised).
2. **The denominator is every v2 member, from the database, from now on.**
   "Total users" means accounts, not visitors, and v2 accounts specifically —
   not the v1 `member` table. The percentage is `active members ÷ v2 members`.

The team also said พี่ปอง will add marketing pixels to the GTM container
herself; this plan leaves room for that and asks only for a notice before a
publish.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | the v2 app: GTM snippet, consent screen, login round-trip, first-run onboarding, `/ops` analytics | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `ciel-os` | this plan, its events, and the GTM container definition this lane authors | `.` |

`mootech-be` and `bazi-sft-dataset` carry no web analytics and are not
changed. Google Tag Manager container `GTM-MLZC4FRC` (account `6307897573`,
container `227123257`) and the GA4 property behind measurement ID
`G-EBZKXSF579` (stream `12016428670`) are external systems the owner
administers; this plan changes them only through steps the owner performs
or imports.

## Starting evidence

Recorded in `memory/events/2026/09/15/20260915T114122_mootech_ga4_research_baseline.yaml`
against `mootech-fe` `main` `3913947`; the hostname facts below were added
the same day. Every `path:line` is in `mootech-fe`.

**One container, two sites, one property.** `GTM-MLZC4FRC` is loaded by the
WordPress landing at `mumate.co` (WordPress 6.9.4, Nginx) and by the Next.js
app at `bazichart.mumate.co` (Vercel), through `pages/_app.tsx:53-59` and the
noscript iframe in `pages/_document.tsx:23-30`. The container holds exactly
one tag — `GA4 Configuration - Main Site`, type `googtag`, to
`G-EBZKXSF579`, on `Initialization - All Pages`, `consentSettings NOT_SET` —
so every page view from both sites, and from every Vercel preview
deployment, lands in one property whose stream URL says `www.mumate.co`.
Live version 2 "PageView", published 2026-08-12 by `mootech.co@gmail.com`.

**The property knows nothing but page views.** No `gtag`, no measurement ID
and no `dataLayer.push` exist in the code. Key events `qualify_lead`,
`close_convert_lead` (starred) and `purchase` (unstarred) show no stream data
in 28 days; the first two are Google's lead-generation defaults. Event data
retention is 2 months, so the first month of data starts expiring in
mid-October 2026. Enhanced measurement is on. Realtime showed the owner's own
visit, so hits do arrive.

**The database knows the denominator but not the numerator.** `user`
(`lib/db/schema.ts:1024`) carries `onboarded_at` and `onboarding_goal`,
written once by `pages/api/v2/onboarding.ts` when the first-run consent is
submitted — the only durable "this account finished v2 onboarding" mark.
Neither `member` (`:573`) nor `user` has `created_at`, `last_login` or
`last_seen`; the only `last_seen_at` is on `dashboard_users` (ops admins,
`lib/db/0001_add_dashboard_users.sql:7`). So the database can count v2
members but cannot say who was active today; GA has to supply that, and it
can only do so per person if the app tells it who the person is.

**Where the app knows "login" and "new member".** OAuth is NextAuth with
LINE, Google and Facebook providers (`pages/api/auth/[...nextauth].ts:3-5`);
v2 starts it from `features/auth/hooks/useV2Login.ts:54` with the callback
inside `/v2/register`. A member id exists only after the register-login
round-trip mints the `MEMBER_ID` cookie (`lib/auth/login-state.ts:7-12`,
idempotent by design). `pages/api/v2/onboarding.ts` succeeds once per
account. These two points are the seams for `login` and `sign_up`.

**The payment lane is closed to GTM on purpose.** `middleware.ts:154-159`
emits a CSP without `'unsafe-inline'` on `/v2/shop/checkout`, `/qrcode`,
`/result` (`mootech-fe#493`), locked by `scripts/csp-payment-path.test.ts`
and `e2e/v2-csp-teeth.spec.ts`. Nothing in this plan loosens it; a
`purchase` signal, if the team wants one later, comes from the server.

**Consent is a switch wired to nothing.**
`features/v2-settings/components/ConsentScreen.tsx:18` offers an `analytics`
purpose persisted through `pages/api/consent.ts`; no tag reads it.
`pages/_document.tsx:7` also declares `lang="en"` on a Thai app.

**What `/ops` already measures.** `lib/ops/analytics.ts` reports approved
revenue and tier distribution from `v2_payment` and `member_subscription`;
the engine's `/api/ops/analytics` reports the QI ledger and chat volume.
Revenue and QI stay there; GA is for behaviour before and around them.

## Decisions — recorded 2026-09-15

- **D1 One property, guarded by hostname (revised 0.2).** The app and the
  landing site keep sharing the existing property `G-EBZKXSF579`. GTM adds a
  trigger exception so the tag fires only on `mumate.co`, `www.mumate.co`
  and `bazichart.mumate.co`; Vercel previews and localhost fire nothing.
  The 0.1 text proposed a separate "MuMate App" property chosen by a
  hostname lookup table; the owner reversed it on 2026-09-15 evening after
  finding that a property can only be created with Editor rights on the GA
  *account*, which the team granted at property level only. The reversal
  costs nothing the team asked for: the percentage's numerator is active
  users with `member_state = member` (D2), which no landing visitor ever
  carries, so the landing cannot pollute it; and because both hosts sit
  under `.mumate.co`, the `_ga` cookie is shared and a person who arrives
  through the landing and enters the app is one user without cross-domain
  setup — something the split would have lost. What the team accepts: the
  unfiltered "active users" card keeps counting landing visitors, so the
  app-only view before slice 2 needs a hostname filter in Explorations, and
  the number worth trusting arrives with slice 2.
- **D2 A person is an account.** After the member id exists the app sets GA
  `user_id` to a keyed hash of the member id (HMAC with a server-side secret,
  never the raw id, never LINE/Google/Facebook ids) and the user property
  `member_state = member`. DAU for the team's percentage is *active users
  with `member_state = member`* in the app property. Rationale: without it,
  one person on LINE's in-app browser, Safari and the installed PWA is three
  users and the percentage is fiction.
- **D3 `sign_up` is first-run completion, `login` is the minted member id.**
  `sign_up{method}` fires once, on the success path of the first-run consent
  submit that writes `onboarded_at`; `login{method}` fires when the
  register-login round-trip yields a member id in this browser session.
  Rationale: both are deterministic points that already exist and match the
  denominator's definition (v2 members = `onboarded_at IS NOT NULL`).
- **D4 The denominator comes from the database, shown in `/ops`.**
  `getFeAnalytics` gains `members_total` (users with `onboarded_at`),
  `members_new_today` and `members_new_7d` computed from `onboarded_at`. GA
  never receives or computes the denominator. The percentage is read from two
  screens until a later slice pulls GA's DAU into `/ops` through the Data
  API; that pull is out of scope here.
- **D5 One door for events.** Every event goes through
  `lib/analytics/track.ts`: an allowlist of event names and parameter keys, a
  test that reddens on any forbidden key (`birth*`, `email`, `phone`,
  `line*`, `name`, raw ids), and a consent check — `analytics` off means no
  push and GTM consent mode `analytics_storage: denied`. Nothing under the
  payment-lane prefixes calls it, and the existing CSP tests stay as the
  proof.
- **D6 Publishing GTM is a production change outside Git.** The container
  definition this lane authors is kept as JSON under this workstream
  directory and imported by the owner; the owner publishes; พี่ปอง's own
  tags are hers to publish with a notice in chat first. Version names say
  who and what.

## Execution slices and acceptance criteria

### 1. Guard the container and clean the property — no code

The agent writes `gtm/GTM-MLZC4FRC.v3.json` under this directory: a trigger
exception `Not a MuMate host` on `Page Hostname` not matching
`^(www\.)?mumate\.co$|^bazichart\.mumate\.co$`, attached to the existing
tag; the measurement ID stays `G-EBZKXSF579`. The owner, guided step by
step: sets event data retention to 14 months, removes the key-event mark
from `qualify_lead` and `close_convert_lead`, imports the JSON into the GTM
workspace (merge, overwrite conflicts), runs Preview on
`bazichart.mumate.co/v2`, on `mumate.co` and on a Vercel preview URL, and
publishes as version 3 "Guard hostnames".

Slice 1 is done when: the public
`https://www.googletagmanager.com/gtm.js?id=GTM-MLZC4FRC` fetched after
publish contains the hostname predicate and still one measurement ID (the
agent reads it); Realtime shows a visit made on `bazichart.mumate.co` and a
visit to a Vercel preview URL does not appear; retention reads 14 months;
the two seeded key events are unmarked; and a closeout records the GTM
version number and the date the guard took effect — the date from which the
series is clean of preview traffic.

### 2. `login`, `sign_up`, identity and the denominator — one pull request

In `mootech-fe`: `lib/analytics/track.ts` per D5 with its test;
`lib/analytics/identity.ts` producing the keyed hash from a new
server-side secret `ANALYTICS_USER_ID_KEY` (set by the owner on Vercel;
unset means no `user_id` is sent, never a fallback to the raw id);
`login{method}` at the point the member id is minted, `sign_up{method}` on
the first-run consent success path; consent mode default `denied` for
`analytics_storage` in the GTM loader with an update on every consent read
and change; `lang="th"` in `pages/_document.tsx`; `members_total`,
`members_new_today`, `members_new_7d` in `lib/ops/analytics.ts` and the
`/ops` screen. The GTM side — a `login` and `sign_up` event tag pair and a
`user_id` / `member_state` field on the configuration tag — ships as
`gtm/GTM-MLZC4FRC.v4.json` for the owner to import and publish after the PR
is on production.

Slice 2 is done when: `npm test` is green and three new tests exist — the
allowlist reddens on a forbidden key, consent off yields no push, and a
`track()` call under a payment-lane path is impossible by construction
(no import there; the CSP suites unchanged and green); the owner merges
the PR and sets the secret; GA4 DebugView on the app property shows
`login` with `method` and a `user_id`, then `sign_up` for a fresh account
walked by the owner; the same person on two browsers appears as one active
user in Realtime; `/ops` shows the three member counts and they match a
direct SQL count the agent runs read-only; and a closeout records the GTM
version, the PR, and the first day both events exist.

### 3. Seven days of the number, read with the team

No new code. For seven consecutive days after slice 2 is live the agent
records, from the owner's daily screenshot or GA4 export: active users with
`member_state = member` (1-day), the same for 7-day, `login` and `sign_up`
counts, and `members_total` from `/ops`; computes the daily percentage; and
compares GA's `sign_up` count with the growth of `members_total` (they must
agree within the day boundary, or D3 is wrong). The number and the method
are written up in one page for พี่ปอง.

Slice 3 is done when: seven daily rows exist in the closeout; the `sign_up`
versus `members_total` reconciliation is within one day's boundary effects
or the discrepancy is explained; the team has read the page and said whether
the number answers their question; and the closeout lists what the team asks
for next (conversion buttons, purchase from the server, feature cards) as
candidates for a set-2 plan revision, not as work started.

## What each side does

| Step | Owner (in the Google UIs, Vercel, GitHub) | Agent (repository, JSON, verification) |
|---|---|---|
| 1 | Sets retention; unstars seeded key events; imports the JSON; runs Preview on three hosts; publishes | Authors the container JSON; writes the click-by-click guide; reads the public container after publish; records the closeout |
| 2 | Reviews and merges the PR (a production deploy); sets `ANALYTICS_USER_ID_KEY` on Vercel; imports and publishes v4; walks DebugView with a fresh account | Writes the code and tests; runs the suites; prepares v4 JSON; runs the read-only SQL cross-check; records the closeout |
| 3 | Sends one screenshot or export a day; shows the page to พี่ปอง | Records the rows, computes the percentage, writes the page, records the closeout |

## Authority boundary

- Merging to `mootech-fe` `main` is a production deploy and an owner action.
- Creating or altering a GA4 property, changing retention, and publishing a
  GTM version are owner actions per instance; the agent prepares and
  verifies, never holds Google credentials.
- No birth date, birth time, element, zodiac, name, email, phone, LINE id,
  provider account id, or raw member id ever travels as an event parameter,
  user property, or `user_id`. A change that would send one needs a new
  owner decision.
- The payment-lane CSP is not touched; a request to fire any tag on
  `/v2/shop/checkout`, `/qrcode`, `/result` is declined and recorded.
- `ANALYTICS_USER_ID_KEY` is a secret; it never enters a repository file,
  event or report.
- The GTM JSON under this directory contains identifiers only (container,
  measurement IDs) and no secret.

## Out of scope

Conversion-button events, `purchase` and the Measurement Protocol, feature
cards (`select_content`), share, PWA install and push events, QI currency
events, pulling GA data into `/ops` through the Data API, cross-domain
tracking between landing and app, the landing property's own configuration,
พี่ปอง's marketing pixels, Google Ads or Search Console links, and anything
in v1 pages beyond the shared loader they already carry.

## Rollback contract

- Slice 1: re-publish GTM version 2 — the previous live version — from the
  Versions tab; retention and the key-event marks revert in the same screens.
- Slice 2: revert the PR; the GTM event tags fire on nothing and can stay or
  be removed in a later version; unset the secret.
- Nothing in this plan writes to the landing site; the property changes are
  the retention setting and the two key-event marks, both reversible.

## Revision 0.2 — one property, not two (2026-09-15 evening)

Revision 0.1 planned a second GA4 property for the app. Creating one needs
Editor rights on the GA account, and the owner holds Administrator on the
property only; the owner chose not to depend on the team for account-level
access and asked whether one property would do. It does, for the reasons in
D1: the members-only numerator (D2) excludes landing visitors by
construction, and the shared `.mumate.co` cookie keeps a landing-to-app
visitor as one person. Slice 1 shrinks to the hostname guard, retention and
the key-event marks, all within the owner's current rights. The owner also
approved this lane running in parallel with `mootech-fe-beam-gateway-001`
on `mootech-fe`; the file sets do not overlap (`lib/payment/**`,
`pages/api/v2/payment/**`, `middleware.ts`, `features/v2-shop/**` are
beam's; this lane adds `lib/analytics/**` and touches
`pages/_document.tsx`, `lib/ops/analytics.ts`, the login round-trip and
`pages/api/v2/onboarding.ts`; `pages/_app.tsx` is shared and this lane
rebases on it).
