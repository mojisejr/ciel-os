# D6 parity checklist — mumate-vercel-to-do-001 slice 4

Every Vercel duty is either **done and proven on staging** or **accepted as dropped by
the owner** — never "skipped" (plan 0.3, D6). The owner signs this file before slice 5.
Evidence is on staging `mumate-2` unless noted; times are UTC. Staging runs the
`do/s2-staging` integration builds (fe `850d8fb`, bazi `7000d19`), so the rows marked
**re-run** are repeated on the merged SHAs after the slice-2 merges (after 2026-10-04).

Status: ✅ proven · ⏳ agent, waiting on time · 👤 needs the owner · ✋ owner decision (keep or drop)

| # | Vercel duty | DigitalOcean replacement | Proof | Status |
|---|---|---|---|---|
| 1 | 6 crons with `CRON_SECRET` | systemd timers + `bin/cron-call.sh`, one runner per job (`cron.tsv`, mumate-infra #30) | push-reminders and manifest-morning ran exactly once in each of 270 consecutive minutes (03:00–07:30, 0 failures); fe down 07:42–07:43 → 🔴 once per job, no repeat, recovery 🟢; reconcile-payment one-off drill 200 (07:49:56) | ✅ minute jobs · ⏳ qi-quota-reset 17:00 and account-purge 17:30 first runs tonight · bazi-alerts: owner 2026-09-28 — proven at the cutover (no LINE channel on staging, D2) |
| 2 | Instant rollback | `deploy.sh` rolls back by itself; `bin/rollback.sh` one command; Vercel kept as DNS flip-back (D10) | bad deploy: unhealthy at 07:39:37, healthy on last-good 07:39:49 (**12 s**), ⚠️ alert; image not in GHCR refused at pull, service untouched; manual rollback **9.0 s decision → healthy**, 80/80 requests 200 during it | ✅ · re-run |
| 3 | Auto-deploy on merge; preview per branch | D4 release button (mumate-infra #32/#35): staging by any writer, production by `RELEASE_ACTORS` and only for SHAs healthy on staging | run 36392624548: OIDC → tailnet → deploy → cron-check, all green | ✅ button · ⏳ auto-build/release on merge after the slice-2 merges (owner Q3) · per-branch previews: **dropped** by the owner 2026-09-28 (Vercel previews live while the Vercel projects live) |
| 4 | Horizontal scaling, 1 DB connection per instance | `DB_POOL_MAX` (fe PR 834, pooler 15); one fe replica; load test decides | 30 parallel requests → 5 pooler connections (slice 2); load test (row 19): one fe process peaked at 123% CPU of 200% and 158 MiB of 1 GiB — no second replica needed at this load | ✅ (public pages; see row 19) |
| 5 | Kills runaway requests (`maxDuration`) | LLM/Gemini timeouts in bazi (PR 44); fe → bazi client timeouts | unit tests only (never-answering server) | ✅ unit-test proof **accepted** by the owner 2026-09-28 |
| 6 | Never a raw error | Caddy `lb_try_duration` 20 s + static maintenance page 503 (D11, #29) | fe recreate under load 90/90 × 200; fe stopped → 503 maintenance page after 20.5 s, assets 200; fe killed (manual stop) → 55 × 503 page, 0 × 502 | ✅ |
| 7 | App crash restarts itself | `restart: unless-stopped` + `app-recover.sh` for fe and bazi (#31) | fe process exit (SIGTERM to PID 1) → restarted, healthy in **6 s**, 45/45 × 200; bazi unhealthy → recreated in 7 s by the health timer | ✅ (note: `docker kill`/`stop` is a manual stop and is **not** restarted — by design) |
| 8 | TLS, HSTS, HTTP/2-3, compression, client IP, edge firewall | Caddy auto-HTTPS, HSTS as Vercel, `encode` (not SSE), 10 MB body cap; trusted client identity fe → bazi (PR 45/832); no CDN/WAF (D5) | caddy-edge test 13/13; staging headers; per-user 429 on staging (slice 2) | ✅ · CDN/WAF dropped by D5 |
| 9 | Hostnames Vercel owns (`bazi-sft-dataset.vercel.app`) | bazi internal-only (D3) | `bazi.staging` gone; fe → `http://bazi:3000` | ✅ |
| 10 | Environment store | owner-placed env files per host; examples level with the code (#33) | names only; production env built from a fresh Vercel read in slice 5 | ✅ staging · slice 5 for production |
| 11 | Function logs | Grafana/Loki with env/host labels, alerts, synthetics (slice 1) | slice 1 DoD | ✅ staging · production views in slice 5 |
| 12 | Platform kept patched and up | unattended-upgrades on (no auto-reboot); runbooks; droplet reboot | reboot 07:48:20 → host up 07:48:37 → app 200 at **38 s**; all services, timers, tailscale, cron back unattended | ✅ |
| 13 | (backup) | nightly `pg_dump` to Spaces + restore | restore-verify of the 09-28 night: **184 tables, 5,138 users, 92 s**, pgtmp removed | ✅ |
| 14 | Planned maintenance window | FE `MAINTENANCE_MODE` + bypass cookie | on: `/` and `/v2/home` show the page, `/api/health` 200, cron 200 during; bypass → httpOnly cookie, site normal; off restored | ✅ · note: the app's page answers **200**, not 503 |
| 15 | Login providers | fe login route (login lane) | D5 walk (LINE and Google) 2026-09-28 morning; B-1 08:20–08:21: signout 200, `signin/google` 302 → `callback/google` 302 → `register-login-fe` 200, one Google provider row touched, 0 new users | ✅ · re-run |
| 16 | Payment and webhook | Beam live on staging with its own webhook (owner, D2 amendment) | B-2 2026-09-28: owner bought QI_60 (35 THB) by PromptPay QR on staging — QR 15:24:36, Beam webhook to staging 15:25:05 (200, 139 ms, HMAC ok), `v2_payment` APPROVED, ledger `qi:buy:QI_60` +90 Qi exactly once. **Beam also delivered the same event to production** (Vercel log 15:25:05, 200, `PAID CHARGE WITH NO USABLE ROW (NO_ROW)`): nothing granted there, but every staging payment raises a false 🔴 in production's log, and every production payment reaches staging | ✅ payment · cross-delivery: owner chose (ข) and **disabled the staging endpoint in Beam** 2026-09-28; fe fix (ค) later |
| 17 | QStash scheduled push | `QSTASH_TOKEN` only on production at cutover | staging has no token | proven at the cutover — owner 2026-09-28 (B-3) |
| 18 | SSE chat | Caddy passes `text/event-stream` uncompressed | edge test: SSE not compressed; B-1 08:21:33 `POST /api/chat/bazi` 200 `text/event-stream`, no Content-Encoding, 7.96 s, 20,355 B through Caddy; the owner saw the answer stream in | ✅ |
| 19 | Load test at production's busiest hour | k6/curl from outside, event-loop lag and memory recorded | Vercel Analytics is off (paid), so the busiest hour came from the production copy on staging (last 30 days of logins, Qi ledger, feature quota, AI calls): **18 active users / ~45 actions at 2026-09-20 18:00**, busiest day 53 users. k6 from outside through Caddy/TLS, 2026-09-28 08:37–08:42: 50 concurrent visitors for 3 min (~10×), 9,844 requests, **0 failed**, p95 330 ms, p99 737 ms, max 2.6 s; fe `/api/health` on loopback (event-loop proxy) avg 52 ms, p95 158 ms, max 510 ms; fe CPU ≤ 123 %, mem ≤ 158 MiB; bazi ≤ 27 %, 240 MiB; pgstaging ≤ 21 %, 101 MiB | ✅ · limits: public pages only (no login, no LLM, no static chunks); re-run on merged SHAs. **Stress, 08:52–08:58:** 100 / 200 / 300 concurrent → throughput flat at **~74 req/s**, 0 % errors, p95 0.95 s / 4.6 s / 8.0 s; the one fe process was the limit (CPU avg 94 %, loopback health p95 6.9 s) while bazi, pgstaging and caddy stayed idle; the load generator was 77 % idle |

**Cross-delivery (found in B-2):** Beam sends each event to every webhook endpoint of the merchant. Options: keep it and
note it in the slice-6 runbook; remove the staging endpoint from Beam between payment drills; or later, an fe change that
tags the environment on each order and treats another environment's event as quiet. **Owner, 2026-09-28: (ข) now** — remove the staging endpoint
from Beam and re-add it only for a payment drill — **and (ค) after the slice-2 merges**; the NO_ROW message also still
says "Omise dashboard" for a Beam charge.

**Owner signature (B-5):** not signed.
