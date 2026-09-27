# MuMate — leave Vercel for DigitalOcean only once DO does 100% of what Vercel does, with a real staging

**Workstream:** `mumate-vercel-to-do-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
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

Read literally, that sets three rules for this plan:

1. **"100%" is a checklist, not a feeling.** Every Vercel duty listed in the three
   research files beside this plan has a DigitalOcean equivalent proven on
   staging, or an explicit owner acceptance that it is dropped. The flip is not
   proposed while any row is open.
2. **Rollback is designed, not assumed.** Vercel's instant rollback is lost; the
   plan names what replaces it and measures it before anyone relies on it.
3. **Two environments.** Production on DigitalOcean never becomes the only place
   to try things. A staging environment that cannot touch production data,
   money or users stays after the move.

## Why a new workstream

`mumate-infra-move-001` closed at slice 3 on 2026-09-26 and says a resumed move
opens a new workstream citing its closing decision
(`memory/events/2026/09/26/20260926T131821_mumate_infra_move_close_at_slice_3.yaml`)
rather than reopening its plan. Its slices 4 and 5 were written for three
services (FE, BE, bazi), one droplet, and a shadow on the production database.
Since then:

- `mumate-be-retirement-001` took `mootech-be` out of the app on 2026-09-27
  (mootech-fe PR 830), so only two services move.
- The research of 2026-09-27 found duties that plan never listed: six cron jobs
  with no DO runner, a Vercel-owned bazi hostname, NextAuth origin behaviour,
  a one-connection database pool in a single process, and bazi rate limits that
  collapse to one bucket behind an internal network.
- The owner now wants a lasting staging environment, which changes the topology.

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

The HQ session re-read the highest-impact claims in code before filing:
next-auth `detect-origin.js` (origin from `VERCEL`/`AUTH_TRUST_HOST`, else
`NEXTAUTH_URL`), mootech-fe `lib/db/index.ts` (`max: 1`), bazi
`almanac/route.ts:31` (`ADMIN_DOCTRINE_TOKEN` unset → allowed), bazi
`rate-limit.ts` `clientIp` (XFF, else `"unknown"`), bazi `account-purge` (no
status filter in the select or the loop).

## What Vercel does for MuMate today, and what replaces it

| Vercel duty | Replacement on DO | Where in this plan |
|---|---|---|
| Runs 6 crons (fe: push-reminders */1, reconcile-payment */15, manifest-morning */1; bazi: bazi-alerts, qi-quota-reset, account-purge) with `CRON_SECRET` | systemd timers calling each route with the Bearer secret, `AccuracySec=1s`, `OnFailure` alert; exactly one runner per job | slice 3, proven slice 4 |
| Instant rollback (re-point to an old build) | Images tagged by SHA; `deploy.sh` auto-rollback on unhealthy; a one-command rollback to the previous SHA, measured; during the transition, Vercel kept warm as a DNS flip-back | slices 3-4, 6-7 |
| Auto-deploy on merge; preview per branch | Staging deploys the merged SHA; production promotes the same SHA after staging (owner-approved, per the owner's AI-ops guardrails); the arena for isolated experiments | slices 1, 3 |
| Horizontal scaling, one DB connection per instance | Measured pool size; FE `max` raised to fit; bazi event-loop and memory measured under load; a second replica only if the load test says so | slices 2, 4 |
| Kills runaway requests (`maxDuration`) | App-level timeouts on LLM/upstream calls; proxy timeouts | slices 2-3 |
| Trusted client IP, HTTPS, HSTS, HTTP/2-3, compression, CDN, edge firewall | Caddy (IP, TLS, HSTS, encode, body cap); FE forwards client identity to bazi; CDN/WAF an owner decision | slices 2-3 |
| Hostnames it owns (`bazi-sft-dataset.vercel.app`) | A `mumate.co` hostname for bazi; every caller, share link and the LINE console repointed | slices 1-2, 6 |
| Environment store, build-time values | Owner-placed env files per environment rebuilt from a fresh Vercel read; GitHub `production` Environment variables | slices 3, 5 |
| Function logs | Grafana/Loki, alerts and synthetics per environment (today staging only) | slice 3 |
| Keeps the platform patched and up | We own it: OS updates and reboots, disk, Docker, certificates, capacity, on-call, host backup | slices 3-4 (runbooks and drills) |

## Owner decisions this plan needs

Each carries the agent's recommendation. None is taken by this revision.

- **D1 Topology.** Recommended: keep `mumate-2` as **staging**, and create a new
  **production** droplet from the repository with `bin/do-create.sh` (a rebuild
  was proven in 6 min 35 s). Production then starts clean — no experiment
  residue, no `.bak` env copies, no `be` service — and the rebuild-from-repo
  claim is exercised for real. The alternative, promoting `mumate-2` and building
  a new staging, carries the residue into production. Cost: one more droplet;
  s-2vcpu-4gb lists at about USD 24/month (not checked against the company
  bill). Company-side Owner action is needed for billing.
- **D2 Staging isolation.** Today's shadow reads and writes the production
  database and Storage bucket and holds live payment keys. Recommended: staging
  gets its own Postgres restored from the nightly backup (the arena path, restore
  proven at 83 s), its own Storage bucket, Beam Playground and Omise test keys, no
  `QSTASH_TOKEN` or a separate QStash, and its own LINE channel if the team has
  one. Crons can then run on staging and be proven. A copy of member data on
  staging is personal data: same tailnet-only access, refresh and wipe rules to
  be written in slice 1. The alternative, a separate Supabase project, costs
  money and a migration path.
- **D3 Bazi public hostname.** Recommended: `bazi.mumate.co`; keep the Vercel
  bazi project answering old share links with a redirect for a stated period.
- **D4 Release flow after the move.** Recommended: merge → image built → staging
  deploys that SHA → production promotes the same SHA by an approved command.
  Who may promote is the owner's call; the launch team's "merge and it is live"
  habit ends, and they must hear that before the flip, not after.
- **D5 Edge protection.** Vercel's firewall and DDoS shield go away. Options:
  accept Caddy plus a DO firewall, or put Cloudflare (free) in front, which then
  requires trusted-proxy configuration. Recommended: decide in slice 3 with the
  load-test data.
- **D6 The 100% checklist.** The research rows become one checklist the owner
  signs at the end of slice 4. Recommended: the owner may mark a row "accepted as
  dropped", never "skipped".
- **D7 Timing.** Recommended: no flip before both observations close on
  2026-10-04 and not in the same week as be-retirement R7 (Render suspend and
  delete), and only after the launch team's merge rate is below about three a day
  for two consecutive days.

## Execution slices and acceptance criteria

Slices 1 to 5 move no production traffic, change no DNS for a production
hostname, and change no provider setting on Vercel. Every slice needs its own
owner decision after the previous closeout.

### 1. Two environments on DigitalOcean

Take D1 to D3. Make `mumate-2` a staging that cannot reach production data,
money or users (D2). Create the production droplet from the repository, joined
to the tailnet, with no public port 22, no application traffic and no
production secret yet. Remove the shadow's production connections, live payment
keys and the BE residue that R7 does not need to keep.

DoD: staging serves FE and bazi against its own database and bucket with test
payment keys, and a read-only check shows no staging write reaches production.
The production droplet exists, is reachable over the tailnet only, and was
built by the repository's own scripts. The staging data-handling rule (who can
read, when it is refreshed, when it is wiped) is written in `mumate-infra`.

### 2. The applications run correctly off Vercel

Code changes in mootech-fe and bazi, reviewed like any launch-team PR, landed
on staging first:

- FE: runtime `NEXTAUTH_URL` (or `AUTH_TRUST_HOST` behind Caddy) with the same
  `NEXTAUTH_SECRET`; `/api/v2/push/fire` exempt from the maintenance gate and
  guardV2, signature check kept; `/launch` console and `/ops` health stop
  reporting Vercel; bazi base and what-if URLs from env, not hard-coded; DB pool
  `max` set from a measured pooler size, with an audit for pool calls inside open
  transactions; one source of truth for the reconcile interval.
- bazi: trusted client identity from the FE (internal network only) so rate
  limits and budgets are per user; `APP_DATABASE_URL` required, no silent
  fallback; empty env values do not take the app down; admin routes fail closed
  when `ADMIN_DOCTRINE_TOKEN` is unset; timeouts on LLM and Gemini calls;
  `SHARE_URL` from env; `sharp` a direct dependency.

DoD: each change merged, deployed on staging, and proven there by a test that
fails without it.

### 3. The control room replaces every Vercel platform duty

In `mumate-infra`, for both environments: the six cron timers (installed,
disabled on production until the flip); Caddy production site blocks, `:80`
redirect, HSTS, `encode`, body cap, the keep-alive 502 fix; `rollback.sh` that
recreates fe and bazi and a one-command rollback to the previous SHA; bazi
autoheal like `fe-recover`; alerts, synthetics and Better Stack per
environment; env inventories rebuilt from a fresh owner-run Vercel read, with
the example files brought level with the code; the release flow of D4; D5
taken.

DoD: every item merged and running on staging; the production droplet carries
the same configuration with its timers disabled.

### 4. Parity proven on staging — the 100% checklist and the drills

Run on staging and record with evidence: each cron fires exactly once at its
time and alerts on failure; a good deploy; a bad deploy that rolls itself back;
a manual rollback to the previous SHA, timed from decision to healthy; a killed
container and a droplet reboot recovering unattended; a database restore; a
maintenance window with bypass; every login provider; a sandbox payment and its
webhook; a QStash push; the LINE webhook; SSE chat; a load test sized to
production's busiest hour, with event-loop lag and memory recorded.

DoD: the checklist of D6 has no open row, the rollback time is a measured
number, and the owner signs the checklist.

### 5. Production dressed and verified without traffic

Production env from the fresh Vercel read, production images from the GitHub
`production` Environment, the same smoke as slice 4 against the production
droplet under a verification hostname or a pinned host entry, reading
production data without writing it beyond what the smoke records. The flip
runbook — order, gates, hard-rollback triggers, who does what — is written and
rehearsed end to end on staging, including the DNS step with a staging name.

DoD: production passes the smoke, the runbook rehearsal is timed inside the
two-hour budget, and D7's conditions are recorded as met or the slice waits.

### 6. The flip

Inside an owner-run maintenance window: lower TTLs at least 24 hours ahead and
record the old values; freeze releases on named SHAs; maintenance on; bazi then
FE onto DigitalOcean; LINE webhook and LIFF endpoint repointed; Vercel crons
switched off in both projects in the same step the DO timers go on; smoke on the
real domains; maintenance off only after the owner reads the smoke. Vercel is
kept warm for flip-back: Git and deployments left as they are so a flip-back
serves current code, crons disabled so no job runs twice.

DoD: both public hostnames serve the named SHAs from DigitalOcean; each job has
exactly one runner; the flip-back path is still usable.

### 7. Observation and retiring Vercel

Seven days by default with Vercel warm, watched from the production dashboards
and alerts. Then Vercel's projects, domains and integrations are removed one by
one, each on the owner's explicit approval with an exact target list. The
deferred application-side observability decision is put to the owner here.

DoD: DigitalOcean healthy under real traffic for the window; no Vercel duty
left undone; each removal approved and recorded; the final closeout names what
was removed, what remains, the recovery path and every unresolved risk.

## Boundaries

- Supabase stays the database and file store; no schema migration belongs to
  this plan.
- Product behaviour does not change except where Vercel's absence forces it,
  and each such change is named in slice 2.
- The launch team's features stay theirs. Slice 2 changes touch their
  repositories and are coordinated through normal PR review.
- Secrets are placed by the owner; agents see names, never values.
- Deleting a droplet, a Vercel project, a domain or a DNS record, and every
  billing change, is the owner's action.

## Relations to other workstreams

- `mumate-infra-move-001` (completed) and `mumate-control-room-ops-001`
  (completed): source of everything already built; their carried candidates are
  absorbed here, as listed in `research/do-coverage.md` section 9.
- `mumate-be-retirement-001` and `mumate-login-identity-001` (active, observing
  to 2026-10-04): their rollback is a revert of mootech-fe PR 830 while Render
  stays up. This plan does not flip before their windows close (D7), and slice 1
  keeps the `be` service definition that R7 step 5 removes.
- `mumate-backup-001` (completed): the nightly backup is the source of the
  staging database in D2.

## Review and estimated effort

| Slice | Active effort | Waits on |
|---|---:|---|
| 1 · two environments | 6-10 h | D1-D3; company Owner for billing |
| 2 · apps off Vercel | 10-16 h plus review | slice 1 staging; team coordination |
| 3 · control room parity | 10-16 h | slice 1 |
| 4 · parity proven | 6-10 h | slices 2-3 |
| 5 · production dressed | 4-8 h | slice 4 signed |
| 6 · flip | 4 h prep plus ≤2 h window | D7; owner in the window |
| 7 · observation, retirement | 3-6 h over ≥7 days | slice 6 stable |

About 45-70 active hours plus the observation window. Slices 2 and 3 can run
side by side once slice 1 closes, if the owner approves parallel lanes then.
