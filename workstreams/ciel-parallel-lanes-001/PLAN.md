# CIEL — Many sessions, one HQ

**Workstream:** `ciel-parallel-lanes-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.3
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

Let several coding-agent sessions work at the same time, all of them run from
the `ciel-os` folder, without weakening the two properties CIEL exists for.

The owner set three requirements and one image:

1. **Sessions stay disposable.** No session is recorded, addressed, or depended
   upon.
2. **Continuity stays at least as good as it is now.** This is not one feature
   among others; it is what CIEL is. Trading it for concurrency would destroy
   the product to add a capability.
3. **Several sessions run at once**, one project each, from the same folder.

The image the owner used governs the design: **one body, many souls.** The body
is `ciel-os`; each session is a soul. Souls coordinate through the shared body,
never by cutting the body into pieces. That is why this plan does not use Git
worktrees, and revision 0.1's worktree layout is withdrawn.

The owner also asked that the arrangement stay as simple and as stateless as
possible, and that nothing be added to CIEL until a measurement demands it.

## What revision 0.1 got wrong

Revision 0.1 designed a worktree per lane. It rested on an assumption never put
to the owner: that a second session would be opened inside a worktree
directory. The owner works only from `ciel-os`, so the whole layout addressed a
problem no one had, while the real one went unexamined.

That real problem is not Git. Two sessions working on two different child
projects never collide, because each child is its own repository in its own
directory. Contention exists only in HQ, and only for the few short moments a
session writes a plan or an event there.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | the shared body: plans, events, and the code slice 1 changes | `.` |
| `pilot-task-ledger` | child driven by the first session in slice 2 | `checkouts/pilot-task-ledger` |
| `pilot-task-report` | child driven by the second session in slice 2 | `checkouts/pilot-task-report` |

## Starting evidence

Measured on `e91316a` and `ae1d0ba` while preparing revisions 0.1 and 0.2.

### The root cause

`ciel-os` is registered as an ordinary project and is bound to the repository
root, and every workstream lists it because plans and events live there.
Consequently HQ's transient working state leaks into the derived status of every
workstream. What looked like three defects is one:

| Symptom | Where | Leaks from |
|---|---|---|
| every concurrent pair reports a conflict | `src/portfolio/read.ts:586,637` | `ciel-os` present in every project list |
| a merged workstream stops deriving as `completed` | `src/portfolio/read.ts:504-518` | HQ not sitting on a clean, current `main` |
| an executing workstream reports `needs-reconciliation` | `src/portfolio/read.ts:596-599` | HQ's own working tree being dirty |

Observed for the second symptom: on clean `main` at `e91316a`, the four merged
workstreams `ciel-multi-client-support-001`, `ciel-pr-workflow-policy-001`,
`cu12-e2e-lab-001`, and `cu12-simulator-sprint-003` derive as `completed`. After
switching to a topic branch and adding three plan files, all four flipped to
`merged-needs-sync` and every active workstream reported a conflict. The trigger
is obeying the contract's own rule that tracked work uses a topic branch.

The third symptom is worse under many sessions: any session that leaves HQ dirty
makes every executing workstream elsewhere look like wreckage.

### A live lane is indistinguishable from a dead one

When a plan is marked `executing`, `src/portfolio/read.ts:595-611` reports
either `interrupted` — "A prior execution was left open without a closeout" — or
`needs-reconciliation`. `ciel-portfolio-flow-001` states this deliberately: the
marker is to be read as an interrupted lane, "never as a live session identity".

With one session that is correct. With several it is a false statement wake
cannot support, and it invites one session to clean up another's live work.

### Wake reports where, not what next or why

`latestEvent` exposes only `path`, `id`, `recordedAt`, `workstreamId`,
`objective`, and `checkpoint` (`src/wake/types.ts:26-35`). `next_action` and
`unresolved` are required in every event and are never read back out; the string
appears zero times in `src/wake/read.ts`. It is also a single latest event for
the whole repository rather than one per workstream, which cannot serve several
lanes at once.

The owner's reason for wanting this is worth recording, because it is stronger
than the feature: knowing what was proposed makes it possible to see **why a
direction changed**. Without it the owner has to ask where things stand every
time, which is precisely the continuity claim failing in practice.

### Facts that still hold from revision 0.1

- `decisionAuthorizesPlan` requires `event.lane === workstream.lane` and a plan
  declares exactly one lane (`src/portfolio/read.ts:392,97,114`). Two parallel
  lanes must be two workstreams. All ten prior workstreams declare `lane:
  single`, so lane grouping has never carried real data.
- Clearing the overlap gate needs one decision event per workstream. Predicted,
  then confirmed: three overlapping workstreams needed three decisions.
- The README start gate runs `git switch main`, which Git refuses in a secondary
  worktree. Recorded as measured; no longer relevant now that worktrees are
  withdrawn, and kept so a later session does not rediscover it.
- The two pilots share a data contract: the ledger produces the task JSON the
  report consumes and both define `TaskPriority`. Separate repositories do not
  make two lanes independent.
- One pull request may carry several workstreams. README's "one bounded topic
  branch" binds a change, not a workstream, and PR 35 carried three plans.
- `awaiting-owner-merge` already exists for a closeout committed but not yet
  reachable from `origin/main` (`src/portfolio/read.ts:490-495`). Under the
  arrangement below a finished lane falls into it by itself.

## The arrangement

**HQ keeps one standing working branch.** It is the ordinary state, not an
exception. Every session commits to it. Nobody switches branches, so there is
nothing to contend for.

```text
about to write HQ, on main          -> git switch -c hq/<yyyymmdd>
about to write HQ, already on hq/*  -> just commit
```

The branch name is the entire state. Its date gives its age, and Wake already
reports the current branch, so no file, marker, or tracker is added.

- **Stage only your own paths.** Never `git add -A`; it would sweep another
  session's work in progress into your commit. This is the one rule the
  arrangement depends on and the one place it can go wrong.
- **The pull request is created when the owner decides to merge**, not held open
  during the work. Nothing rots while waiting, and README's rule that a pull
  request stays a draft until its closeout is on the head applies unchanged to a
  short-lived pull request. Visibility during the work comes from Wake, which
  does not need a pull request to see the branch.
- **After a merge the next session to write HQ opens the next branch.** No
  decision, no handover.
- **`main` stays clean throughout**, so it remains the recovery anchor README
  says it is, and the owner's rule that local and fetched `origin/main` must
  match before starting still holds every time work begins.
- Child projects need none of this. They are separate repositories in separate
  directories and their pull requests merge independently at any time.

Merge timing is the owner's, and Wake supports it by reporting facts rather than
advice: the standing branch's age, and whether any workstream is currently
`executing`. It must not tell the owner what to do; a derived judgement is where
this would start inventing.

## Execution slices and acceptance criteria

### 1. Make the OS coherent under many sessions

This slice runs in one ordinary session. It must land before slice 2, because
without it Wake's output is too noisy during parallel work to read a result
from.

1. Stop HQ's transient state from leaking into workstream status. HQ is the
   project whose configured binding resolves to the repository root, so it is
   identifiable without adding a field to any project identity. Exclude it from
   the overlap calculation, from the terminal-lifecycle currency check, and from
   the executing-lane reconciliation check. One change, three symptoms.
2. Stop a merged workstream from occupying its projects because the checkout
   sits elsewhere. `merged-needs-sync` means the work reached `origin/main` and
   only the checkout is behind; exclude it from the active-project map alongside
   `completed`, while still reporting it so the sync is not forgotten.
3. Report an `executing` lane as what is actually observed. Wake cannot know
   whether a session is alive, so it must stop asserting that execution "was
   left open". It states that the lane is claimed and has no closeout, that this
   is either live work in another session or an interrupted one, and that a
   person must establish which.
4. Report `next_action` and `unresolved` for each active workstream from its own
   latest event, not one latest event for the repository.
5. Report the standing branch's age and whether any workstream is `executing`.
   Facts only. No recommendation, no threshold, no judgement.
6. Record the arrangement in `README.md`: the `hq/<yyyymmdd>` convention, the
   two-line rule, the stage-your-own-paths rule, and that the start gate runs
   before the standing branch is opened.

**Done when** `bun run check` passes with tests covering each changed behaviour,
and Wake run on a standing branch with a dirty tree no longer reports merged
workstreams as conflicts or executing lanes as wreckage.

### 2. Prove it with two cold sessions

Run `pilot-ledger-count-command-001` and `pilot-report-status-flag-001` at the
same time, both from `ciel-os`, one session each. The pilots are `local_only`,
so if the arrangement is wrong nothing reaches a remote and the work is thrown
away rather than repaired.

**Both lanes start cold.** Neither receives any context from the conversation
that produced this plan; each proceeds from Wake and the repository alone. An
earlier draft of this slice had one lane driven by the session that designed the
arrangement. That would have confounded the result twice over: a difference
between the lanes could not be attributed to the arrangement rather than to one
session's memory, and the session that built slice 1 would tend to step around
its own gaps instead of falling into them. Two cold lanes give two independent
samples of the same question, and match how the arrangement will actually be
used, where no session carries the design conversation.

The session that prepared this plan stays as a **reference** and does not drive
a lane. Its rules for the duration:

- It makes no HQ commit while either lane is running. A third writer would
  change the very contention this slice measures. Everything it must write is
  written before the lanes start or after both have finished.
- The owner may ask it whether a lane did the right thing, because that is the
  control this arrangement is for.
- Nothing it says is relayed into a lane. Neither is anything discovered in one
  lane relayed to the other.
- When a lane is genuinely stuck the owner may answer it, so the run does not
  stall. **Every such answer counts as one recorded continuity gap**, which is
  the most valuable measurement this slice can produce: it names exactly what
  the repository failed to carry.

Record, with commands and observed output rather than impressions:

1. Whether the two lanes interfere at all, and where the stage-your-own-paths
   rule was needed to prevent it.
2. What each cold lane worked out for itself and what it had to be told. Every
   answer the owner gave is a continuity gap, not a fault of the session.
3. Whether Wake's per-workstream `next_action` answers "where are we and what
   next" without the owner being asked.
4. What each lane does with a `next_action` that has already been carried out.
   Measured while preparing this revision: after slice 1 merged, this
   workstream's latest record still told a reader to review a pull request that
   was already merged, because a record's advice goes stale the moment it is
   acted on and nothing marks it done. Whether that actually misleads a cold
   session, or is obvious to it, is unknown. If it misleads, the remedy is
   already available without new state — a record's own commit can be tested for
   reachability from `origin/main`, which `deriveTerminalLifecycle` already does
   for terminal closeouts.
5. What a lane sees of the other lane's in-flight work, and whether that view
   misleads it.
6. One deliberate conflict on a shared HQ file, introduced only after the above
   has succeeded, so that a failure there is not confused with a failure of the
   arrangement.

**Done when** both pilot changes are merged locally, both lane closeouts are
recorded, the standing branch has been merged once and reopened, and a closeout
states plainly which of the owner's three requirements held and which did not,
and lists every continuity gap the run exposed.

## Boundaries and delivery

- No CIEL skill, hook, launcher, daemon, write path, event type, or schema
  change. The whole arrangement is a branch-naming convention plus reporting
  what Git already knows.
- No Git worktree. Revision 0.1's layout is withdrawn, and its measurements are
  kept above as recorded fact.
- No change to the pilots beyond the two trivial CLI additions their own plans
  describe, and none to their shared task contract.
- No SMC, CU12, MuMate, hardware, or Windows work.
- If slice 2 shows the arrangement does not hold, this plan is revised before
  any further code change rather than patched to fit the result.
- Observations about the alignment method used to prepare this plan ride in this
  workstream's closeout events. No new place to record them is created.
