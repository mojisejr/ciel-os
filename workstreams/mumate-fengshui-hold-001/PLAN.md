# MuMate — take the ฮวงจุ้ย card service off the app until the owner opens it

**Workstream:** `mumate-fengshui-hold-001`
**State:** completed
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** idle
**Parallelism:** none

Completed 2026-10-12: on production the hub hides the card, the page goes to
coming-soon, and the chat note is off. Reopening is in the final record:
`memory/events/2026/10/12/20261012T223557_mumate_fengshui_hold_final_closeout.yaml`.

## Objective and owner intent

The ไพ่อาถรรพ์ฮวงจุ้ย card page (`/v2/fortune/fengshui`, mootech-fe PR 890) went
to production on 2026-10-11. The owner, 2026-10-12, with a screenshot of the
service hub: "ผมอยากจะให้คุนเอา บริการนี้ลงจาก หน้านี้ก่อน ... เอาลงก่อน
ยังไม่เปิดให้ใช้", then "เปิด workstream ก่อนนะ อย่าเพิ่ง go". Users must not
reach the service until the owner says to open it; nothing is deleted, so
opening it later is a one-line change.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | hub card and the page | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `bazi-sft-dataset` | the chat's closing note that sends users to the menu (env only, no code) | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `mumate-infra` | prod-1 env and release | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (2026-10-12 22:03 +07)

- Production fe 247cc5f, bazi 434d069.
- Ways in, read from fe `main` and bazi `pdf-dev`:
  1. Hub card: `features/v2-service/services.ts:74` entry `fengshui-cards`
     (`/v2/fortune/fengshui`). The catalog already hides entries with
     `hiddenUntilArt: true` (`VISIBLE_SERVICES`, line 123), as for Healing
     Circles and เรียนปาจื่อ.
  2. Direct URL: `pages/v2/fortune/fengshui.tsx` renders `FengshuiScreen`
     for any signed-in user. A shared "coming soon" page exists:
     `/v2/service/coming-soon?service=<title>` (`comingSoonHref`).
  3. Chat: bazi's `gemini-adapter.ts` ends fengshui answers with a note
     sending the user to the menu "ไพ่อาถรรพ์ฮวงจุ้ย" in the app, unless
     `CHAT_CARD_NOTE_FENGSHUI=off`; prod-1 `env/bazi.env` does not set it, so
     the note is on.
  - The BFF `/api/fortune/fengshui` stays (only reachable from the page).
- `scripts/fengshui-cards.test.tsx` tests the screen component only, not the
  hub; it keeps passing.
- fe's pre-push hook still fails on main's four verify-architecture
  violations (vercel-to-do closeout); a push needs the owner's `--no-verify`
  word again, or the separate hook fix first.

## Slice 1 — the service is unreachable on production

| # | Step | Who | Check |
|---|---|---|---|
| 1 | fe PR: `hiddenUntilArt: true` on `fengshui-cards` with a comment (owner hold 2026-10-12); the page's `getServerSideProps` redirects to `comingSoonHref('ไพ่อาถรรพ์ฮวงจุ้ย')` after the auth gate; a test that the hub hides it and the page redirects | agent | tests + PR build green; owner merges |
| 2 | prod-1 `env/bazi.env`: `CHAT_CARD_NOTE_FENGSHUI=off` (backup first), recreate bazi | agent, owner's word | container has it; a fengshui chat answer carries no menu note |
| 3 | Release: readiness check, owner presses promote (or tells the agent) | owner | hub on production has no ฮวงจุ้ย card; `/v2/fortune/fengshui` → coming-soon; 5xx 0 |

DoD: on production no hub card, the URL lands on coming-soon, the chat does
not point to the menu; reopening = remove the flag, the redirect and the env.

## Open before go

- **Q1 · page behaviour:** redirect to coming-soon (agent's lean) or to the
  service hub.
- **Q2 · chat note:** turn it off too (agent's lean; otherwise the chat sends
  users to a menu that is gone).
- **Q3 · push:** `--no-verify` once more for this PR, or fix the hook's four
  violations first (1-2 h with an arena e2e run).
- **Q4 · timing:** release tonight with a promote (bazi env recreate ~10-20 s
  maintenance page), or tomorrow.

## Boundaries

- No deletion of code, images or data; no bazi code change.
- Other services untouched.

## Review and estimated effort

| Slice | Active effort | Waits on |
|---|---:|---|
| 1 · unreachable on production | 45-60 min | Q1-Q4, owner's merge and press |
