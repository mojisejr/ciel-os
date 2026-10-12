# MuMate — bazi's own pages back for เอ็ม and ซินแส, on production

**Workstream:** `mumate-bazi-backstage-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

On Vercel, เอ็ม and ซินแส worked in bazi's own pages (`/reading/doctrine*`,
`/reading/knowledge`, `/almanac`, `/sacred-map`, `/ops` and the rest) at
`bazi-sft-dataset.vercel.app`, which ran on the production database: an edit
was live at once, and doctrine and knowledge have a built-in draft → publish
step with an audit log. The move to DigitalOcean closed those pages (D3,
20260928T045413), and the Vercel project was hibernated on 2026-10-12.

The owner, 2026-10-12: only เอ็ม and ซินแส use these pages; open them again on
production "เหมือนกับใน vercel"; not on staging; เอ็ม adds a login himself
later. Hostname `bazi-sft.staging.mumate.co` pointed at mumate-prod-1, because
the `staging.mumate.co` zone is already delegated to DigitalOcean DNS, so no
DNS person is needed and it can go live today. The owner accepts that the name
says staging while it serves production ("ใช้กันแค่สองคน ... คุยกันรู้เรื่อง").
Missing env comes from the files in `.assets/mumate`.

This reverses D3 for bazi's own pages, by the owner's word.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mumate-infra` | Caddy site for the new hostname on production | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `bazi-sft-dataset` | the pages served (read only here) | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence

- bazi on prod-1 listens only on the compose network and `127.0.0.1:3100`;
  `caddy/sites/production.caddy` serves `bazichart.mumate.co` (fe) only.
- `staging.mumate.co` NS = ns1-3.digitalocean.com (read 2026-10-12 from prod-1);
  `app.staging.mumate.co` is answered authoritatively by DO.
- prod-1 `env/bazi.env` has `ADMIN_DOCTRINE_TOKEN` and `OPS_ADMINS` set (admin
  write routes and bazi `/ops` refuse without them); it lacks `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY`, used only by `divine-cards/images` and
  `reading/sacred-map/upload`.
- `.assets/mumate/infra-mumate/from-jareonsak/engine-env.env` (เอ็ม, 2026-09-20)
  holds the production project URL (`soxsccdlsycaevusndro`) and a service role
  key whose hash equals the two other copies in `.assets`; whether it is still
  valid is unchecked.
- bazi has no middleware; several pages read without authentication (for
  example `/stats`, `/reading/history`), and some call Gemini.
- Open since 20260928T045413: bazi's LINE webhook and the LIFF apps of channel
  2011679472 were to be confirmed with เอ็ม before the cutover; no record says
  they were. If a LINE channel delivered to `bazi-sft-dataset.vercel.app`, it
  has received the closed page since the 2026-10-12 hibernation.

## Decisions before execution

- **Q1 · temporary password (agent recommends yes).** A Caddy basic-auth gate
  over the whole host, one shared password for เอ็ม and ซินแส, kept in
  `.assets`, the bcrypt hash in prod-1's env, removed in one PR when เอ็ม's
  login lands. Without it the host is as open as Vercel was, without Vercel's
  firewall. Paths a LINE webhook or LIFF need would be exempted by name.
- **Q2 · time of the Caddy recreate.** Caddy fronts `bazichart.mumate.co`
  too; a recreate is a few seconds. Outside the evening peak.

## Slices and DoD

### 1. The host is live on production

Steps, each with its check:

1. DNS: A record `bazi-sft.staging.mumate.co` → `209.38.56.234`, TTL 3600, in
   DO DNS (doctl, owner's word). Check: `ns1.digitalocean.com` answers it with
   `aa`.
2. mumate-infra PR: site block in `production.caddy` → `bazi:3000` through the
   existing `observed`, `edge` and `app_proxy` snippets (plus the gate if Q1 is
   yes, hash read from env), the `:80` redirect for the new host, and the D3
   comment updated. Check: `scripts/test-all.sh` and `bin/caddy-validate.sh`
   green; the owner merges.
3. prod-1: if Q1, place the hash in Caddy's env; pull infra; recreate caddy at
   the Q2 time. Check: certificate issued; `bazichart.mumate.co/api/health` ok;
   `ops-status` ✅; 5xx 0 around the recreate.
4. prod-1: add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to
   `env/bazi.env` one value at a time from the `.assets` file (backup first,
   never printed), after a credential-free-output probe shows the key still
   works (HTTP status only); recreate bazi. Check: bazi healthy, sha unchanged.
5. Check the host: `/reading/doctrine-config` and `/almanac` load (401 first if
   gated); an admin write without the token is refused.

DoD: the host serves bazi's pages over HTTPS on production; `bazichart` and
the release flow unchanged; values never printed; record with names only.

### 2. Handover and close

เอ็ม and ซินแส open the pages they need; เอ็ม answers whether a LINE webhook or
LIFF should point at the new host (then those paths are added, exempt from the
gate). The owner hands over the URL (and password). Closeout names the host,
the gate, which pages publish at once and which have draft → publish, and how
to remove the host (DNS record + one site block).

DoD: เอ็ม confirms the pages work; closeout `ready-for-owner-merge`.

## Boundaries

- No bazi code change; เอ็ม's login is his own work, later.
- No staging host for bazi.
- Production env: only the two Supabase names, by the owner's word.
- Out of scope: the leaked production DB password rotation (owner's separate
  decision), the backup move, other open items.

## Review and estimated effort

| Slice | Active effort | Waits on |
|---|---:|---|
| 1 · host live | 1-2 h | Q1, Q2, owner's merge |
| 2 · handover | 15 min | เอ็ม |
