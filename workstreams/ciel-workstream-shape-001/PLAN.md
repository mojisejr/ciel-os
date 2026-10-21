# CIEL — new workstreams stay small to read, and each fact has one home

**Workstream:** `ciel-workstream-shape-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

The owner finds that context fills fast, sessions slow down, decisions get less
accurate, and he clears sessions sooner and sooner. The transcripts bear the
last part out. Interactive sessions in this project peaked at a median of about
520k tokens until 2026-10-10. From 2026-10-11 to 2026-10-20 they peaked at about
110k, because he cleared them earlier. The load at session start stayed at
about 40k tokens throughout.

What grows is what an agent has to read. `praneet-nursery-001` has a 140 KB
plan (about 40k tokens to read), 20 slices, 16 appended owner revisions and 109
events in 12 days. Finished workstreams have a median of 2 slices and 8 events.

The progress record is also duplicated. README already says plans hold intent,
and that closeouts plus Git decide progress. In practice:

- 31 plan headers were set to `completed` by hand.
- 34 headers say `active`, but only 11 workstreams are open.
- 4 headers still say `executing` for finished work.

Nothing flags any of this.

The owner and agent agreed the following in a four-round syncup on 2026-10-21:

- **Every fact has one home.**
  - The plan and its slice files say what is intended and how it is accepted.
  - A closeout in `memory/events/` says what was done.
  - Git holds the code and the merges.
  - Wake derives where the work stands.

  Nobody writes progress into a plan. The owner: "คุนต้องทำให้เป็นแบบนี้เสมอไม่หลุด
  และ robust ไม่บวม ... ระยะยาวก็จะได้ ไปเจอปัญหาใหม่ ไม่ใช่ กลับมาแก้ปัญหาเดิม".
- **A large plan is split into files** in the same workstream folder:
  - `PLAN.md` holds the goal, the current agreement and an index of slices;
  - `slices/<n>.md` holds one slice each;
  - a change of plan is a decision event plus Git history, never an appended
    section.
- **Code checks; it does not write.** The agent writes the files. Wake and
  `bun run check` verify them every run. A structural error is an error; size
  only warns, and there is no fixed cap. A write command waits until a check
  shows agents still get the shape wrong.
- **One slice per session** as a working pattern. A recorded closeout is a safe
  point to clear, now that Wake takes about 2 s.
- **CIEL must work correctly without the agent's own memory (MEMORY.md).** That
  memory is the host's layer, not CIEL's.
- **New workstreams only.** Existing workstreams, including praneet, stay as
  they are: "บาปก็คือบาป แต่เราก็คือเรา".

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | Plan parser, checks, contract wording, tests, evidence | `.` |

## Slices

Each slice keeps Wake read-only and inside the evidence boundary: repository
files and local Git only, no new truth store, no write path.

- [1. The split plan shape, checked every run](slices/1.md)
- [2. Prove it cold, without the agent's memory](slices/2.md)

## Boundaries

- Each slice gets its own topic branch from current `main`, its own pull
  request and its own owner decision. The first decision covers slice 1 only.
- Shared files: `src/`, `AGENTS.md` and `README.md`. No other HQ session may be
  live while they change.
- Out of scope:
  - existing workstreams and their plans;
  - disk housekeeping (`checkouts/`, caches, builds);
  - a CIEL write path or scaffolding command;
  - hooks and skills, until a measured repeat shows agents ignore the checks;
  - fixed size caps;
  - event schema changes.
- Separate, in the host layer: narrowing the agent's own auto memory to machine
  and tool traps. Owner preferences are proposed one by one into `OWNER.md` for
  his confirmation. Any fact that lives only in that memory moves into a CIEL
  record, or the owner drops it. CIEL neither reads nor depends on that memory.
