# ciel-office — tell the owner when a session finishes, by voice and on Discord

**Workstream:** `ciel-office-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

The owner wants to know, without switching screens, whether the work he gave a
session is finished: "ผมอยากจะรู้ว่า งานที่ผมสั่งไป มันเสร็จหรือยัง ในแต่ละ
session แค่นั้นเลย". Each finished turn should say what was done, the DoD and
the next action, as a readable card and a short sentence spoken at the desk.
PRs waiting for his merge and links to test should show on the card.

He wants it in its own repository, out of CIEL, so it can be removed or grown
later: "ไม่อยากให้ มัน มาปนกับ ciel เพราะบางทีผมอาจจะถอดออก".

The model is `~/dev/opilot` `scripts/oracle-voice.ts` (macOS `say` plus a
Discord embed). Its trigger, a rule telling the agent to call the script last,
is not reused: it would put an office rule in CIEL's contract, and a forgotten
call stays silent.

## Owner decisions (2026-10-21)

- Repository `mojisejr/ciel-office`, private.
- Its build is tracked as this CIEL workstream.
- Every Claude Code and Codex session on this machine, whatever its folder;
  the card names the project.
- A session waiting for permission is announced by a short spoken line only.
- The summary uses the same `claude` login as the owner's sessions, never an
  API key.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-office` | the office: hook entry, worker, tests, runbook (created in slice 1) | `/Users/non/ghq/github.com/mojisejr/ciel-office` |
| `ciel-os` | this plan and its events | `.` |

The office lives outside `checkouts/` so it keeps working if the CIEL checkout
moves or goes away.

## Current agreement

```text
Claude Code ends a turn ──(Stop hook, ~/.claude/settings.json)──┐
Claude Code needs permission ──(Notification hook)─────────────┤
Codex ends a turn ──(notify, ~/.codex/config.toml)─────────────┤
                                                                ▼
                ciel-office hook: normalise the payload, spawn the worker, exit at once
                                                                ▼
                worker: last message → URLs → summary → open PRs → voice + card + log
```

- **Hook entry.** Reads the client's JSON, starts the worker detached and exits
  0 at once, so a session never waits on the office. It exits immediately when
  `CIEL_OFFICE_INNER` is set, so the summariser cannot trigger itself.
- **Last message.** The worker reads only the final assistant message of the
  turn, from the payload or the transcript it names.
- **Links.** URLs on the card are copied from that message by pattern. The
  summariser never writes a URL, so a link shown was written by the session; a
  link the session did not write is not shown.
- **Summary.** `claude -p` on a small model, run from a neutral folder so no
  project contract or Wake loads, with `ANTHROPIC_API_KEY` removed from its
  environment so it uses the login. It returns what was done, the DoD, the next
  action and one spoken sentence. A DoD the message does not state reads
  "ไม่ได้ระบุ". If it fails, the card and voice use the message's first sentence.
- **PRs.** `gh` lists the owner's open, non-draft pull requests. The card always
  shows the count; it lists the links when the set differs from the last card.
  If `gh` fails the card says the PRs could not be checked.
- **Voice.** `say` with a Thai voice, one utterance at a time through a lock.
- **Discord.** One webhook. The card carries summaries, links and the PR list,
  never a secret; it says it reports what the agent said, not a re-check.
- **Places outside Git.** Secret: `~/.config/ciel-office/env`, mode 600. State
  and a per-channel delivery log: `~/.local/state/ciel-office/`.
- **Failures speak.** A failed Discord post adds a spoken "ส่ง Discord ไม่สำเร็จ";
  an unreadable payload is announced, not dropped.

## Slices

- [1. Claude Code sessions: card, voice and PRs](slices/1.md)
- [2. Codex sessions](slices/2.md)

## Boundaries

- CIEL does not reference the office: no line in `AGENTS.md`, `CLAUDE.md`,
  `OWNER.md`, `src/` or Wake names it. The hooks live in the user's own client
  settings, the host layer. This is the owner-approved reading of the current
  stage rule against CIEL hooks and daemons: the rule binds CIEL, and the office
  is a separate project that only reads what sessions emit.
- The office never writes to `ciel-os` or any project: no event, commit, push
  or PR.
- Removal is deleting the hook entries and the Codex `notify` line; nothing else
  changes.
- Creating the GitHub repository and editing `~/.claude/settings.json` and
  `~/.codex/config.toml` happen in the slice that needs them, under its
  decision.
- Out of scope: replying or giving commands from the phone, a dashboard,
  a daemon or timer, LINE, Wake-derived workstream alerts, quiet hours, and
  deadline reminders. Each is a later owner decision.
