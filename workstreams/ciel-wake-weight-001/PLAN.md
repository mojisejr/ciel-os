# CIEL — Wake reports open work only, truthfully, without growing with history

**Workstream:** `ciel-wake-weight-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

Wake is meant to give every session the whole picture. As HQ grew, it stopped
doing that.

On 2026-10-20 one Wake run measured:

- 546 KB of output and 479 git subprocess calls, taking 12-22 s.
- Under Codex's read-only sandbox it ran for more than 10 minutes without
  finishing.
- 60% of the output is a per-event checkpoint list that no code reads.
- 62% of the output belongs to finished workstreams.

No agent can read that output whole. Each one truncates it and misses parts:
a Claude session missed `OWNER.md`, and Codex never saw the report at all.
Wake also still reports a delivered non-final slice as "authorized".

The owner and agent agreed the following in a five-round syncup on 2026-10-20:

- **Quality and continuity come before speed.** A fast Wake that cannot find or
  connect things is worse than a slow one.
- **Nothing may conflict with what CIEL is**, unless it is truly necessary.
- **Agents are the only readers** of Wake output. The owner reads what an agent
  tells him.
- **Finished work stays silent.** It appears only when Wake finds something
  wrong with it, or cannot check it. When the owner asks "is that done?" or
  "where is that now?", the agent looks it up.
- **Paused work gets one line each:** what it is, where it stopped, and why, so
  the owner can ask further.
- **No fixed size cap.** Output size depends on open work only and never on
  history. A soft warning reports when Wake has grown, names what is largest,
  and says briefly that long-silent open work exists. The warning cuts nothing.
- **Do the least that works.** No cache, index, database or vector store
  unless measurement later shows the change below is not enough.
- **The slice-status defect is included.** It is fixed in Wake, with no new
  event field. The agent asks the owner if that turns out to be impossible, and
  splits or asks when the work becomes complex.
- **Keeping workstreams small and self-contained is a separate matter.** It
  follows only after this workstream has delivered and shown whether long
  workstreams really need handling. This workstream supplies the evidence: the
  bloat warning names the largest open workstreams.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | Wake code, contract wording, tests, plan, evidence | `.` |

## Starting evidence (2026-10-20, HQ `main` at `ecbf2ce`)

- **Git calls:** a counting shim measured 479 calls: 407 in HQ and 72 across
  18 other checkouts. They break down as follows:
  - 234 have answers that cannot change: 72 for plans marked completed, and 162
    for plans whose final closeout is merged.
  - About 200 repeat a repository-wide fact. For example,
    `show-ref origin/main` runs 98 times.
  - 89 `git log -1 -- <event>` and 89 `merge-base` calls get slower as history
    grows.
  - The per-workstream loops in `src/portfolio/read.ts` run one after another.
- **Output size:**
  - `checkpointsByLane` is 326 KB. Only `src/portfolio/read.ts:392` builds it,
    and one test counts it.
  - Finished workstreams account for 341 KB.
  - Pretty-printing adds 28%.
- **Workstream state:** 27 of the 33 plans whose header says "active" have a
  merged final closeout. Per `README.md`, derived lifecycle outranks the plan
  header.
- **Slice status:** `matchesTerminalScope` counts only the last declared slice.
  Once a non-final slice's closeout merges, its decision therefore stays
  "authorized". Example: `ciel-owner-operating-contract-001` slice 2.
- **Research:** subagents, 2026-10-20. Current practice is:
  - a size-budgeted, front-loaded start packet, plus details fetched just in
    time (Anthropic's context engineering and Agent Skills; Aider's repo map);
  - hiding finished work (Beads: `bd ready`, memory decay);
  - agentic grep over vector indexes for small corpora (Claude Code, Cline).

  "Lost in the Middle" and Chroma's "Context Rot" show long, repetitive input
  degrades recall.

## Slices

Each slice keeps Wake read-only and inside the evidence boundary: repository
files and local Git only, no new truth store, no network.

### 1. Report open work only, and keep everything reachable

Before changing code:

- Save the current full report as the baseline. It stays out of Git.
- Fix a question set modelled on how the owner actually asks. Examples:
  - "praneet ไปถึงไหนแล้ว"
  - "เรื่องย้าย Vercel ไป DO เสร็จยัง"
  - "มีงานอะไรหยุดไว้บ้าง ทำไม"
  - "PR ไหนรอ merge"
  - "mumate มีอะไรต้องทำก่อน 10-28"
- Write the expected answers from the records, then run the questions through
  cold headless sessions against today's Wake.

Then change Wake:

1. **Open work.** The default report lists workstreams whose derived lifecycle
   is not finished. For each it gives the slice status, the latest record's
   next action and its unresolved items.
2. **Paused work.** One line each: id, where it stopped, and why.
3. **Finished work.** Absent from the default report unless an existing signal
   fires: a closeout not in history, `needs-reconciliation`, delivered but
   unmerged work, a branch left after merge, or a near-miss decision. A check
   that cannot run makes the workstream appear as "unknown", with the reason.
4. **Detail mode.** One read-only mode of the same command shows any single
   workstream in full: everything today's report holds for it, including its
   checkpoints. `AGENTS.md` tells agents to use it when the owner asks about a
   specific piece of work.
5. **Bloat warning.** Wake measures its own output. Above a soft threshold, set
   as one named constant (about 25 KB to start), it adds a short warning: the
   largest contributors, a note that long-silent open work exists, and what to
   consider doing. It never truncates.
6. **Layout.** Critical items come first: authorizations, anomalies, then next
   actions. `ownerOperatingContract` stays last. Remove `checkpointsByLane`
   from the default report, and print compact JSON.

Acceptance:

- **No fact lost.** Every field the baseline holds for a workstream is present
  in its detail output, checked programmatically for every workstream.
- **Size follows open work only.** A fixture test adds finished workstreams and
  extra events, and the default report does not grow.
- **Behaviour is covered by tests:** paused one-liners, anomaly surfacing,
  "unknown" surfacing, the detail mode, and the warning.
- **Continuity.** The same question set, run through cold sessions against the
  new Wake, answers at least as correctly as the baseline. Every answer is
  recorded as observed.
- **Checks.** `bun run check` and `bun run wake` pass, and `git status` matches
  the intended change.

### 2. Report a delivered non-final slice truthfully

When a slice's closeout has reached the target branch, Wake reports that slice
as delivered and the next declared slice as not yet authorized, instead of
leaving the earlier decision "authorized". This uses only the slice numbers that
closeouts already carry.

If Wake cannot tell this apart without a new field or convention, stop and
bring the choice to the owner.

Acceptance:

- A fixture test covers authorized, delivered-non-final, and finished.
- `ciel-owner-operating-contract-001` reads as "slice 2 delivered; slice 3 not
  authorized".

### 3. Ask Git less, with identical answers

- Look up repository-wide facts once per run.
- Replace the per-event `log -1` and `merge-base` calls with one history walk
  and one reachable-commit set.
- Use one `status --porcelain=v2 --branch` per project.
- Skip repeated work for the same commit.
- Run independent per-workstream work concurrently where it is safe.

Acceptance:

- The default and detail outputs are identical, byte for byte, before and after
  this slice on the same HQ state.
- Record the measured git-call count, time, output size, and the time under
  Codex's read-only sandbox. None of these is a pass/fail target.
- `bun run check` passes.

## Boundaries

- Each slice gets its own topic branch from current `main` (slice 1 uses
  `feat/wake-weight`) and its own draft pull request. The owner merges each
  one.
- Slices run in order. Each needs its own owner decision; the first decision
  covers slice 1 only.
- These files are shared: `src/`, `AGENTS.md`, `README.md`. No other HQ session
  may be live while they change.
- Out of scope:
  - caches, indexes, databases, embeddings, hooks;
  - changes to the event schema;
  - the small-workstream rule;
  - a speed target for Codex's sandbox.
- If slice 3's measurements show Wake is still unusable in Codex's sandbox,
  that is evidence for a later, separately decided step, such as a disposable
  cache keyed by Git state. It is not part of this plan.
