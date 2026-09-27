# MuMate — leave Vercel for DigitalOcean only once DO does 100% of what Vercel does, with a real staging

**Workstream:** `mumate-vercel-to-do-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

Move MuMate's two remaining hosted services, `mootech-fe` (public app,
`bazichart.mumate.co`) and the bazi engine (`bazi-sft-dataset`, today
`bazi-sft-dataset.vercel.app`), from Vercel to DigitalOcean, and only when the
DigitalOcean side already does everything Vercel does for them today. Supabase
stays the database and storage.

The owner's direction, 2026-09-27 afternoon:

> ก่อนจะย้ายจริง ยังไงต้องทำให้ DO 100% ก่อน, แล้ว ข้อดีของ vercel ก็คือ มัน
> rollback ง่ายมาก และเราจะเสียตรงนั้นไป , เพราะเท่ากับว่าเราดูแลเองทั้งหมด …
> และถ้าเราปิด staging เราจะไม่มีสนามทดลองแล้ว ดังนั้น ผมคิดว่าเราน่าจะต้อง
> คิดเรื่อง เปิด staging droplet ด้วย … ควรจะเปิด workstream ใหม่สำหรับอันนี้โดยเฉพาะ

and on the cutover itself:

> ตอนที่เราจะย้าย server เราก็ต้อง maintenance page หรือ maintenance mode ระยะ
> นึงก่อนอยู่ดี … แล้วให้ ทีมเข้ามา review production ก่อน แล้วค่อยเปิด gate
> แล้วให้ user ใช้ DO จริง … ดีกว่าการ flip แล้ว user เข้ามาใช้แล้วแตก

Four rules follow for this plan:

1. **"100%" is a checklist, not a feeling.** Every Vercel duty listed in the three
   research files beside this plan has a DigitalOcean equivalent proven on
   staging, or an explicit owner acceptance that it is dropped.
2. **Rollback is designed, not assumed.** Vercel's instant rollback is lost; the
   plan names what replaces it and measures it before anyone relies on it.
3. **Two environments, one control room.** Production on DigitalOcean never
   becomes the only place to try things, and the control room sees staging and
   production side by side.
4. **Users never meet a half-moved or broken site.** The move happens behind a
   maintenance gate, the team reviews real production through a bypass, and only
   the owner opens the gate. Outside planned windows, a failing app shows a
   maintenance page, not an error.

## Why a new workstream

`mumate-infra-move-001` closed at slice 3 on 2026-09-26 and says a resumed move
opens a new workstream citing its closing decision
(`memory/events/2026/09/26/20260926T131821_mumate_infra_move_close_at_slice_3.yaml`)
rather than reopening its plan. Its slices 4 and 5 were written for three
services, one droplet, and a shadow on the production database. Since then
`mumate-be-retirement-001` took `mootech-be` out of the app (mootech-fe PR 830,
2026-09-27), the 2026-09-27 research found duties that plan never listed, and
the owner wants a lasting staging environment.

This plan carries forward, and does not re-derive, everything that workstream
and `mumate-control-room-ops-001` built: containers and their workflows, the
control room (`mumate-infra`), Tailscale access, observability, backup and
restore. Both are completed and stay closed.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | the public app; code changes to run correctly off Vercel (slice 2) | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `bazi-sft-dataset` | the engine; code changes to run correctly off Vercel (slice 2); production branch `pdf-dev` | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `mumate-infra` | the control room: compose, Caddy, timers, deploy, rollback, runbooks, both droplets | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan, its research and its events | `.` |

## Starting evidence

Three read-only research passes on 2026-09-27, filed under `research/`:

- `research/fe-vercel-inventory.md` — mootech-fe `fd3220b`.
- `research/bazi-vercel-inventory.md` — bazi-sft-dataset `origin/pdf-dev` `72ca612`.
- `research/do-coverage.md` — mumate-infra `origin/main` `cc3ce8b` and the ciel-os records.

Re-read in code by the HQ session: next-auth `detect-origin.js`; mootech-fe
`lib/db/index.ts` (`max: 1`); bazi `almanac/route.ts:31` and twelve other routes
reading `ADMIN_DOCTRINE_TOKEN` (unset → allowed); bazi `rate-limit.ts`
`clientIp`; bazi `account-purge` (no status filter in the select or the loop).

Added for revision 0.2 (same session, read-only):

- **Existing maintenance gate is reusable.** mootech-fe `middleware.ts:5-8` and
  `:469-500`: `MAINTENANCE_MODE=on` rewrites to `/maintenance`, `?bypass=<key>`
  sets a 24 h httpOnly cookie, and an exact allow-list lets `/api/health`,
  `/api/auth*`, `/api/cron/*` and both payment webhooks through.
  `pages/maintenance.tsx` has no data dependency. `scripts/container-smoke.sh`
  step 3 already proves the gate on the image. The `/launch` console
  (`lib/launch/vercel.ts`) is how the gate was flipped on Vercel for the v2
  launch. Gaps: `/api/v2/push/fire` is not allowed through; bazi has no gate;
  the page lives inside the app, so it cannot show when the app is down.
- **bazi is mostly internal already.** Every FE call to bazi is server-side
  through `BAZI_BASE_URL` (engine-chart-server, matching clients, ops engine,
  qi grant, calendar). Browser-facing bazi surfaces remain: its own pages
  (38 under `src/app`, including team tools `/ops`, `/reading/doctrine*`,
  knowledge and sacred-map editors), the what-if share URL and QR
  (`WhatIfExperience.tsx:45`, hard-coded to `bazi-sft-dataset.vercel.app`), LIFF
  inside bazi (`sacred-map/share.ts`, `louise-hay/liff-client.ts`), and any
  external `/api/v1` client holding `OPEN_WEBUI_API_TOKEN`.
- **LINE.** The Messaging API webhook the owner showed points at a Google Apps
  Script, not at FE or bazi, so it does not move. The eight LIFF apps shown
  belong to channel `2009228997`; mootech-fe's LIFF default is
  `2011679472-sNcCbR2K` (`lib/line/liff.ts:10`), a different channel whose LIFF
  endpoints were not shown. Neither repository references a `2009228997` id.

## What Vercel does for MuMate today, and what replaces it

| Vercel duty | Replacement on DO | Where in this plan |
|---|---|---|
| Runs 6 crons (fe: push-reminders */1, reconcile-payment */15, manifest-morning */1; bazi: bazi-alerts, qi-quota-reset, account-purge) with `CRON_SECRET` | systemd timers calling each route with the Bearer secret, `AccuracySec=1s`, `OnFailure` alert; exactly one runner per job | slice 3, proven slice 4 |
| Instant rollback | Images tagged by SHA; `deploy.sh` auto-rollback on unhealthy; one-command rollback to the previous SHA, measured; during the transition, Vercel kept as a DNS flip-back until the owner retires it | slices 3-4, 6-7 |
| Auto-deploy on merge; preview per branch | Staging deploys the merged SHA automatically; production promotes the same SHA, run by เอ็ม | slices 1, 3 |
| Horizontal scaling, one DB connection per instance | Measured pool size; FE `max` raised to fit; bazi event loop and memory measured under load; a second replica only if the load test says so | slices 2, 4 |
| Kills runaway requests (`maxDuration`) | App-level timeouts on LLM/upstream calls; proxy timeouts | slices 2-3 |
| A platform that never shows a raw error | Caddy holds requests through a restart and serves a static maintenance page when the app does not answer | slice 3 |
| Trusted client IP, HTTPS, HSTS, HTTP/2-3, compression, edge firewall | Caddy (IP, TLS, HSTS, encode, body cap); FE forwards client identity to bazi; no CDN/WAF for now | slices 2-3 |
| Hostnames it owns (`bazi-sft-dataset.vercel.app`) | bazi internal-only by default; each remaining browser surface moved behind FE, the tailnet, or a restricted host | slices 1-2, 6 |
| Environment store, build-time values | Owner-placed env files per environment rebuilt from a fresh Vercel read; GitHub `production` Environment variables | slices 3, 5 |
| Function logs | Grafana/Loki, alerts and synthetics for both environments | slice 3 |
| Keeps the platform patched and up | We own it: OS updates and reboots, disk, Docker, certificates, capacity, on-call, host backup | slices 3-4 (runbooks and drills) |

## Owner decisions (answered 2026-09-27)

- **D1 Topology — decided.** `mumate-2` stays **staging**; a new **production**
  droplet is created from the repository. Owner addition: **the control room
  must observe both droplets**, so staging and production can be compared — the
  same event seen on one and not the other is itself a signal. Cost: one more
  droplet (list price about USD 24/month for s-2vcpu-4gb, unchecked against the
  company bill); company-side Owner action for billing.
- **D2 Staging isolation — decided: full.** Staging gets its own Postgres
  restored from the nightly backup, its own Storage bucket, Beam Playground and
  Omise test keys, no production QStash. The owner's reason: rehearse every case
  fully before release. No LINE test channel is known to exist; staging LINE
  sending stays off until one is created. Staging's copy of member data follows a
  written rule (tailnet-only access, refresh on demand, wipe after use).
- **D3 bazi exposure — revised by the owner's question.** The owner asked
  whether bazi needs a public hostname at all, since it serves only the FE.
  Largely yes: the FE already reaches bazi server-side only. Target: **bazi has
  no public hostname on DigitalOcean.** Slice 1 settles each remaining browser
  surface with the team (เอ็ม): team tools reached over the tailnet or through the
  FE's `/ops`; the what-if share page moved to or redirected through the FE;
  bazi's LIFF uses re-homed or dropped; any external `/api/v1` client named or
  cut. The Vercel bazi project keeps answering old share links with a redirect
  until the owner retires it. This also removes bazi's admin routes from the
  internet after the move.
- **D4 Release flow — decided.** Merge → image built → **staging deploys that SHA
  automatically** → **production promotes the same SHA**, and **เอ็ม is the one
  who promotes**. Built as a GitHub workflow with an environment approval so
  promotion needs no SSH. The team is told before the flip that "merge and it is
  live" ends.
- **D5 Edge protection — decided.** No Cloudflare for now: Caddy, the DO firewall,
  and a rate limit on bazi's ops login. Revisit after the slice-4 load test.
- **D6 The 100% checklist — decided.** Each row is either "done and proven" or
  "the owner accepts it as dropped"; never "skipped". The owner signs it before
  slice 5.
- **D7 Timing — decided: no date.** The owner is in no hurry: v2 has just
  launched and users should use it for a while. Slices 1-5 may proceed; the flip
  is proposed only when production is calm, both observations of 2026-10-04 have
  closed, be-retirement R7 is not in the same week, the team's merge rate is low,
  slice 5 is done — and the owner says go.
- **D8 Maintenance-gated cutover with team review — decided (new).** See slice 6.
  The existing FE gate is reused; the owner alone opens the gate.
- **D9 Production payment test — decided (new).** One real purchase during the
  review window, then a refund.
- **D10 Vercel after the flip — decided (new).** Kept as the flip-back target
  until the owner says to retire it; no fixed number of days.
- **D11 Never a raw error — decided (new).** A deploy or a crash must show the
  maintenance page, never a broken site. See slice 3.
- **Parallel work — approved.** This workstream may overlap
  `mumate-be-retirement-001` and `mumate-login-identity-001` on mootech-fe and
  bazi-sft-dataset while those observe; if PR 830 has to be reverted, this
  workstream's changes to mootech-fe pause first.

## Owner-supplied facts (2026-09-27, not verified by the agent)

- Vercel production env has `CRON_SECRET`, `APP_DATABASE_URL` and `QSTASH_*`;
  **`ADMIN_DOCTRINE_TOKEN` is not set**, so bazi's admin routes are open on
  production today.
- Vercel region is `sin` (the 2026-09-20 measurement of bazi on `iad1` may be
  stale; any latency gain from sgp1 is to be re-measured, not assumed).
- mootech-fe Preview "probably" still resolves to the production database.
- The owner cannot edit DNS at Namecheap; the team does. Every DNS step in this
  plan is performed by the team.
- No Supabase or Gemini IP restriction exists.
- No LINE test channel is known.

## Execution slices and acceptance criteria

Slices 1 to 5 move no production traffic, change no DNS for a production
hostname, and change no provider setting on Vercel. Every slice needs its own
owner decision after the previous closeout.

### 1. Two environments on DigitalOcean, one control room

Make `mumate-2` a staging that cannot reach production data, money or users
(D2). Create the production droplet from the repository, joined to the tailnet,
no public port 22, no application traffic, no production secret yet. Remove the
shadow's production connections, live payment keys and the BE residue that R7
does not need to keep. Settle D3 surface by surface with the team, and list the
LIFF apps of channel `2011679472` with their endpoint URLs. Extend the control
room to both hosts: one dashboard with an environment label, alerts and
synthetics per environment, `ops-status` for both, and a comparison view of
what each runs (image SHAs, env key names, timer states).

DoD: staging serves FE and bazi against its own database and bucket with test
keys, and a read-only check shows no staging write reaches production. The
production droplet exists, is tailnet-only, and was built by the repository's
scripts. The control room reports both hosts side by side. The staging
data-handling rule is written in `mumate-infra`. Every bazi browser surface has
a recorded destination.

### 2. The applications run correctly off Vercel

Code changes in mootech-fe and bazi, reviewed like any launch-team PR, landed
on staging first:

- FE: runtime `NEXTAUTH_URL` (or `AUTH_TRUST_HOST` behind Caddy) with the same
  `NEXTAUTH_SECRET`; `/api/v2/push/fire` exempt from the maintenance gate and
  guardV2, signature check kept; a visible environment marker (a response
  header and `/api/health` naming the environment and SHA) so a reviewer can
  tell DigitalOcean from Vercel; `/launch` and `/ops` stop reporting Vercel; bazi
  base and what-if URLs from env; DB pool `max` from a measured pooler size, with
  an audit for pool calls inside open transactions; one source of truth for the
  reconcile interval; the what-if share page per D3.
- bazi: trusted client identity from the FE (internal network only) so rate
  limits and budgets are per user; `APP_DATABASE_URL` required; empty env values
  do not take the app down; admin routes fail closed when `ADMIN_DOCTRINE_TOKEN`
  is unset; timeouts on LLM and Gemini calls; `SHARE_URL` from env; `sharp` a
  direct dependency.

DoD: each change merged, deployed on staging, and proven there by a test that
fails without it.

### 3. The control room replaces every Vercel platform duty

In `mumate-infra`, for both environments: the six cron timers (installed,
disabled on production until the flip); Caddy production site block for the FE
only, `:80` redirect, HSTS, `encode`, body cap, the keep-alive 502 fix; **D11:
Caddy retries through a container restart and serves a static copy of the
maintenance page when the upstream fails**, so neither a deploy nor a crash
shows a raw error; `rollback.sh` that recreates fe and bazi, and a one-command
rollback to the previous SHA; bazi autoheal like `fe-recover`; env inventories
rebuilt from a fresh owner-run Vercel read, with the example files brought level
with the code; the D4 release flow (staging automatic, production promotion by
เอ็ม); a rate limit on bazi's ops login.

DoD: every item merged and running on staging; the production droplet carries
the same configuration with its timers disabled.

### 4. Parity proven on staging — the 100% checklist and the drills

Run on staging and record with evidence: each cron fires exactly once at its
time and alerts on failure; a good deploy; a bad deploy that rolls itself back;
a manual rollback to the previous SHA, timed from decision to healthy; a killed
app showing the maintenance page and recovering unattended; a droplet reboot; a
database restore; a planned maintenance window with bypass; every login
provider; a sandbox payment and its webhook; a QStash push; SSE chat; a load test
sized to production's busiest hour, with event-loop lag and memory recorded.

DoD: the D6 checklist has no open row, the rollback time is a measured number,
and the owner signs the checklist.

### 5. Production dressed and verified without traffic

Production env from the fresh Vercel read, production images from the GitHub
`production` Environment, the same smoke as slice 4 against the production
droplet through a pinned host entry or a verification hostname, reading
production data without writing beyond what the smoke records. The cutover
runbook of slice 6 — order, gates, flip-back triggers, who does what, the
team's DNS steps — is written and rehearsed end to end on staging.

DoD: production passes the smoke, the runbook rehearsal is timed, and D7's
conditions are recorded as met or the slice waits.

### 6. The cutover behind a maintenance gate, opened by the owner

Announced to users ahead of time, in a low-traffic window chosen from measured
traffic, with the reviewers named:

1. The team lowers the DNS TTL at least 24 hours ahead; old values recorded.
2. Releases frozen on named SHAs.
3. Maintenance on at Vercel (env change plus redeploy) and confirmed on the real
   domain before anything else moves. DigitalOcean production starts in
   maintenance.
4. Vercel crons off in both projects in the same step the DigitalOcean timers go
   on.
5. The team repoints DNS for `bazichart.mumate.co`; LIFF endpoints repointed if
   slice 1 found any on the old host.
6. **Team review through the bypass on the real domain**, each reviewer first
   confirming the environment marker says DigitalOcean. The checklist includes
   every login provider, the D9 real payment and refund, a push, the cron
   timers' first runs, and the bazi-backed pages.
7. **Pass: the owner opens the gate.** Fail: DNS points back to Vercel while
   maintenance is still on, and the owner reopens on Vercel. Users see
   maintenance in both cases, never a half-moved site.
8. Vercel stays in maintenance after the gate opens, catching stale DNS and
   remaining the flip-back target (D10).

DoD: the public hostname serves the named SHAs from DigitalOcean; each job has
exactly one runner; the team's review is recorded; the owner opened the gate;
the flip-back path is still usable.

### 7. Observation and retiring Vercel

Watched from the production dashboards and alerts, compared with staging. Vercel
stays until the owner says to retire it; then its projects, domains and
integrations are removed one by one, each on the owner's explicit approval with
an exact target list. The deferred application-side observability decision is
put to the owner here.

DoD: DigitalOcean healthy under real traffic; no Vercel duty left undone; each
removal approved and recorded; the final closeout names what was removed, what
remains, the recovery path and every unresolved risk.

## Boundaries

- Supabase stays the database and file store; no schema migration belongs to
  this plan.
- Product behaviour does not change except where Vercel's absence forces it,
  and each such change is named in slice 2.
- The launch team's features stay theirs. Slice 2 changes touch their
  repositories and are coordinated through normal PR review.
- Secrets are placed by the owner; agents see names, never values.
- DNS changes are made by the team; deleting a droplet, a Vercel project, a
  domain or a DNS record, and every billing change, is the owner's decision.

## Relations to other workstreams

- `mumate-infra-move-001` (completed) and `mumate-control-room-ops-001`
  (completed): source of everything already built; their carried candidates are
  absorbed here, as listed in `research/do-coverage.md` section 9.
- `mumate-be-retirement-001` and `mumate-login-identity-001` (active, observing
  to 2026-10-04): their rollback is a revert of mootech-fe PR 830 while Render
  stays up. This plan does not cut over before their windows close (D7), and
  slice 1 keeps the `be` service definition that R7 step 5 removes.
- `mumate-backup-001` (completed): the nightly backup is the source of the
  staging database in D2.

## Review and estimated effort

| Slice | Active effort | Waits on |
|---|---:|---|
| 1 · two environments, one control room | 8-12 h | slice-1 decision; company Owner for billing; เอ็ม for D3 surfaces |
| 2 · apps off Vercel | 10-16 h plus review | slice 1 staging; team coordination |
| 3 · control room parity | 12-18 h | slice 1 |
| 4 · parity proven | 6-10 h | slices 2-3 |
| 5 · production dressed | 4-8 h | slice 4 signed |
| 6 · gated cutover | 4 h prep plus the window | D7; owner, reviewers and the team's DNS in the window |
| 7 · observation, retirement | 3-6 h over the owner's window | slice 6 stable |

About 50-75 active hours plus the observation window. Slices 2 and 3 can run
side by side once slice 1 closes.
