# CIEL — Parallel lanes across sessions

**Workstream:** `ciel-parallel-lanes-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

Prove that two independent coding-agent sessions can each drive their own CIEL
workstream at the same time from one HQ repository, and record honestly which
parts of the current contract survive that and which do not.

The owner set the rule this proof must test: two workstreams may run in
parallel only when they share no child project. Sharing `ciel-os` does not
count, because every workstream keeps its plan and events there. Two lanes that
touch the same child are not two lanes; they are one workstream with two slices.

The owner also directed that no CIEL skill, hook, or machinery be added on the
strength of this plan. Slice 1 changes nothing and only observes. Slice 2 may
change CIEL only for gaps slice 1 actually demonstrated.

## Why the pilots

`pilot-task-ledger` and `pilot-task-report` are registered, bound, clean, and
`local_only`, so a failed run cannot reach any remote. The contention this
proof measures is in HQ, and HQ is exercised for real here: real plans, real
events, real worktrees, real Wake, and two real draft pull requests against the
canonical remote. Only the child work is deliberately trivial.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan, decisions, proof evidence, and the code slice 2 may change | `.` |
| `pilot-task-ledger` | child driven by the first lane | `checkouts/pilot-task-ledger` |
| `pilot-task-report` | child driven by the second lane | `checkouts/pilot-task-report` |

## Starting evidence

Measured while preparing this plan, on `e91316a`:

- `decisionAuthorizesPlan` requires `event.lane === workstream.lane`
  (`src/portfolio/read.ts:392`) and a plan declares exactly one lane
  (`src/portfolio/read.ts:97,114`, a single token matched against
  `/^[a-z0-9][a-z0-9-]*$/`). A decision recorded on a second lane can therefore
  never authorize a plan. One workstream has exactly one authorizable lane, so
  two parallel lanes must be two workstreams. `checkpointsByLane` groups
  checkpoints by lane but cannot rescue a lane no decision can authorize.
- All ten committed workstreams declare `lane: single`. The multi-lane grouping
  has never carried real data.
- All ten also list `ciel-os` in their project links. The overlap check at
  `src/portfolio/read.ts:586` therefore fires for every pair of concurrent
  workstreams, so it cannot distinguish a real child collision from the
  unavoidable HQ overlap. This is the defect slice 2 is expected to fix.
- A second, larger defect was measured while writing this plan rather than
  predicted. `deriveTerminalLifecycle` only returns `completed` when the current
  checkout is on the delivery target branch, at exactly fetched `origin/main`,
  with an empty status (`src/portfolio/read.ts:504-518`). Otherwise it returns
  `merged-needs-sync`, and both `deriveAttention` and `deriveLifecycle` count
  any workstream that is not `completed` as still occupying its projects
  (`src/portfolio/read.ts:568,637`).

  Observed: on clean `main` at `e91316a`, the four merged workstreams
  `ciel-multi-client-support-001`, `ciel-pr-workflow-policy-001`,
  `cu12-e2e-lab-001`, and `cu12-simulator-sprint-003` derive as `completed` and
  raise nothing. After switching to this plan's topic branch and adding these
  three plan files, all four flip to `merged-needs-sync` and every active
  workstream reports a conflict.

  The trigger is following the contract. `AGENTS.md` requires a topic branch for
  every tracked change, so the portfolio view degrades the moment any work
  begins and is only accurate while nothing is happening. This matters more for
  lanes than for single-session work: inside a lane worktree the checkout is
  never on `main`, so under the worktree layout every merged workstream would
  report `merged-needs-sync` permanently. Fixing the HQ overlap alone would not
  be enough.
- The start gate in `README.md:114-124` runs `git switch main`. Git refuses that
  in a secondary worktree because `main` is checked out in the primary one, so
  the documented procedure cannot be followed inside a lane worktree as written.
- `tsconfig.json` includes only `src/**/*.ts` and `test/**/*.ts`, and the test
  script scans only `test/`, so a `worktrees/` directory under the HQ root does
  not affect `bun run check`.
- `wake` already reads `git worktree list --porcelain` and reports each
  worktree's path, head, branch, and bare flag (`src/wake/read.ts:58,168`). It
  reports nothing about why a worktree is still present.
- The two pilots share a data contract: the ledger produces task JSON that the
  report consumes, and both define `TaskPriority`. Separate repositories do not
  make them independent, so this proof deliberately picks features that leave
  that contract untouched.

## Invariants

- No CIEL skill, hook, launcher, daemon, write path, or event type is added.
- Local and fetched `origin/main` must match before any lane worktree is
  created. Drift between them is the failure mode this rule exists to prevent.
- A lane worktree is removed and its branch deleted after its merge is verified.
  Cleanup is a required step, not a courtesy.
- The child work stays trivial. If a pilot change starts to need design, the
  proof has drifted and the change is reverted rather than grown.
- Observations about the alignment method used to prepare this plan ride in
  this workstream's closeout events. No new place to record them is created.

## Lane layout

Lane worktrees live at `worktrees/<workstream-id>/` under the HQ root, ignored
by Git, mirroring the existing `checkouts/` convention. A tracked
`worktrees/README.md` states the convention and the cleanup rule.

The known cost, accepted deliberately: `find`, `grep`, and glob runs from the HQ
root will match files inside lane worktrees, because ignoring a directory in Git
does not hide it from those tools. `checkouts/` already behaves this way without
causing trouble. This is recorded so that a later session meeting duplicate
search hits recognises a known trade-off instead of treating it as a new defect.

The start-gate sequence runs in the primary worktree, where `main` actually
lives, and the lane is created from the branch that gate just proved current:

```text
git status --short && git fetch origin --prune
git switch main && git pull --ff-only origin main
git rev-parse HEAD && git rev-parse origin/main      # must match
git worktree add worktrees/<workstream-id> -b <type>/<topic> main
```

## Execution slices and acceptance criteria

### 1. Run two lanes and record what actually happens

Open `pilot-ledger-count-command-001` and `pilot-report-status-flag-001` as
concurrent workstreams and drive each from its own session. The second session
must start cold: it runs Wake and reads the repository, and receives no context
from the session that prepared this plan. Whether a cold session can pick up its
lane from repository files alone is half of what this slice measures, because
the contract already claims agent sessions are disposable and that claim has
never been tested against a live parallel lane.

Record, with commands and observed output rather than impressions:

1. What Wake reports for each workstream once both are active, including how the
   overlap check at `src/portfolio/read.ts:586` behaves and how many separate
   decision events were needed to clear it. A decision authorizes one named
   plan, so overlapping workstreams appear to need one approval each; confirm
   or refute that.
2. Whether the start-gate substitute above is sufficient in practice.
3. What each lane's Wake can and cannot see of the other lane's in-flight
   evidence, and whether that partial view misleads either session.
4. The merge sequence with the second lane rebasing after the first lane merges:
   child merge first, then the HQ pull request, then fetched verification, then
   worktree removal and branch deletion. This ordering is where a parallel lane
   is most likely to go wrong, so it is exercised on purpose rather than avoided.
5. One deliberate conflict on a shared HQ file, introduced only after the steps
   above have succeeded, so a failure there cannot be confused with a failure of
   the lane mechanics.

**Done when** both lanes have merged, both worktrees are removed, both branches
are deleted, `git worktree list` shows only the primary worktree, and a closeout
records each observation above together with every gap found. Nothing in CIEL
is changed by this slice.

### 2. Close only the gaps slice 1 demonstrated

Expected from the starting evidence, but each item is delivered only if slice 1
actually demonstrated it:

1. Make the overlap check encode the owner's rule: overlap on a child project
   blocks parallel execution, overlap on the HQ project does not. HQ is
   identifiable as the project whose configured binding resolves to the
   repository root, so no field is added to any project identity and no schema
   changes.
2. Stop a merged workstream from occupying its projects merely because the
   current checkout sits elsewhere. A `merged-needs-sync` lifecycle means the
   work reached `origin/main`; only the checkout is behind. Such a workstream
   should be excluded from the active-project map alongside `completed` in both
   `deriveAttention` and `deriveLifecycle`, while still being reported so the
   sync is not forgotten. This item is already evidenced above and is a
   prerequisite for the worktree layout rather than an optional improvement.
3. Have Wake report, for each worktree it already lists, the workstream it
   belongs to as read from its directory name, whether its tree is dirty, and
   whether its branch is already reachable from fetched `origin/main`. Those
   three answers distinguish a lane that was forgotten after merging, a lane
   deliberately parked, and a lane with work still in it. All three derive from
   local Git; none introduces stored state.
4. Correct the `README.md` start gate to say that it runs in the primary
   worktree and to give the lane-creation command that follows it.
5. Add `worktrees/README.md` recording the layout, the cleanup rule, and the
   accepted search-hit cost.

**Done when** the deterministic checks pass, the changed behaviour has tests,
and re-running the slice 1 scenario no longer produces the gaps it exposed.

## Boundaries and delivery

- No SMC, CU12, MuMate, hardware, or Windows work belongs here.
- No change to the pilots beyond the two trivial CLI additions their own plans
  describe, and no change to their shared task contract.
- If slice 1 shows the rule itself is wrong, this plan is revised before any
  code changes; slice 2 does not proceed on a rule the proof contradicted.
- HQ changes follow the topic-branch and owner-reviewed pull-request path.
  Pilot changes are `local_only` and merge locally after their checks.
