# MuMate — bazi's own pages back for เอ็ม and ซินแส, on production

**Workstream:** `mumate-bazi-backstage-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** 1
**Execution state:** executing
**Parallelism:** none

## Objective and owner intent

On Vercel, เอ็ม and ซินแส worked in bazi's own pages (`/reading/doctrine*`,
`/reading/knowledge`, `/almanac`, `/sacred-map`, `/ops` and the rest) at
`bazi-sft-dataset.vercel.app`, which ran on the production database: an edit
was live at once, and doctrine and knowledge have a built-in draft → publish
step with an audit log. The move to DigitalOcean closed those pages (D3,
20260928T045413), and the Vercel project was hibernated on 2026-10-12.

The owner, 2026-10-12: only เอ็ม and ซินแส use these pages; open them again on
production "เหมือนกับใน vercel"; not on staging. Hostname
`bazi-sft.staging.mumate.co` pointed at mumate-prod-1, because the
`staging.mumate.co` zone is already delegated to DigitalOcean DNS, so no DNS
person is needed; the owner accepts that the name says staging while it serves
production. Missing env comes from the files in `.assets/mumate`.

Revision 0.2 (owner's answers): the agent builds the gate itself — a passkey
box, the same passkey as the fe `/ops` (`OPS_DASHBOARD_KEY`), no login system;
the production steps run after 22:00 or early next morning, and the agent tells
the owner when it reaches them; the LINE webhook / LIFF of bazi stay as they
are until เอ็ม asks; `mumate-be-retirement-001` is closed so this lane runs
alone.

This reverses D3 for bazi's own pages, by the owner's word.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `bazi-sft-dataset` | the passkey gate (`src/proxy.ts`) and the pages it serves | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `mumate-infra` | Caddy site for the new hostname on production | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence

- bazi on prod-1 listens only on the compose network and `127.0.0.1:3100`;
  `caddy/sites/production.caddy` serves `bazichart.mumate.co` (fe) only. fe
  calls bazi at `http://bazi:3000` inside the compose network, never through
  Caddy.
- `staging.mumate.co` NS = ns1-3.digitalocean.com (read 2026-10-12 from prod-1).
- prod-1 `env/bazi.env` has `ADMIN_DOCTRINE_TOKEN` and `OPS_ADMINS` set; it
  lacks `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, used only by
  `divine-cards/images` and `reading/sacred-map/upload`.
- `.assets/mumate/infra-mumate/from-jareonsak/engine-env.env` (เอ็ม, 2026-09-20)
  holds the production project URL (`soxsccdlsycaevusndro`) and a service role
  key whose hash equals the two other copies in `.assets`; validity unchecked.
- bazi has no middleware/proxy today; Next 16.2.7 names it `src/proxy.ts`.

## Design of the gate

- Caddy's site for `bazi-sft.staging.mumate.co` sets the request header
  `X-Mumate-Backstage: 1` (overwriting anything a client sends). Only requests
  that carry it are gated, so fe's internal calls and staging are untouched.
- `src/proxy.ts` in bazi: a marked request without a valid cookie gets a small
  passkey form (HTML from the proxy itself, no page route, no assets); the form
  posts to `/__backstage/login`; a correct key sets an httpOnly, Secure,
  SameSite=Lax cookie holding a SHA-256 of the key (never the key), 30 days,
  and redirects back. A wrong key answers 401 with the form again.
- Fail closed: a marked request while `BACKSTAGE_KEY` is unset or shorter than
  16 characters answers 503, never the page.
- `BACKSTAGE_KEY` on prod-1 is copied server-side from fe's `OPS_DASHBOARD_KEY`
  (owner: same passkey), never printed. Rotating the ops key means updating both.
- Admin write routes keep their own `ADMIN_DOCTRINE_TOKEN` check; bazi `/ops`
  keeps its own login.

## Slices and DoD

### 1. The host is live on production, behind the passkey

| # | Step | Who | Check (DoD of the step) |
|---|---|---|---|
| 1 | bazi PR to `pdf-dev`: `src/proxy.ts` + gate module + tests | agent | vitest for the gate green, typecheck green, the PR's own container-build green; owner merges |
| 2 | Staging proof: staging follows the merge; `BACKSTAGE_KEY` (a staging test value) in mumate-2 `env/bazi.env`; requests through ssh to `127.0.0.1:3100` | agent | without header → page as before; with header, no cookie → form (401); wrong key → 401; right key → cookie + redirect, then 200; key removed → 503 |
| 3 | DNS: A `bazi-sft.staging.mumate.co` → `209.38.56.234`, TTL 3600, DO DNS | agent | `ns1.digitalocean.com` answers it with `aa` |
| 4 | mumate-infra PR: site block with `request_header X-Mumate-Backstage 1`, `observed`, `edge`, `app_proxy bazi:3000`; `:80` redirect; D3 comment | agent; owner merges at step 5 time, not before | `scripts/test-all.sh`, `bin/caddy-validate.sh` green |
| 5 | **Night (after 22:00 or early morning), agent tells the owner first:** readiness check; owner promotes the pair carrying the gate; place `BACKSTAGE_KEY` and the two Supabase names in prod-1 `env/bazi.env` (backup first, one at a time, never printed, key probe first); recreate bazi; owner merges the infra PR; pull infra; recreate caddy | owner presses and merges; agent the rest | bazi healthy with the new sha; certificate issued; `bazichart.mumate.co/api/health` ok; `ops-status` ✅; 5xx 0 around it |
| 6 | Host check | agent | no cookie → form; ops passkey → `/reading/doctrine-config` and `/almanac` load; admin write without token refused; a direct request to `bazichart` unchanged |

Order matters: the infra PR is merged only after the gate is live on
production with its key, so a Caddy restart can never expose bazi ungated.

DoD: the host serves bazi's pages over HTTPS on production only after the ops
passkey; `bazichart`, fe→bazi calls and the release flow unchanged; values
never printed; record with names only.

### 2. Handover and close

The owner gives เอ็ม the URL (the passkey is the ops one). Closeout names the
host, the gate, which pages publish at once and which have draft → publish,
and how to remove the host (DNS record + one site block + `BACKSTAGE_KEY`).

DoD: เอ็ม confirms the pages work; closeout `ready-for-owner-merge`.

## Boundaries

- bazi code change limited to the gate; เอ็ม owns everything else in bazi.
- No staging host for bazi.
- Production env: `BACKSTAGE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, by the owner's word.
- LINE webhook / LIFF untouched until เอ็ม asks.
- Out of scope: the leaked production DB password rotation (owner's separate
  decision), the backup move, other open items.

## Review and estimated effort

| Slice | Active effort | Waits on |
|---|---:|---|
| 1 · host live behind the passkey | 2-3 h | owner's merges; the night window |
| 2 · handover | 15 min | เอ็ม |
