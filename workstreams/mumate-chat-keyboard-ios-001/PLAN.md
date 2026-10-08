# MuMate — v2 chat stays filled and on screen when the iPhone keyboard opens

**Workstream:** `mumate-chat-keyboard-ios-001`
**State:** completed
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

A tester reported on 2026-10-03, by LINE with two iPhone screenshots: "เวลาพิมพ์
chat เหมือนมันจะดันขึ้นบน และเกิดขอบค่ะ". When the keyboard opens on the v2
chat screen, the chat UI is pushed up and a white band appears above the
keyboard; in one screenshot everything above the keyboard is white. The agent's
research (code, Git history, platform behaviour) found the cause in our code,
and the owner agreed the approach:

1. The input text becomes 16px (owner: "เปลี่ยนเลย").
2. The branch goes to staging first for the owner's own device check; the merge comes after that check.
3. The team is not available to answer questions (which app, iOS version, text size); cover every case the agent can.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | `features/v2-chat/components/ChatScreen.tsx` and its test | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (verified 2026-10-03, mootech-fe origin/main 9695d27)

- `ChatScreen.tsx:274-288` (#chat-vh, PR #638, 2026-09-13, written and tested for a Samsung Internet white gap) sets the root's height to `visualViewport.height` on resize and scroll. The root (`:310-321`) stays in normal flow from the top of the document and ignores `visualViewport.offsetTop`.
- iOS (Safari tab, standalone PWA, and WKWebView such as LINE on iOS) does not shrink the layout viewport for the keyboard; it pans the visual viewport to the focused field, so `offsetTop > 0`. The shrunk root then sits above the visible area, and the uncoloured html/body canvas (no background in `styles/globals.css`) shows white below it.
- The composer input is `text-[14px]` (`:599`); iOS zooms on focus into inputs under 16px (the viewport meta has no maximum-scale), which shrinks the visual viewport further and plausibly explains the all-white screenshot.
- The v1 `useKeyboardInset` (`components/chat/use-keyboard-inset.ts`) already subtracts `offsetTop`; the v2 code never carried it over.
- The text-size setting sets `document.documentElement.style.zoom` (0.9 / 1.1 / 1.25); a px height from `visualViewport` under that zoom may mis-size the root on every platform (inferred, to be measured).
- iOS 26 standalone with `viewport-fit=cover` under-reports the viewport height by about the status bar (WebKit bug 301108, open); a small bottom band there may remain whatever this lane does.
- No unit or e2e test covers the v2 chat height or keyboard.

## Execution slices and acceptance criteria

### 1. Pinned to the visible area, built and checked on staging

1. The chat root is pinned to the visual viewport: `position: fixed`, `top = visualViewport.offsetTop`, `height = visualViewport.height`, updated on resize and scroll; `100dvh` before the first measurement or without `visualViewport`. Where `offsetTop` is 0 (Android, desktop) the result equals today's.
2. The composer input text is 16px.
3. While the chat screen is mounted, the page canvas behind it is the chat background colour, restored on leave, so any remaining gap is not white.
4. The text-size zoom is measured in a real engine (Chromium and WebKit); if it mis-sizes the root, the measurement is corrected for it.
5. Tests: iOS-like viewport (offsetTop > 0) pins top and height; Android-like (offsetTop 0) is unchanged; no visualViewport falls back; the canvas colour is set and restored; the input is 16px.

DoD:
- The new spec and the repository's checks are green; `npm run build` green.
- The branch image is built for staging and released to mumate-2; staging `/api/health` reports the branch SHA.
- The owner checks the chat on staging on his own device and says it is fixed; then a PR is opened and the owner merges.
- After the merge: Vercel production serves the merge SHA, and staging is rebuilt and released to the merge SHA.

## Boundaries

- The v2 chat screen only. Not the v1 chat modal, other screens, the chat API or the messages.
- While the branch is on staging, staging does not match production; the team's staging sign-off for `mumate-vercel-to-do-001` waits until staging is back on the production SHA.

## Relations to other workstreams

- `mumate-vercel-to-do-001`: staging is kept in step with production (event 2026-10-03T05:35:18); this lane takes staging off production's SHA for the owner's check and puts it back after the merge.
- `mumate-promo-popup-auth-001` (delivered): last staging release, fe 9695d27.

## Review and estimated effort

About 3–5 hours including the staging round. Risk: the chat is a main feature; the Samsung fix from PR #638 must still hold (offsetTop 0 keeps today's behaviour).
