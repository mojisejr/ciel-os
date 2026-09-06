# Pilot task ledger — count command

**Workstream:** `pilot-ledger-count-command-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.3
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective

Add a `count` command to the ledger CLI that prints how many valid tasks a task
file holds.

This change exists to give `ciel-parallel-lanes-001` a real lane to run. It is
deliberately trivial, and its value is that it is genuinely tracked work in a
child project, not that the feature is wanted.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan, decision, and closeout evidence | `.` |
| `pilot-task-ledger` | the child this lane changes | `checkouts/pilot-task-ledger` |

## Cold start

`ciel-parallel-lanes-001` slice 1 has landed, so this lane can run. It is driven
by a session that receives no context from the conversation that planned it: it
runs Wake, reads this plan, and proceeds. Whatever it cannot work out for itself
is a gap in what the repository carries, not a fault of the session, and is
recorded as such.

## Parallel lane

This workstream runs at the same time as `pilot-report-status-flag-001`. The two
share no child project, which is exactly the condition the parallel-lanes proof
declares safe. Both are driven from separate cold sessions, both run from the
`ciel-os` folder itself and both committing HQ evidence to the same standing
branch. No Git worktree is used.

## Starting evidence

- `src/cli.ts` accepts one command, `export`, and reports usage otherwise.
- `exportTasks` already returns the validated task array, so a count needs no
  new parsing and no change to `src/task.ts`.
- `src/task.ts` defines the `Task` shape and `TaskPriority` that
  `pilot-task-report` also depends on. This lane must not touch either.

## Invariants

- No change to `Task`, `TaskPriority`, the exported JSON shape, or any file the
  report project reads. Two lanes are only independent while the shared contract
  stays untouched.
- No new dependency.
- `local_only` delivery: merge locally after checks, no pull request.

## Execution slices and acceptance criteria

### 1. Count command

`bun run src/cli.ts count <tasks.json>` prints the number of valid tasks as a
single integer. The existing `export` command and its output are unchanged, and
an unrecognised command still reports usage.

**Done when** a test covers the count of a fixture with several tasks, the
existing tests still pass, and the change is merged locally onto the child's
`main` without rewriting history.

## Boundaries

Nothing beyond the one command. If this starts to need design, the
parallel-lanes proof has drifted and the change is reverted rather than grown.
