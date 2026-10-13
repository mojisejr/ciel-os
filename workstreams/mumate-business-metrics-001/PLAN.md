# MuMate — a read-only business dashboard for what GA4 cannot count

**Workstream:** `mumate-business-metrics-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

The business team says GA4's numbers "don't match". The owner, 2026-10-13:
build first only what GA4 cannot give and what the data already holds; note
what would need new collection and propose it after the first part is done;
put the dashboard on its own subdomain (e.g. `bdash.staging.mumate.co`),
separate from `/ops`, where members and payments can be edited and deleted;
gate it with the backstage passkey; fold the GA4 lane in (closed the same
day, `mootech-ga4-instrumentation-001`). The application must not slow down
because of it.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `bazi-sft-dataset` | dashboard pages, read API, nightly snapshot job (lean, see Placement) | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `mumate-infra` | Caddy site for the new host, path allowlist, timer for the snapshot job | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (2026-10-13)

- One database: FE (`DATABASE_URL`) and bazi (`APP_DATABASE_URL`) use the
  same Supabase public schema; bazi already reads FE tables (`"user"`,
  `v2_payment`, `share_snapshot`); join key FE `user_id` = bazi `anon_id`.
- Load, measured on the staging copy (backup of 2026-10-02: 380 MB, 5,359
  users, largest table ~20k rows), read-only, counts only: signups/day 8 ms;
  payments by status×method×gateway 90 d 0.3 ms; active members/day 68 ms;
  signup-cohort retention 53 ms; readings/day on the largest table 17 ms.
  prod-1: 4 GB RAM (2.6 GB available), 2 vCPU, bazi at 314 MB of 1.5 GB.
- Data ready today: signup time (`user.create_at`, `onboarded_at`);
  per-action timestamps (`bazi_ledger_txn`, `mate_ai_chat_meta`,
  `*_usage`, `bazi_mission_progress`, check-ins, shares); payments
  (`v2_payment`: amount, method, gateway, status, `failure_code`,
  `created_at`); subscriptions (`member_subscription`); QI ledger and
  wallets; AI tokens per reply (`open_webui_usage`).
- Not collected (parked): acquisition source — no UTM anywhere and the
  incoming `refer_code` is ignored at signup (`register-login-fe.ts:224-230`);
  login history (`user.login_at` is overwritten); payment settled/refund
  timestamps; calendar/sacred-map/element-finder views.
- `/ops` today: FE `lib/ops/analytics.ts` (revenue/day, by package, tier
  mix, members total/new) and bazi `/api/ops/analytics` (its own DAU from 12
  usage tables + chat, a second revenue calculation, QI, chat topics) — two
  revenue numbers and a DAU nobody defined with the team.
- bazi backstage (`bazi-sft.staging.mumate.co`) is production bazi behind the
  `BACKSTAGE_KEY` passkey (`src/proxy.ts`, `src/lib/backstage/gate.ts`), and
  its `/api/ops/*` includes writes: user-delete, subscription, entitlement
  (POST/DELETE), coupon, discount, promo-share, campaign-link, course-video.
- Research (web, cited in the 2026-10-13 report): GA4 counts browsers (LINE
  webview, Safari, PWA are separate), loses refused consent below 1,000
  daily consenting users, thresholds small counts, keeps 2/14 months, and
  its `purchase` is browser-side; benchmarks: freemium free→paid median
  2.1% (SE Asia 1.4%, RevenueCat 2026).

## Placement — where the dashboard lives (lean: inside bazi, on its own host)

| Option | For | Against |
|---|---|---|
| A. New container (own small app) | strongest isolation; its own read-only DB role | a new image, CI, deploy path, alerts and RAM to keep for a 5-page tool |
| B. `/dash-business` in fe | fe already has `/ops` code | fe is the members' app: admin code in the public app's codebase and release train; same host as `/ops` and its delete actions — no separation |
| **C. In bazi, served only on `bdash.<zone>`** | the passkey gate, Next 16, DB access, ops analytics code and the cron-route pattern already exist; one Caddy site + one DNS record; owner's lean | shares the process that answers the FE's API calls (heavy queries could slow members) — solved by the snapshot; bazi gets direct pushes (handoff item 7) — our part goes by PR |

Safeguards that make C safe:
1. **Host allowlist in Caddy.** `bdash.<zone>` proxies to bazi only for the
   dashboard pages, its GET-only read API, the gate's login POST and
   `/_next/*`; everything else is 404 at Caddy — `/api/ops/*` writes are
   unreachable on that host whatever the cookie says.
2. **Snapshot, not live queries.** A nightly job (systemd timer → bazi cron
   route, the `cron.tsv` pattern; 03:00 Bangkok) computes the metrics into a
   small snapshot table; the dashboard reads only that. Members' requests
   never wait on an analytics query.
3. **Own passkey (recommended over the shared one).** The owner offered the
   same `BACKSTAGE_KEY`. But the business team holding it could also open
   `bazi-sft.staging.mumate.co`, which can edit and delete — the separation
   would exist in the URL only. Lean: `BDASH_KEY` for the new host (the gate
   picks the key by the stamp Caddy sets).
4. **Read-only DB role for the read path (optional, owner's call).** The
   dashboard's reads use a SELECT-only role; only the nightly job writes the
   snapshot. A production DB change, so on the owner's word.

## Slice 1 — the dashboard on its own host, with the metrics the data already has

| # | Step | Who | Check |
|---|---|---|---|
| 1 | Definitions page (Thai) for the five metrics below, checked on the staging copy with read-only queries; numbers shown to the owner/team as counts only | agent | owner agrees the definitions |
| 2 | bazi PR to `pdf-dev`: snapshot table (additive migration), cron route computing the five metrics, `/bdash` pages + GET read API, gate keyed by host stamp; tests | agent | tests + PR build; merged by the owner/team |
| 3 | infra PR: `bdash.<zone>` site (stamp + allowlist), timer row in `cron.tsv`; caddy-edge test that `/api/ops/*` is 404 on that host | agent | `scripts/test-all.sh` green; owner merges |
| 4 | DNS A record for the host (owner's order), `BDASH_KEY` in prod-1 `env/bazi.env` (owner's word); staging first | owner + agent | passkey page on the host; `/api/ops/user-delete` 404 there |
| 5 | Release with the next production press; first snapshot the following night | owner's press | the five panels show yesterday's numbers |

The five metrics (all from existing tables):
1. Signup-week cohort retention D1/D7/D30 on accounts (any action that day).
2. Free→paid: share of each signup cohort paying within 35 days; days to first purchase.
3. Payment funnel by method and gateway: created → approved / rejected / expired, with `failure_code`.
4. QI economy: earned vs spent per day by reason, QI granted by purchase vs by missions, balance spread.
5. AI cost per active member and per payer (tokens from `open_webui_usage` × a price the owner sets).

DoD: the business team opens `bdash.<zone>` with its own passkey and sees the
five metrics as of last night; no write endpoint answers on that host; the
nightly job's run time is logged and stays under a second; no change in
members' response times.

## Parked — collect later, proposed after slice 1

- Acquisition source: store UTM / referrer / incoming `refer_code` on the account at signup (app change, fe).
- Login/activity history (a per-member-per-day activity row) if the action union proves too coarse.
- Payment settled and refund timestamps.
- GA4 (from `mootech-ga4-instrumentation-001`): reconcile GA4 DAU with server DAU; the Exploration; the GA4 Data API pull.
- Activation ("aha") analysis once cohorts exist; one revenue number instead of two in `/ops`.

## Open before go

- **Q1 placement:** C (bazi on its own host) — lean.
- **Q2 key:** separate `BDASH_KEY` (lean) or the shared `BACKSTAGE_KEY`.
- **Q3 host name:** `bdash.staging.mumate.co` (the zone we hold on DO DNS; the name says staging but the data is production, as with `bazi-sft.staging`).
- **Q4 read-only role:** yes / later.
- **Q5 bazi PR:** who merges our bazi PR (owner or เอ็ม), given direct pushes to `pdf-dev`.

## Boundaries

- No change to `/ops` or its write paths; no member-facing change.
- No new data collection in slice 1.
- Production DB, env and DNS changes only on the owner's word.

## Review and estimated effort

| Slice | Active effort | Waits on |
|---|---:|---|
| 1 · dashboard + five metrics | 1-1.5 days | Q1-Q5, DNS, key, merges, a release |
