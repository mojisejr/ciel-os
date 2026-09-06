# Pilot task report — status-only flag

**Workstream:** `pilot-report-status-flag-001`
**State:** blocked
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective

Add a `--status-only` flag to the report CLI that prints just the status counts
instead of the whole summary.

This change exists to give `ciel-parallel-lanes-001` a real lane to run. It is
deliberately trivial, and its value is that it is genuinely tracked work in a
child project, not that the feature is wanted.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan, decision, and closeout evidence | `.` |
| `pilot-task-report` | the child this lane changes | `checkouts/pilot-task-report` |

## Blocked until slice 1 lands

This lane cannot run before `ciel-parallel-lanes-001` slice 1 makes Wake usable
during parallel work. It is recorded as blocked rather than active so that the
portfolio does not report a lane as running when nothing can run, and so the
decision authorizing it is recorded when it actually starts.

## Parallel lane

This workstream runs at the same time as `pilot-ledger-count-command-001`. The
two share no child project, which is exactly the condition the parallel-lanes
proof declares safe. Both are driven from separate sessions, both run from the
`ciel-os` folder itself and both committing HQ evidence to the same standing
branch. No Git worktree is used.

## Starting evidence

- `src/cli.ts` takes one positional path and prints the full summary as JSON.
- `summarizeTasks` already returns `byStatus`, so the flag selects part of an
  existing result and needs no new computation.
- `src/task-input.ts` defines the `TaskInput` shape and `TaskPriority` that
  mirror what `pilot-task-ledger` produces. This lane must not touch either.

## Invariants

- No change to `TaskInput`, `TaskPriority`, `summarizeTasks`'s return shape, or
  the accepted input format. Two lanes are only independent while the shared
  contract stays untouched.
- Default output without the flag stays byte-identical.
- No new dependency.
- `local_only` delivery: merge locally after checks, no pull request.

## Execution slices and acceptance criteria

### 1. Status-only flag

`bun run src/cli.ts <tasks.json> --status-only` prints only the `byStatus`
object as JSON. Without the flag the output is unchanged, and the flag is
accepted in either argument order.

**Done when** tests cover both the flagged and unflagged output, the existing
tests still pass, and the change is merged locally onto the child's `main`
without rewriting history.

## Boundaries

Nothing beyond the one flag. If this starts to need design, the parallel-lanes
proof has drifted and the change is reverted rather than grown.
