# MuMate — keep production access logs 90 days, then delete them

**Workstream:** `mumate-access-log-retention-001`
**State:** completed
**Execution lane:** single
**Plan revision:** 0.2
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

## Revision 0.2 (2026-10-13, owner go)

- Bucket `mumate-logs` (sgp1, Standard) and a Limited-access key (Read/Write/Delete
  on that bucket only) were made by the team; the env file is owner-held in
  `.assets/mumate/env/logs-archive.env`. Q1 answered: separate bucket. Q2: production only.
- A Limited key is documented as unable to set bucket lifecycle rules, so the
  90-day deletion is done by `bin/logs-archive.sh` itself (by the date in each
  object name), not by a bucket rule; no Full-access key is needed anywhere.
- Backfill added: before Loki's 14 days run out (~2026-10-23 for 10-09), the
  production access log from 2026-10-09 is exported from Loki once into the
  bucket (`caddy/mumate-prod-1/backfill/`).
- Production goes out together with mumate-image-weight-001 (owner: "ขึ้น prod
  พร้อมกัน"): one release, one caddy recreate.

## Slice 1 — 90 days off-host, deleted after

| # | Step | Who | Check |
|---|---|---|---|
| 1 | Prove on a local Caddy 2.10.0: a second, named access logger writes JSON to `/var/log/caddy/access.log` (rolled daily, gzipped, `roll_keep_for 720h`) while stdout keeps feeding Loki unchanged | agent | both outputs carry the same request ids; a forced roll leaves a `.gz` |
| 2 | Spaces: bucket and Limited key (done by the team); agent proves the key from a throwaway container: write/list/delete a test object in `mumate-logs`, refused on `mumate-backups` | team + agent | status lines only; key names only ever displayed |
| 3 | infra PR: Caddyfile logger, compose volume `/var/log/mumate/caddy`, `bin/logs-archive.sh` (uploads rolled `.gz` files not yet in the bucket to `caddy/<host>/`, verifies size, deletes objects older than 90 days by name date), a systemd timer enabled on production only, Discord line on failure, runbook 04 section | agent | `scripts/test-all.sh` green; owner merges |
| 4 | Deploy to staging first (file logger only, no upload), then prod-1 on the owner's word together with the image release: env file copied to `/opt/mumate/env/logs-archive.env` (600), infra pull, one caddy recreate, timer enabled | owner's word | after 24 h: one object per day in `mumate-logs/caddy/mumate-prod-1/`, host directory < 30 days |
| 5 | Backfill: production access log 2026-10-09 → go-live exported from Loki (read-only, owner's word) as daily gz files to `caddy/mumate-prod-1/backfill/` | agent, owner's word | one object per day, no gap with step 4 |

DoD: production access logs exist off-host from 2026-10-09 for 90 days and
disappear after (archive script, by name date); the host keeps at most 30 days; Loki unchanged; a failed
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
