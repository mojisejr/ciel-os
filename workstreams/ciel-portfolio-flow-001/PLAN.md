# CIEL portfolio and workstream flow

**Workstream:** `ciel-portfolio-flow-001`  
**State:** active  
**Execution lane:** single  
**Plan revision:** 0.7
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

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
| `pilot-task-ledger` | task JSON producer | `projects.local.yaml` binding; `checkouts/pilot-task-ledger` |
| `pilot-task-report` | task JSON consumer | `projects.local.yaml` binding; `checkouts/pilot-task-report` |

## Lifecycle

```text
Wake → Align → Plan → owner confirm → Execute → Closeout checkpoint → Wake
```

If a session ends without a closeout, the next Wake treats the active lane as
`interrupted / needs-reconciliation`: inspect the plan, event history, local
Git, and worktree before any further execution. It must not infer completion or
create a successor lane.

A decision authorizes execution only when it names this plan path, exact plan
revision, and exact execution phase in its evidence. With `Execution phase: none`,
no decision can authorize execution. A proposed parallel lane, or overlap on a
project with another active workstream, remains owner-confirmation-required
unless that decision explicitly approves parallelism. Before an agent starts
work it marks this plan `executing`; a later Wake treats that durable marker as
an interrupted lane until reconciliation, never as a live session identity.

## Phases

### 1. Portfolio artifact contract

**State:** completed
**DoD:** CIEL can validate committed project identities; machine-local bindings
are ignored; this workstream has a plan that names its scope, lane, lifecycle,
and recovery rule.

**Evidence:** `ciel projects validate`, deterministic project-validator tests,
and `git check-ignore projects.local.yaml`.

### 2. Portfolio Wake

**State:** completed
**DoD:** Wake discovers active workstreams, groups checkpoints by workstream and
lane, verifies every available bound project through local Git, and reports
active, paused, blocked, unavailable, and conflict attention states.

### 3. Lifecycle gates

**State:** completed
**DoD:** Plan revisions, owner decisions, interruption recovery, and proposed
parallelism have deterministic artifacts and tests without adding a write path.

### 4. HQ checkout convention

**State:** completed
**DoD:** The CIEL root has an ignored `checkouts/` directory for local child
repositories. A human can open both pilot applications directly from the HQ
IDE tree, while CIEL keeps only their identities, bindings, plans, and semantic
events under version control.

**Layout:**

```text
projects/<project-id>/project.yaml  committed identity registry
checkouts/<project-id>/             ignored local Git checkout
projects.local.yaml                 ignored relative checkout binding
workstreams/<workstream-id>/        committed plan
memory/events/                      committed decisions and closeouts
```

**Rules:**

- `checkouts/` is a physical child of the HQ root so a normal IDE file tree can
  open projects without discovering paths elsewhere.
- The HQ ignores child repositories and their `.git` directories; it tracks
  only a small `checkouts/README.md` and `.gitkeep` that explain the boundary.
- Agents use `git -C checkouts/<project-id> ...` to inspect or work in a child
  repository. `git -c` is reserved for temporary Git configuration, not for
  changing directories.
- Local bindings use `checkouts/<project-id>` relative to the HQ root. A
  missing checkout remains `unavailable`; no path is inferred.

**Evidence:** an IDE-visible layout check, `git check-ignore` for every child
repository path, and deterministic Wake tests for present, missing, and
mismatched child checkouts.

### 5. Real-workstream pilot

**State:** active — Slice 5.1 completed; later slices owner-gated
**DoD:** Two small Bun + TypeScript CLI applications prove portfolio Wake and
one interrupted-lane recovery using repository files and local Git evidence.

**Entry gate (satisfied for Slice 5.1):** Revision 0.6 selected execution
phase `5` and `evt_20260901T052652_phase5_slice1_authorized` recorded the
owner decision before either child repository was created.

**Completed scope from revision 0.6:** Slice 5.1 established the two local
pilot checkouts, their honest local-only project identities and bindings, and
their passing unit-test baselines. No cross-project `priority` change,
intentional interruption, fresh-session recovery proof, remote repository, or
push occurred.

**Local-only identity result:** Slice 5.1 minimally extended the committed
registry and Wake verification to represent a local Git repository with no
`origin`, rather than inventing a canonical remote. The extension has
deterministic tests and adds no network call, database, service, or event write
path.

**HQ test boundary:** The HQ test command runs only `test/`; each ignored child
repository owns and runs its own test command. This keeps child implementation
failures from becoming accidental HQ test inputs.

**Pilot applications:**

```text
pilot-task-ledger/                 source of the task JSON contract
  src/task.ts                      task shape and validation
  src/task-file.ts                 JSON file reading
  src/export-tasks.ts              validated export use case
  src/cli.ts                       command boundary
  data/tasks.json                  sample input
  test/task.test.ts                task validation unit tests
  test/export-tasks.test.ts        export unit tests

pilot-task-report/                 consumer of the exported task JSON
  src/task-input.ts                exported JSON validation
  src/summary.ts                   priority/status summary rules
  src/cli.ts                       command boundary
  fixtures/tasks.json              Ledger-compatible sample input
  test/task-input.test.ts          input validation unit tests
  test/summary.test.ts             summary unit tests
```

**Pilot slices:**

1. **Completed:** Set up the checkout convention and both repositories with passing unit tests.
2. **Planned:** Add a `priority` field to Ledger's exported task contract and adapt Report's
   input and summary tests; checkpoint the happy path.
3. **Planned:** Mark the plan `executing`, make one small reversible Report change, and
   intentionally leave it without closeout.
4. **Planned:** Start a genuinely fresh agent/session with no prior chat context. It must
   use Wake to find both child repositories and report the lane as
   `needs-reconciliation` without creating a successor lane.
5. **Planned:** After owner direction to keep, revise, or revert the scratch change,
   close out the workstream with local-Git evidence.

**Constraints:** no network service, browser, database, account, credential,
user data, or irreversible operation. Unit tests are mandatory for both pilot
applications; a separate end-to-end test is not required because the proof is
the fresh-session reconstruction across the two real repositories.

## Explicit non-goals

- Database, index, daemon, dashboard, MCP server, or event write command.
- GitHub issue, PR, or board synchronization or automation.
- Chat/session IDs, client memory, or model state as CIEL evidence.
