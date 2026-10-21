# ciel-office — tell the owner when work is finished, by voice and on Discord

**Workstream:** `ciel-office-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.3
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

The owner wants to know, without switching screens, whether the work he gave a
session is finished: "ผมอยากจะรู้ว่า งานที่ผมสั่งไป มันเสร็จหรือยัง ในแต่ละ
session แค่นั้นเลย". Finished work should say what was done, the DoD and the
next action, as a readable card on Discord and a short sentence spoken at the
desk, with the PR to merge and any links to test.

He wants it in its own repository, out of CIEL, so it can be removed or grown
later: "ไม่อยากให้ มัน มาปนกับ ciel เพราะบางทีผมอาจจะถอดออก". It must not
depend on any one agent vendor: a vendor hook "จะจำเพาะเจาะจง กับ แต่ละเจ้า",
and changing LLM would mean redoing it. He wants it small and lasting:
"งาน เล็กๆ เราก็ทำ ให้ใช้งานได้ แล้ว คงทนอยู่นานก็จบละ".

## Owner decisions (2026-10-21)

- Repository `mojisejr/ciel-office`, private; its build is this workstream.
- **The signal is a committed CIEL closeout**, not a vendor hook. `AGENTS.md`
  already requires every client to record one when work reaches a checkpoint,
  so any agent that works through CIEL produces it.
- A turn that only waits for the owner (a question, a permission prompt) is
  not the office's job; each client's own notification covers it.
- No summariser model: the card and sentence come from the event's fields.

Plan 0.1 used Claude Code and Codex hooks and a model summary; the owner
replaced it with this plan after asking for a vendor-independent way.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-office` | the office: scan command, launchd file, tests, runbook (created in slice 1) | `/Users/non/ghq/github.com/mojisejr/ciel-office` |
| `ciel-os` | this plan and its events; the closeouts the office reads | `.` |

The office lives outside `checkouts/` so it keeps working if the CIEL checkout
moves.

## Current agreement

```text
any agent commits a closeout in ciel-os
        │  git appends to ciel-os/.git/logs/HEAD
        ▼
launchd (macOS) sees the file change and runs `office scan` once, as the user
        ▼
scan: closeouts reachable from HEAD that were never announced
        │  none → exit
        ▼
for each: card to Discord + one Thai sentence spoken; remember its event id
```

- **Trigger.** A user LaunchAgent with `WatchPaths` on `ciel-os/.git/logs/HEAD`.
  It runs as the owner, outside any agent's sandbox, and exits after each run;
  nothing stays running. A Git `post-commit` hook was rejected: it runs inside
  the committing agent's sandbox, where network or detached processes may be
  blocked.
- **Scan, not "this commit".** Each run looks for closeout files added in
  commits reachable from `HEAD` whose event id is not in the seen list, so a
  missed trigger is caught by the next one and an amend, rebase or second fire
  never announces twice. The first run records every existing closeout as seen
  without announcing.
- **Card** (Discord embed), from the event:
  - headline: workstream, slice, status in Thai;
  - done: `outcome.done` or `outcome.completed`, first few lines;
  - DoD: `outcome.acceptance` or `next_action.acceptance_check`;
  - next: `next_action.action`;
  - open items: the count of `unresolved`;
  - PR: the open PR for the event's branch, found with `gh`; otherwise the
    branch name;
  - links: URLs copied verbatim from the event text;
  - footer: "from the closeout as recorded, not a re-check".
- **Voice.** `say` with a Thai voice, from a template per `outcome.status`, for
  example `ready-for-owner-merge` → "<workstream> slice <n> เสร็จแล้ว รอคุณ merge".
  One utterance at a time.
- **Failures speak.** A failed Discord post adds "ส่ง Discord ไม่สำเร็จ"; an
  unreadable event is announced with its path; a failed `gh` lookup prints
  "เช็ก PR ไม่ได้" on the card. Each run appends one line per channel to a log.
- **At most three cards a run.** Further new closeouts become one line,
  "อีก N รายการ", and are recorded as seen.
- **No self-trigger.** The scan only reads Git, with `GIT_OPTIONAL_LOCKS=0`,
  and writes nothing under `ciel-os/.git`; the LaunchAgent sets a
  `ThrottleInterval`.
- **Own webhook.** The office uses a webhook made for it alone, not shared with
  opilot, so it can be revoked on its own.
- **Places outside Git.** Webhook: `~/.config/ciel-office/env`, mode 600. Seen
  list and log: `~/.local/state/ciel-office/`. LaunchAgent:
  `~/Library/LaunchAgents/`.

## Rollback and removal

The office changes nothing the agents or CIEL read: not `~/.claude`,
`~/.codex`, shell files, Git config or any file in `ciel-os`. Removal therefore
restores nothing; it only stops and deletes the office's own pieces.

1. **Pause.** `launchctl bootout` the LaunchAgent; every file stays. Loading it
   again resumes without re-announcing, because the seen list is kept.
2. **Remove from the machine.** Pause, then delete the LaunchAgent file,
   `~/.config/ciel-office` and `~/.local/state/ciel-office`; the clone may stay
   or go.
3. **Retire.** The owner deletes the Discord webhook and archives the GitHub
   repository (archive, not delete); a closeout in this workstream records the
   retirement. Earlier events stay, as the event log is append-only.

Check: `launchctl print` for the label reports it absent, and a test closeout
commit produces no card and no sound.

## Slices

- [1. Closeout card and voice](slices/1.md)

## Boundaries

- CIEL does not reference the office: no line in `AGENTS.md`, `CLAUDE.md`,
  `OWNER.md`, `src/` or Wake names it. The office depends on CIEL's event
  schema `ciel.event.v0.1` and reads only the fields above; an event it cannot
  read is announced, never skipped silently.
- The office only reads Git and GitHub: no event, commit, push or PR.
- No vendor hook, model call, daemon or long-running process.
- Out of scope: per-turn or permission-wait alerts, replying from the phone,
  a dashboard, LINE, Wake-derived workstream alerts, quiet hours, deadline
  reminders, repositories other than `ciel-os`. Each is a later owner decision.
