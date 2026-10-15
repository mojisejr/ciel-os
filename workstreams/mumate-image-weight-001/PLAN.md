# MuMate — serve the app's images at a fraction of their weight

**Workstream:** `mumate-image-weight-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

The owner, 2026-10-13, after the traffic report: "เรื่อง รูปที่จะทำให้ ลดขนาด
และ กิน bandwidth ผมคิดว่าควรทำ", then "เรื่องรูปภาพเราสามารถทำได้เลยป่ะ ?".
Members download PNG art at full size on every screen; the goal is the same
pictures, visibly unchanged, at a small fraction of the bytes, and browsers
that stop re-asking for them on every visit.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | the images, their references, the build | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `mumate-infra` | Caddy cache header for `/images/*` | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (2026-10-13 10:37 +07)

- Production fe 611c521, infra 409a4a2.
- `next.config.mjs` has `images: { unoptimized: true }` since the first commit
  (defb0c7, 2026-06-06); `ServiceCardArt.tsx:37` records it as a site-wide +
  Vercel-quota decision. Vercel is gone, so the quota reason no longer holds,
  but the runtime optimizer covers only `next/image` (121 files), not `<img>`
  (64) or CSS `url()` (8), and would cost fe RAM (1 GB limit) with a cache
  lost on every deploy. Not the lean.
- `public/images` 105 MB; 237 PNG/JPG files over 100 KB, of which only 46 are
  named literally in code — the rest are built at run time
  (`` `/images/v2/characters/${n}.webp` `` style), so a find-and-replace of
  file names would miss most of them.
- Newer assets are already WebP by hand (mascot `01.webp`, characters,
  `DayScoreCard.tsx:60` measured −99.2%).
- Measured locally with fe's own sharp 0.35.3, WebP q80 at full resolution:
  the 14 heaviest files 18,049 KB → 765 KB (−96%); AVIF q50 448 KB. Side by
  side at screen size, the sinsae card (Thai text) and BG01 show no visible
  difference.
- Production access log 2026-10-09..13: static files 15.3 GB in 4.5 days;
  the 12 heaviest images ≈ 4.1 GB of it; ~25,900 responses were 304s, because
  `public/` files are served `Cache-Control: public, max-age=0` (middleware
  skips `/images`, `middleware.ts:525`).
- Member uploads are already shrunk in the browser before upload: avatar to
  512 px JPEG (`EditProfileScreen.tsx:48`, bazi then resizes to 256 px),
  friend photo to 1024 px JPEG (`lib/v2/shrink-image.ts`). Out of scope here.
- `og:image` URLs (`V2GateForm.tsx:27`, share pages) must stay PNG/JPEG for
  link-preview crawlers.

## Slice 1 — same pictures, WebP bytes, cached

| # | Step | Who | Check |
|---|---|---|---|
| 1 | Spike (local, no PR): every PNG/JPG under `public/images` gets a `.webp` sibling at build time (sharp, q80, same dimensions); a `beforeFiles` rewrite in `next.config.mjs` serves the sibling when the request's `Accept` has `image/webp`, with `Vary: Accept`. Prove on a local standalone build that Next 14.2.15 serves the sibling for a literal path, a run-time-built path and a CSS `url()`, and the PNG for `Accept: image/png` | agent | curl: same URL, two Accept values, two content types; a browser page shows WebP in DevTools |
| 1b | If step 1 cannot be proved: fall back to converting files in the repo and changing references, listed per file; the plan returns to the owner with that list before any PR | agent | — |
| 2 | fe PR: the build step (Dockerfile builder stage, so the repo keeps only the PNGs), the rewrite, a test that every PNG has a sibling in the image; PNG originals stay | agent | tests + `image (staging)` check green; owner merges |
| 3 | infra PR: Caddy sets `Cache-Control: public, max-age=604800` on `/images/*` (7 days; names carry no hash, so not a year) and keeps `Vary: Accept` | agent | `scripts/test-all.sh` green; owner merges |
| 4 | Staging: team looks at the main screens (home, service, calendar, shop, chat, account, destiny, popups) | team | no visible change; DevTools shows WebP and a cache hit on reload |
| 5 | Release: readiness check (runbook 01), promote-production on the owner's word | owner | one day after: static bytes per page view and 304 count from Loki, before vs after |

DoD: production serves WebP to browsers that accept it and PNG to the rest
from the same URLs; images reload from cache within 7 days; static bandwidth
drops by most of the measured −96% on the heavy files; no visible change.

## Open before go

- **Q1 · push:** `--no-verify` for the fe PR (hook still fails on main's four
  violations), as in the last rounds.
- **Q2 · AVIF:** WebP only (lean: universal support, half the encode time;
  AVIF would save a further ~40% of an already small number).

## Boundaries

- No PNG is deleted (deletion is a later owner call); `og:image` stays PNG.
- No change to member-upload handling, Supabase Storage, or DNS/CDN.
- Production env untouched.

## Review and estimated effort

| Slice | Active effort | Waits on |
|---|---:|---|
| 1 · WebP + cache | 2-3 h (spike ~1 h) | Q1-Q2, owner's merges and press |
