# MuMate — an in-app notice for the server move that ends by itself

**Workstream:** `mumate-maintenance-notice-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

Tell MuMate users inside the app that the service closes on Friday 2026-10-09
04:00-10:00 Thai time for the move to DigitalOcean
(`mumate-vercel-to-do-001` slice 6, window decided in
`memory/events/2026/10/06/20261006T185301_mumate_cutover_window_0400_1000_friday.yaml`).

The owner decided on 2026-10-06 that the home popup inviting Qi check-in is
replaced by a maintenance popup, and the team supplied the artwork
(`.assets/mumate/image/LINE OA Mumate (13).png`, 1040x1300). The owner asked
whether to build a general popup system with images in storage; the agent
recommended the smallest robust change now (option A: the image ships with the
app and the notice ends by itself) and a configurable system, if wanted, as its
own workstream after the move. Record:
`memory/events/2026/10/06/20261006T072010_mumate_announcement_in_app_popup_replaces_qi_popup.yaml`.

This is its own workstream rather than part of slice 6 because it is a product
change in the launch team's repository, and `mumate-vercel-to-do-001` keeps
product changes out of its slices.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | `features/v2-home/components/PromoPopup.tsx`, its test, one image under `public/images/v2/popup/` | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (verified 2026-10-06, mootech-fe origin/main 3e558ad)

- `PromoPopup` is mounted once in `pages/_app.tsx` for `/v2` paths. Since
  2026-10-03 (f9271c0, `mumate-promo-popup-auth-001`) it opens only for a
  signed-in member who has not checked in today, once per session, after
  1.2 s, with "ไม่แสดงอีกใน 7 วัน" and a tap that goes to `/v2/qi/checkin`.
- The popup is one image (`public/images/v2/popup/checkin.png`, 1000x1300,
  text inside the art) named by the constant `CHECKIN`, rendered with
  `next/image`; the team added it in PRs 778 and 783 (2026-09-23).
- `scripts/promo-popup-members-only.test.tsx` covers the current rules
  (vitest, `npm test`).
- The same mootech-fe SHA runs on Vercel until the cutover and on
  mumate-prod-1 after it, so anything shown "before the move" must stop by
  itself or it keeps announcing a past closure on the new server.
- Staging uses a separate Supabase project, so an image kept in storage would
  differ between staging and production; an image in the repository is the
  same on both.

## Execution slices and acceptance criteria

### 1. The notice in code, tested, on a PR preview

1. Add the team's artwork as `public/images/v2/popup/maintenance-20261009.png`
   (unaltered).
2. In `PromoPopup.tsx`, a `NOTICE` constant with the image, an `alt` carrying
   the full announcement text, and an end time `2026-10-09T04:00:00+07:00`
   (the window start: from then on every visitor sees the maintenance page,
   and after the gate opens a notice still announcing the closure would
   confuse members).
3. Before the end time: the notice opens for every visitor of an eligible
   `/v2` path, signed in or not, with no `/api/qi-wallet` read; once per
   session (its own key); X or the backdrop closes it for the session; the
   text button under the image (where "ไม่แสดงอีกใน 7 วัน" was) reads
   "รับทราบ" and hides it until the end time; tapping the image closes it and
   goes nowhere.
4. From the end time on: the Qi check-in popup behaves exactly as today. No
   deploy is needed after the move.
5. Tests with a fixed clock: before the end, a guest and a member who already
   checked in both see the notice and no wallet request is made; the image
   tap does not navigate; "รับทราบ" hides it; after the end, every existing
   rule holds (the current test file passes with the clock after the end).

DoD:
- The new and existing tests, type check and lint pass in mootech-fe.
- A draft PR against main with the CIEL sections and the repository template.
- On the Vercel preview, on a phone: signed out and signed in, `/v2` shows
  the notice once; "รับทราบ" hides it; the image is sharp and not cropped.

### 2. Live on production, staging level, team sign-off

1. The owner (or เอ็ม on the owner's word) merges the PR as the last merge
   before the freeze locks.
2. Vercel production serves the merge SHA and shows the notice.
3. The agent builds and releases staging from the merge SHA (bazi stays
   48e4328); `app.staging.mumate.co/api/health` reports it.
4. The team re-checks staging (the main flows, today's merges 879-882, and
   the notice) and signs off naming the new fe SHA.

DoD:
- Production and staging serve the same fe SHA, recorded with the release run.
- The team's sign-off names that SHA; this is the sign-off slice 6 of
  `mumate-vercel-to-do-001` builds production from.
- The expiry is checked during the cutover review (runbook 06 step 5: no
  notice after 04:00, Qi popup back for a member) and recorded in the
  cutover closeout.

## Boundaries

- One component, its test and one image. No change to login, the Qi check-in
  screen, the wallet API, the carousel, or the maintenance gate.
- No popup system, storage upload, database table or admin screen; that is a
  candidate after the move, opened only on the owner's decision.
- Production images for mumate-prod-1 are built and released in
  `mumate-vercel-to-do-001`, not here.

## Relations to other workstreams

- `mumate-vercel-to-do-001` (active, slice 6): the freeze and the team's
  sign-off are its; this lane supplies the last pre-move SHA and the sign-off
  it builds from. Production build of that SHA must finish before Thursday
  2026-10-08 evening.
- `mumate-promo-popup-auth-001` (completed): wrote the rules this lane keeps
  after the end time.
- Overlap on mootech-fe with `mumate-vercel-to-do-001` and
  `mumate-be-retirement-001`: neither changes mootech-fe code now; parallel
  running needs the owner's confirmation.

## Review and estimated effort

Slice 1 about 1-2 hours plus the owner's look at the preview; slice 2 about
1 hour plus the team's re-check. Risk is low: one client component, no server
change, and the notice removes itself.
