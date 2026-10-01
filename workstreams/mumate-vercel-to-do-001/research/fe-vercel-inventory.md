# mootech-fe — what Vercel provides and what the DO move must replace

Read-only research pass, 2026-09-27, against `mootech-fe` `main` = `origin/main`
= `fd3220b`. Platform behaviour was read from the installed Next 14.2.15 and
next-auth code in `node_modules`, not from memory. **V** = read in code;
**I** = inferred from Vercel/Caddy behaviour, verify before relying on it.

Warning: the local Vercel env pull `.env.production.local` is dated 2026-09-08
and stale (still holds `V2_PREVIEW_KEY`, `NEXT_PUBLIC_BACKEND_URL`,
`RENDER_API_KEY`; lacks `QSTASH_*`, `BEAM_*`, `PAYMENT_GATEWAY`, `SUPABASE_*`,
`LINK_STATE_SECRET`, all of which code reads). Do not build a DO env file from it.

## Blockers before the flip

| # | Item | Vercel now (evidence) | On DO if nothing is done | Action |
|---|---|---|---|---|
| B1 | Three crons | `vercel.json:3-15`: `push-reminders` every minute, `reconcile-payment` every 15 min, `manifest-morning` every minute (was hourly until 7501c06). `functions` maxDuration 60 (`:17-27`). Vercel calls with GET + `Authorization: Bearer $CRON_SECRET`; `lib/push/authorize.ts:8-11` fails closed (V). | Nothing calls them: reminders stop (and the QStash backstop with them), paid-but-webhook-lost charges are never recovered (`reconcile-payment.ts:4-9`), QI repair stops (`:82-96`), manifest pushes stop. | systemd timers → `curl -fsS --max-time 60 -H "Authorization: Bearer $CRON_SECRET"` (GET). `CRON_SECRET` in the container env and the timer's env. `AccuracySec=1s`: `manifest-morning.ts:31-43` matches the exact Bangkok minute, so a late fire that crosses a minute skips that user's reminder for the day (systemd default accuracy is 1 min) (I). `push-reminders` tolerates 15 min lateness (`lib/push/due.ts:9`). |
| B2 | Switch the Vercel copy off | The Vercel project auto-deploys `main` and runs its crons against the production DB (I). | After DNS moves, a full second copy stays live on `*.vercel.app` with production secrets, keeps running crons, and rebuilds on every merge. | At the flip: disable Vercel crons (pause project / disconnect Git), remove the domain from Vercel. Check whether Vercel calls crons on the custom domain or on `*.vercel.app` (I). |
| B3 | NextAuth origin | `node_modules/next-auth/utils/detect-origin.js:9`: when `VERCEL` (or `AUTH_TRUST_HOST`) is set, origin comes from `x-forwarded-host` and `NEXTAUTH_URL` is ignored (V). | `VERCEL` unset → runtime `NEXTAUTH_URL` is used; missing/wrong breaks every OAuth callback. `lib/auth/link-providers.ts:98-101` also builds the link redirect URI from `NEXTAUTH_URL`. | Runtime `NEXTAUTH_URL=https://bazichart.mumate.co`, same `NEXTAUTH_SECRET`. Cookie names key on `NODE_ENV` (`[...nextauth].ts:105-113`), so sessions survive. Build arg `NEXTAUTH_URL` is also baked into `publicRuntimeConfig` (`next.config.mjs:22-26`); Dockerfile default `http://localhost:3000` (`Dockerfile:34`); workflow reads `vars.NEXTAUTH_URL`. |
| B4 | Runtime env inventory | Vercel holds env and injects `VERCEL*`. | Misconfiguration, some silent: no QStash signing keys → `fire.ts:35-36` returns 503. | Build the list from what code reads (~60 `process.env.*` names) against a fresh Vercel read. Leave out `VERCEL*`, `VERCEL_TOKEN`, `LAUNCH_*`, `RENDER_API_KEY`, `NEXT_PUBLIC_BACKEND_URL`, `TURBO_*`, `NX_DAEMON`. Include `V2_PREVIEW_KEY` only if production sets it today (if set, `/v2` is locked and `/api/v2/push/fire` returns 401, `middleware.ts:314-326`). |
| B5 | Build-time public values | Vercel builds with its env and inlines `NEXT_PUBLIC_*`. | `container-build.yml` is manual dispatch only and inlines only the args in `Dockerfile:33-49` from GitHub Environment `production` variables. Empty → broken bundle (`NEXT_PUBLIC_OMISE_KEY_V2` checked by the postbuild gate; `NEXT_PUBLIC_VAPID_PUBLIC_KEY` needed for push subscribe). | Fill GitHub `production` Environment variables. `NEXT_PUBLIC_LIFF_ID` is not a build arg (fallback id in `lib/line/liff.ts:10`; stale pull suggests Vercel does not set it either — verify). `NEXT_PUBLIC_GTM_ID` unused (GTM hardcoded `_app.tsx:25`). |
| B6 | DB pool `max: 1` in one long-lived process | `lib/db/index.ts:17-36`: `max: 1`, global singleton. On Vercel concurrency comes from instance count (I). | All DB traffic for the whole site runs one query at a time over one connection. A "transaction holds the only connection while asking for another" bug (class fixed once in 868632e) wedges the whole site. `/api/health` shares the queue. | Measure the Supabase transaction pooler size, raise `max` before the flip, audit for pool calls inside open transactions. |
| B7 | Reverse-proxy headers | Vercel sets `Host`, `x-forwarded-proto`, non-spoofable `x-forwarded-for`. | QStash callback origin = `x-forwarded-proto` + `Host` (`reminders.ts:111-116` → `lib/push/qstash.ts:25`); absolute URLs the same way in `og/finder.ts:16-17`, `invite/[code].tsx:40-41`, `p/[id].tsx:54-55`, `v2/element-finder.tsx:37-38`; same-origin checks compare `Origin` with `Host` (`held-identity.ts:137-146`, `calculator/compute.ts:55-64`); calculator rate limit keys on first XFF entry (`rate-limit.ts:48-51`). | Caddy defaults already do this (passes `Host`, sets `X-Forwarded-Proto`, replaces untrusted XFF) (I). If Cloudflare proxying is added, set `trusted_proxies`, or every user shares one bucket. |
| B8 | TLS and DNS cutover | Vercel issues the certificate and adds HSTS (I). | Caddy HTTP-01 needs DNS already pointing at the droplet → possible cert gap; no HSTS. | Lower TTL; DNS-01 or pre-issue; HSTS header in Caddy. Confirm who hosts DNS. |
| B9 | QStash callback during maintenance | `/api/v2/push/fire` is not in the maintenance allow-list (`middleware.ts:469-479`); only the two payment webhooks are exempt from guardV2 (`:297, :301`) (V). | During a maintenance window QStash deliveries get a 200 maintenance page and are treated as delivered; `push-reminders` picks unsent rows up within 15 min only if B1 is live. | Add exact `/api/v2/push/fire` to both the allow-list and the guardV2 exemption; its QStash signature check still fails closed. |

## Must-have soon after the flip

- **Liveness and restart.** HEALTHCHECK probes the DB with a 5 s limit (`health.ts:29,49-54`); Docker marks unhealthy but never restarts. Vercel instance recycling hid the wedge. Autoheal/restart plus outside uptime monitor; watch the B6 interaction (health failing under load → restart loop).
- **Logs and alerts.** Reconcile reports via `console.warn/error` incl. "QI REPAIR INCOMPLETE" (`reconcile-payment.ts:102-119`). Vercel runtime/cron logs go away: need log rotation, searchable logs, `OnFailure=` on timers, alerts on those lines.
- **Launch console and /ops health still point at Vercel.** `lib/launch/vercel.ts:21-24,249-262` ("go live"/"rollback" edit Vercel env and fire a Vercel deploy hook — on DO they would report success and change nothing); keep `VERCEL_TOKEN`/`LAUNCH_*` out of the DO env or retire `LAUNCH_KEY`. `lib/ops/health.ts:19-20,29-52` reports the latest Vercel deployment as FE health (green while DO is down) — repoint at `/api/health`.
- **Deploy, rollback, previews.** Vercel: auto-deploy on merge, per-branch previews (Preview env uses the production DB — known issue), instant rollback, PR status checks. DO: manual workflow pushing `ghcr.io/...:<sha>`. Needed: deploy on merge or a documented owner-run step, rollback to a previous SHA tag, check that branch protection does not require a Vercel status check (unverified). Container restart leaves a gap; Next handles SIGTERM (`next/dist/server/lib/start-server.js:236-240`), docker stop timeout 10 s; Caddy `lb_try_duration` can hold requests.
- **Reconcile interval has no single source.** `lib/payment/reconcile-window.ts:33` copies the 15-minute interval and `scripts/reconcile-window.test.ts:30` pins it to `vercel.json`; a systemd timer would be an unchecked third copy.
- **Request body size.** Vercel caps function bodies at 4.5 MB (I); on DO the 8 MB `sizeLimit` applies (`v2/avatar.ts:9`, `v2/manifest/photo.ts:7`). Cap in Caddy `request_body max_size`.
- **Edge protection.** Vercel firewall/DDoS is gone. ufw 22/80/443 only; consider Cloudflare (mind B7).

## Nice-to-have

- OG image `og/share.tsx:12` (edge runtime) works under `next start`; `s-maxage=86400` (`:189`) and two jsdelivr font fetches per render (`:14-15`) — without a CDN every crawler hit re-renders. Same for `invite`/`p` (`s-maxage=600`), `og/finder`, `bazi-mascot`. Caddy cache or memoized fonts.
- Static assets/compression: Vercel CDN + brotli vs Node gzip. Caddy `encode zstd gzip`, optional `file_server`/CDN.
- `what-if/generate.ts:9-11` `maxDuration: 60` ignored on DO; upstream fetch has no timeout; default upstream `bazi-sft-dataset.vercel.app` (`:3`).
- Bounded in-memory caches (`v2-calendar/month.ts:108,145`, `v2/day-detail.ts:66`) live until the next deploy instead of the next instance recycle.
- Free improvements: calculator rate limiter counts accurately on one instance; fire-and-forget usage insert (`calculator/compute.ts:67-72`) completes reliably; `MAINTENANCE_MODE` needs a restart, not a rebuild.
- To check: Vercel function region vs DO sgp1 vs Supabase region; Node version parity (image node 22.23.2).

## No action needed

- `images.unoptimized: true` (`next.config.mjs:27-40`); sharp devDependency only.
- No `getStaticProps`/ISR/`revalidate`/`waitUntil`/`after`; no `@vercel/*` packages; no headers/redirects/rewrites in `vercel.json` or `next.config`.
- No app code reads `VERCEL*`, `VERCEL_URL`, `NEXT_RUNTIME`, `CI` (only the postbuild gate `scripts/check-omise-key-inlined.sh:56,99`).
- `MAINTENANCE_MODE` and `V2_PREVIEW_KEY` are read at runtime by middleware (built middleware keeps the `process.env` read; edge sandbox copies `process.env`). `scripts/container-smoke.sh` already tests the maintenance gate.
- Same-origin `Location` headers are relative (`resolve-routes.js:426-429`), so `0.0.0.0` does not leak (I).
- SSE chat `chat/bazi.ts:181-184` sends `no-transform`; Caddy flushes `text/event-stream` (I).
- PWA `sw.js` generated at build and copied; `public/` served `max-age=0`; do not long-cache `/sw.js` in Caddy.
- OAuth (LINE, Google, FB, Twitter), LIFF, Omise and Beam webhooks are tied to the unchanged domain. No code checks IP allowlists; whether Beam, Supabase network restrictions or bazi allowlist outbound IPs is unverified.
- Code converts to +7 explicitly; container is UTC like Vercel.

## Unverified (needs Vercel dashboard or GitHub)

Current Production env; project region and Node version; www/apex redirects and DNS host; Git integration and required status checks; whether Vercel crons target the custom domain; whether QStash is configured on production (the stale pull has no `QSTASH_*` — if absent, `push-reminders` is the only reminder sender).
