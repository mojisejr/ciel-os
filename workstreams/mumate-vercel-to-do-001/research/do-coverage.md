# DO control room — what it already replaces and what it still lacks (FE + bazi)

Read-only research pass, 2026-09-27. Sources: `mumate-infra` `origin/main`
`cc3ce8b`, mootech-fe `fd3220b`, bazi-sft-dataset `origin/pdf-dev` `72ca612`,
and ciel-os records. No host was contacted. **V** verified in a file or event,
**I** inference, **U** not recorded anywhere locally.

## Headline

DO already covers runtime, TLS, deploy with rollback, backup, and ops
observability for the staging hosts. It covers none of the six scheduled jobs,
has no production hostnames, no CDN/WAF/rate limiting, no deploy on merge, one
FE process, and its alerts only watch staging. `/api/v2/push/fire` is still not
in the FE maintenance allow-list (`middleware.ts:470-477`, V).

## 1. Scheduling

| Item | State | Evidence | Blocker? |
|---|---|---|---|
| Host timers | Only `mumate-health.timer` (5 min) and `mumate-backup.timer` (02:00 UTC, enabled 2026-09-26). No application timers. V | `systemd/*`, `cloud-init.yaml` ("application-style timers stay DISABLED") | — |
| FE crons | `push-reminders` */1, `reconcile-payment` */15 (also gated by `RECONCILE_ENABLED`), `manifest-morning` */1 (records said hourly; code gates on the Bangkok hour/minute). Bearer `CRON_SECRET`. V | mootech-fe `vercel.json`, `pages/api/cron/*.ts` | Yes |
| Bazi crons | `bazi-alerts` 00:00, `qi-quota-reset` 17:00, `account-purge` 17:30 UTC, fail closed without `CRON_SECRET`. V | bazi `vercel.json`, `src/app/api/cron/*/route.ts` | Yes; `CRON_SECRET` missing from `env/bazi.env.example` |
| Cron-call design | None in any repo or record; PLAN §4 step 5 only says "enable DigitalOcean timers exactly once". V | infra-move PLAN.md:427 | Yes. Six units + a curl wrapper to `127.0.0.1:3000`/`3100` (I). `/api/cron/` already maintenance-exempt (V). |
| Shadow safety | No app timer can double production; `QSTASH_TOKEN` stripped; BE `@Cron` off; overnight log proof. V | 20260925T071037 (DoD 3c item 9) | — |
| At the flip | Vercel crons must be switched off in both projects; not written as a step anywhere. I | — | Runbook step |

## 2. Deploy pipeline

| Item | State | Evidence |
|---|---|---|
| Image build | `container-build.yml` in mootech-fe and bazi, manual `workflow_dispatch` only (owner decision 2026-09-19), inputs `push`, `target=staging\|production`, tag `<sha>` / `<sha>-staging`, never `latest`, GHCR via `GITHUB_TOKEN`. Owner dispatches. V | both workflows; 20260924T103730 |
| Build-time values | `NEXTAUTH_URL`, `HOST`, `NEXT_PUBLIC_*` baked; a production image needs GitHub `production` Environment variables in both repos. Only `staging` variables were ever recorded as set. V/U | Dockerfile ARGs; 20260920T153343 |
| Deploy | `bin/deploy.sh FE_TAG=… BAZI_TAG=… --profile full` over `ssh deploy@mumate-2`: validate compose + Caddy, save `.env.last-good`, pull, `up -d`, wait ≤120 s healthy, auto-rollback on failure, Discord alert. Recorded deploys healthy in 12-19 s. V | `bin/deploy.sh`, `bin/_lib.sh`, runbook 01 |
| Rollback | `bin/rollback.sh` restores `.env.last-good` and runs `compose up -d` with no `--profile`, so fe and bazi (profile `full`) are probably not recreated unless host `.env` sets `COMPOSE_PROFILES=full`. I (host `.env` unseen) | `bin/rollback.sh`; carried in 20260926T131821 |
| CD / previews | Neither. Merge → owner dispatches build → someone deploys over SSH. One shared staging slot (lanes contended 09-24/25) plus `bin/arena.sh` for an isolated DB. Vercel deploys ~4 s after merge (V, be-retirement records). | — |
| Downtime per deploy | One FE replica, no `lb_try_duration`/retry in Caddy → ~10-20 s of 502s per FE recreate. I | Caddyfile, compose |
| Who can deploy | `deploy` user over Tailscale SSH, in the docker group (effectively root); sudo limited to systemctl/journalctl/tailscale. Public 22 closed at the DO firewall (ufw still allows 22). V | cloud-init; 20260924T102001 |
| Compose trap | `be` uses `${BE_TAG:?…}`; `BE_TAG` must stay set until be is removed (be-retirement R7-5). V | `docker-compose.yml` |

## 3. Edge / HTTP (Caddy 2.10.0)

| Topic | Exists (V unless marked) | Gap |
|---|---|---|
| TLS | Auto HTTPS (HTTP-01/TLS-ALPN) for `app/api/bazi.staging.mumate.co` only; `admin off`. | No production site blocks ("real domains come in slice 4 through a separate PR"). Cert only after DNS points → short gap; no DNS-01 (stock image, Namecheap) (I). |
| HTTP→HTTPS | Hand-written `:80` block redirects only the staging hosts, 404 otherwise. | Production host must be added. Blocker. |
| HTTP/2/3 | Default on; 443/udp published and allowed. | — |
| Compression | No `encode`; Next gzip likely active (I). | `encode zstd gzip`. |
| Static caching | No Caddy headers, no CDN; a 140 kB chunk ~252 ms vs Vercel ~154 ms (20260920T171153). | CDN not a blocker. |
| Security headers | Only `X-Request-ID`; no HSTS. | Add HSTS. Low. |
| Body size / timeouts | Caddy defaults. | — |
| X-Forwarded-* | Caddy defaults, no `trusted_proxies` (I). | `trusted_proxies` if a CDN is added. |
| Rate limit / WAF / DDoS | 404 for `/.*`; fail2ban SSH only; DO Cloud Firewall is L4. | Nothing replaces Vercel edge protection (I). Owner risk call. |
| www / apex | Not configured; only production host on record is `bazichart.mumate.co`. | Apex/www today is U. |
| Maintenance | App-level only. | — |
| Keep-alive 502 | Diagnosed 09-24: Node closes idle sockets at 5 s, Caddy keeps ~2 min; neither `KEEP_ALIVE_TIMEOUT` nor Caddy `keepalive`/`lb_try_duration` set. V | Open; fix before the flip. |

## 4. Runtime

- Droplet `mumate-2`, s-2vcpu-4gb, sgp1, reserved IP, 2 GB swap; rebuild from repo proven in 6 min 35 s (do-create.sh, 20260920T052052). V
- Limits: fe `mem_limit 1g` + `--max-old-space-size=768`; bazi 1536m; alloy 256m; be 512m at scale 0; caddy none; no CPU limits. V
- `restart: unless-stopped`; Dockerfile healthchecks 30 s/5 s/3; `HEALTH_DB_TIMEOUT_MS` in host `fe.env`. V
- Autoheal: FE only — `bin/fe-recover.sh` via `health-notify.sh` recreates FE once per incident after two bad observations (~10 min), proven 2026-09-25 (20260925T204300, infra PR 20). Bazi unhealthy only alerts. V
- One FE process on 2 vCPU; no load test ever run. V
- Measured idle: fe 64 MB, bazi 167 MB, ~1.0-1.1 of 3.9 GB used, disk 11-13%; images 632 MB / 590 MB (09-20). Bazi on Vercel runs in iad1: health 504 ms warm on Vercel vs 47 ms on the shadow. V
- Logs: json-file rotation 20 MB × 5 per app, 50 MB × 5 caddy. V

## 5. Env and secrets

- Real files in `/opt/mumate/env/*.env` (600, owner-placed), Git holds `*.example`; agents see names, not values. Runtime values change with `up -d`; `NEXT_PUBLIC_*`/`NEXTAUTH_URL` need a rebuild. V
- Stripped from the shadow on purpose: `VERCEL_TOKEN`, `LAUNCH_DEPLOY_HOOK_URL`, `LAUNCH_KEY`, `RENDER_API_KEY`, `QSTASH_TOKEN`, `VERCEL_*`/`TURBO_*`/`NX_DAEMON`. V
- Must be added or changed at the flip: `QSTASH_TOKEN`; production values for the six FE secrets generated fresh for the shadow (`ANALYTICS_USER_ID_KEY`, `CALC_NONCE_SECRET`, `GLASS_BOX_KEY`, `OPS_DASHBOARD_KEY`, `V2_PREVIEW_KEY`, `WHATIF_KEY`) (20260920T153343); `GITHUB_TOKEN` empty.
- 20 FE and 4 bazi variables are Vercel "sensitive" (unreadable); rebuilt from other sources — a by-name comparison cannot catch a later value change.
- Shadow runs live Beam/Omise keys; recorded precondition: switch to Beam Playground before any payment test on the shadow (20260924T114838).
- `env/fe.env.example` drifted since PR 830: missing `SUPABASE_PROJECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `LOGIN_ASK_BEFORE_CREATE`, `HEALTH_DB_TIMEOUT_MS`, `RECONCILE_ENABLED`, `BEAM_API_BASE`; still lists retired `AI_CONSUME_SECRET`, `CONSENT_SECRET`, `CREDIT_ENFORCE`, `NEXT_PUBLIC_BACKEND_URL`. V
- `env/bazi.env.example` lacks `CRON_SECRET`, `SUPABASE_*`, `RESEND_*` and others the code reads. V
- Secret-bearing leftovers on the host: `env/be.env.bak-20260920-cors`, `env/fe.env.bak-3c`, `env/fe.env.pre-arena`, three `*.pre-arena-be` copies. Owner's call.

## 6. Observability

Exists (V): Caddy JSON access log with request id browser → Caddy → app; `bin/logs.sh`; health timer posting Discord embeds and phone push via Grafana IRM; Grafana Cloud (Alloy → Loki 14 days, known PII redacted, host metrics); alert rules (5xx burst, host log silence, disk < 15%, memory < 10%); Grafana synthetics (Singapore, Tokyo, 3 min) and Better Stack (3 min); DO CPU/memory/disk email alerts; "mumate ops" dashboard.

Gaps: synthetics, Better Stack and alert rules cover staging hosts only (rules hard-code `env="staging"`, `MUMATE_ENV` defaults to staging) — blind at the flip unless updated (V, blocker for a watched window). Production today is watched only by the owner's local pm2 `mootech-monitor`. No app error tracking or structured logs ("layer C", deferred). No `@vercel/*` analytics to replace.

## 7. Backup and restore

DB: nightly `pg_dump` 02:00 UTC to Spaces `mumate-backups/pg/`, 14-day retention, read-only role `mumate_backup`; 🚨 on failure, ops-status ❌ after 26 h; restore drill 83 s; first unattended run 2026-09-27 09:02 (142 MB). Not covered: Supabase Storage (~7.1 GB) by owner decision; path C (new Supabase project) written, not drilled; PITR off; Supabase Pro daily backups remain. DO Droplet Backups undecided (U). The close-at-slice-3 claim "timer disabled, one object" is stale — superseded by mumate-backup-001.

## 8. DNS and domains

| Item | State |
|---|---|
| `mumate.co` zone | Namecheap, run by the team; `staging.mumate.co` delegated to DO DNS (NS TTL 60 min, A records TTL 300). V (20260920T144757) |
| Production FE host | `bazichart.mumate.co` on Vercel. V |
| Production bazi host | `bazi-sft-dataset.vercel.app` — Vercel-owned, cannot move by DNS. On DO the FE reaches bazi internally (`BAZI_BASE_URL=http://bazi:3000`). V |
| Bazi public URL | LINE webhook registered against production; moving it needs a new public hostname (Namecheap + Caddy) and a LINE console edit, or it stays on Vercel. V/I |
| TTL of `bazichart.mumate.co` | Only a memory note says 3600; not in any local record. U |
| DNS rights | Whether the owner can edit Namecheap was asked 09-20 and is unresolved. |
| Recorded DNS plan | Only infra-move PLAN §4: lower TTL ≥24 h ahead, record old values, restore on rollback. |

## 9. Carried candidates and pre-flip preconditions

| # | Item | Source | Status 2026-09-27 |
|---|---|---|---|
| 1 | Merge rate < ~3/day for 2 days; 24 h freeze; final SHAs named (bazi `pdf-dev` takes direct pushes) | infra PLAN §4; 20260924T114838 | Open |
| 2 | Lower DNS TTL ≥24 h ahead; Namecheap rights | PLAN §4; 20260920T144757 | Open |
| 3 | `QSTASH_TOKEN` on the host | 20260926T131821 | Open (blocker) |
| 4 | `/api/v2/push/fire` maintenance exemption | 20260917T122744 | Still missing on fd3220b (V) |
| 5 | Vercel Preview resolves to the production DB | 20260924T103730 | Open (U whether fixed) |
| 6 | Shadow live Beam/Omise keys → Playground before payment tests | 20260924T114838 | Open |
| 7 | Storage proof on the shadow | 3c leftover | Effectively done 09-27 (be-retirement slice 3 W1 uploaded a friend photo via staging FE) (I) |
| 8 | Maintenance-bypass proof on DO | 3c leftover | Never exercised |
| 9 | Team payment test webhook | 3c | Superseded: callback proven 09-24 |
| 10 | FE recovery gap | 20260926T131821 | Partly stale: `fe-recover` proven; bazi has no autoheal |
| 11 | `rollback.sh` profile-blind | same | Open |
| 12 | Keep-alive 502 fix | 20260925T071037 | Open |
| 13 | Host `.bak`/`pre-arena` env copies | same, handoff | Open (owner's call) |
| 14 | mootech-fe pre-push gate red on main (`--no-verify` skips gitleaks) | multiple | Open |
| 15 | Facebook/Twitter callbacks for staging | 20260920 records | Open (shadow only) |
| 16 | Control-room-ops carry-overs: passive watcher, Beszel/Dozzle, Droplet Backups, reboot-required/fail2ban in ops-status, token expiry (Tailscale key 2026-12-21, DO tokens ~2026-11-19), ufw 22 | 20260924T102700 | Open, not blockers |
| 17 | Slice 5 observation, provider cancellation, app-side observability decision | 20260926T131821 | Not started |
| 18 | First identified here: no cron timers, no production Caddy blocks or `:80` redirect, GitHub `production` Environment vars, monitoring labelled staging, env examples drifted, bazi LINE webhook host | — | Open |
| 19 | Sequencing: be-retirement rollback (revert PR 830) needs Render BE up while DO runs `BE_SCALE=0`; observation windows close 2026-10-04, then R7 | handoff 20260927T132102 | Flip after 10-04 (I) |

## 10. Infra-move PLAN slice 4 assumptions that no longer hold

- Scope "Move FE + BE + Bazi" and "retiring mootech-be is out of scope during the move" (PLAN:26, :105) — BE is out of the app; the move is FE + bazi.
- Cutover "Bazi, then BE, then FE" — the BE step disappears (BE was `mootech-be.onrender.com`, never a DNS change).
- Rollback "keep Vercel and Render warm" — Render is scheduled for suspend/delete in R7; after R7 the rollback target is Vercel only, and reverting PR 830 would need BE running.
- "Stop old schedulers" — BE `@Cron` was already off.
- Moot BE-only items: `DB_SYNCHRONIZE`, `CORS_ORIGINS`, BE session pooler :5432, Omise v1 webhook to BE, the `api` hostname, `NEXT_PUBLIC_BACKEND_URL`.
- Infra still carrying BE (scheduled for R7 step 5): `be` compose service (required `BE_TAG`), `api.staging` Caddy block (410 tombstone), BE lines in ops-status, BE synthetic/Better Stack checks, BE Alloy redaction rules, `env/be.env`, pgtmp SSL comment.
- "Move before launch" — moot, v2 has launched.
