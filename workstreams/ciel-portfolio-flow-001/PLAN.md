# CIEL portfolio and workstream flow

**Workstream:** `ciel-portfolio-flow-001`  
**State:** active  
**Execution lane:** single  
**Plan revision:** 0.1  
**Phase 1 checkpoint:** pending owner review

## Objective

Make CIEL reconstruct the current attention state of active workstreams across
multiple locally bound Git projects without relying on chat, client sessions,
or external-service state.

## Authority and scope

- The owner confirms a plan or reframe before execution starts.
- The owner must explicitly decide irreversible, difficult, user-impacting,
  financial, or database-affecting work.
- Agent sessions are disposable and are not stored as evidence or locators.
- A workstream defaults to one execution lane. Any proposed overlap, same-project
  concurrency, worktree split, or parallel execution must be surfaced for owner
  confirmation before it begins.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | CIEL portfolio proof | `projects.local.yaml` binding; `.` on this checkout |

## Lifecycle

```text
Wake → Align → Plan → owner confirm → Execute → Closeout checkpoint → Wake
```

If a session ends without a closeout, the next Wake treats the active lane as
`interrupted / needs-reconciliation`: inspect the plan, event history, local
Git, and worktree before any further execution. It must not infer completion or
create a successor lane.

## Phases

### 1. Portfolio artifact contract

**State:** complete, pending checkpoint commit  
**DoD:** CIEL can validate committed project identities; machine-local bindings
are ignored; this workstream has a plan that names its scope, lane, lifecycle,
and recovery rule.

**Evidence:** `ciel projects validate`, deterministic project-validator tests,
and `git check-ignore projects.local.yaml`.

### 2. Portfolio Wake

**State:** planned  
**DoD:** Wake discovers active workstreams, groups checkpoints by workstream and
lane, verifies every available bound project through local Git, and reports
active, paused, blocked, unavailable, and conflict attention states.

### 3. Lifecycle gates

**State:** planned  
**DoD:** Plan revisions, owner decisions, interruption recovery, and proposed
parallelism have deterministic artifacts and tests without adding a write path.

### 4. Real-workstream pilot

**State:** planned  
**DoD:** A multi-project workstream proves portfolio Wake and one interrupted
lane recovery using repository files and local Git evidence.

## Explicit non-goals

- Database, index, daemon, dashboard, MCP server, or event write command.
- GitHub issue, PR, or board synchronization or automation.
- Chat/session IDs, client memory, or model state as CIEL evidence.
