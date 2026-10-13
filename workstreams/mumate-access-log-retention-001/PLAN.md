# MuMate — keep production access logs 90 days, then delete them

**Workstream:** `mumate-access-log-retention-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

The owner, 2026-10-13, asked whether logs fill the disk and whether old logs
roll off on their own ("ดูย้อนหลังได้ 6 เดือนพอ แล้วลบเดือนเก่าออกไป
เรื่อยๆ"). After the report he agreed with its recommendation and decided:
"1. เก็บนาน 90 วัน ตาม กฎหมาย 2. ค่า DO space ผมเข้าใจว่าผมจ่ายไว้แล้ว
3. ไม่จำเป็นก่อน ณ ตอนนี้" (no legal review now; whether the Computer-related
Crime Act applies to MuMate is the team's call). Goal: every production
access-log line is kept off-host for 90 days and deleted after, without
anyone remembering to do it.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mumate-infra` | Caddyfile, compose volume, archive timer | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (2026-10-13 10:37 +07)

- prod-1 root disk 77 GB, 11 GB used (15%); docker images 6.4 GB (4.7 GB
  reclaimable); journald 40 MB. Logs cannot fill it: json-file caps per
  service (fe/bazi 20m×5, caddy 50m×5, daemon default 20m×5), disk alerts at
  DO (>80%) and Grafana (<15% free).
- What is kept today: caddy stdout in json-file, lost on every caddy
  recreate (on 2026-10-13 only ~10 h remained); Grafana Cloud Loki free tier,
  14 days, redacted copy.
- Thai law (agent's web research, not legal advice): MDES notification on
  traffic-data retention B.E. 2564 (Royal Gazette 13 Aug 2021), clause 12:
  at least 90 days; clause 9: integrity-preserving, access-restricted storage
  (central log server / archiving). PDPA s.37(3): delete when the period ends.
- DO Spaces is already paid: bucket `mumate-backups` (sgp1) holds the nightly
  production DB dumps (runbook 02, `bin/backup.sh`, 14-day retention). The
  $5/month subscription covers 250 GiB; 14 nightly dumps plus ~1 GB of
  gzipped logs per 90 days (estimate from ~47k requests/day) fit inside it
  (bucket usage not read this round).
- Caddy's file output rolls and gzips itself: `roll_size`, `roll_keep`,
  `roll_keep_for` (docs; to be proved on 2.10.0 in step 1).

## Slice 1 — 90 days off-host, deleted after

| # | Step | Who | Check |
|---|---|---|---|
| 1 | Prove on a local Caddy 2.10.0: a second, named access logger writes JSON to `/var/log/caddy/access.log` (rolled daily, gzipped, `roll_keep_for 720h`) while stdout keeps feeding Loki unchanged | agent | both outputs carry the same request ids; a forced roll leaves a `.gz` |
| 2 | Spaces: bucket `mumate-logs` (sgp1) with a lifecycle rule expiring objects after 90 days; a key scoped to that bucket, placed by the owner in `env/logs-archive.env` on prod-1 | owner (key) + agent (bucket, rule) | `get-bucket-lifecycle-configuration` shows 90 days; key names only ever displayed |
| 3 | infra PR: Caddyfile logger, compose volume `/var/log/mumate/caddy`, `bin/logs-archive.sh` (uploads rolled `.gz` files not yet in the bucket to `caddy/<host>/`, verifies size), a systemd timer enabled on production only, Discord line on failure, runbook 04 section | agent | `scripts/test-all.sh` green; owner merges |
| 4 | Deploy to staging first, then prod-1 on the owner's word (caddy recreate = a few seconds; json-file history resets as it does on every recreate) | owner's word | after 24 h: one object per day in `mumate-logs/caddy/mumate-prod-1/`, host directory < 30 days |

DoD: production access logs exist off-host for 90 days and disappear after
by the bucket rule; the host keeps at most 30 days; Loki unchanged; a failed
upload is announced in Discord.

## Open before go

- **Q1 · bucket:** a separate `mumate-logs` bucket with its own key (lean:
  the backup key and dumps stay isolated) or a `logs/` prefix inside
  `mumate-backups`.
- **Q2 · staging:** archive production only (lean; staging is team traffic).

## Boundaries

- No change to the backup job or `mumate-backups`.
- No legal review, no user-id logging, no IP masking in this slice (team's
  decisions, recorded as unresolved).
- Production env and DNS untouched except the new `env/logs-archive.env`.

## Review and estimated effort

| Slice | Active effort | Waits on |
|---|---:|---|
| 1 · 90 days off-host | 2-3 h | Q1-Q2, the owner's key, merge and word |
