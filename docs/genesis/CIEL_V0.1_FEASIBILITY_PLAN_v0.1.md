# CIEL v0.1 Feasibility Plan v0.1

**Status:** Active — TypeScript + Bun selected for implementation

**Purpose:** Turn the completed Codex-only Genesis proof into one small,
deterministic implementation feasibility slice without adopting the unratified
parts of `CIEL_GENESIS_CONTRACT_v0.2.md`.

## 1. Governing boundary

This plan follows the implementation-entry decision recorded at
`evt_20260826T141105_implementation_entry_boundary`.

- Root `AGENTS.md` governs execution constraints.
- The Architecture Baseline v0.2 informs the target shape.
- The Genesis Contract v0.2 remains proposed, so its SQLite, two-client, and
  package-layout choices are not adopted by this plan.

The feasibility slice is Codex-only, stateless, Git-aware, and YAML-first. It
does not add a daemon, database, MCP server, global skill, second client bridge,
or network dependency.

### Selected implementation toolchain

The owner selected TypeScript + Bun for CIEL core implementation. This choice
applies to CIEL's own commands, validation, Git integration, and tests; it does
not impose a language on workspaces managed through CIEL.

- Bun is the runtime, package manager, and test runner.
- TypeScript is the implementation language; a separate `tsc --noEmit` check
  complements runtime tests.
- Dependency versions are committed in `bun.lock`.
- The tested runtime baseline is Bun 1.3.2; upgrades require a reviewable
  compatibility check.

## 2. Question

Can one small local implementation validate the event records and produce a
read-only Wake report from `AGENTS.md`, `memory/events/`, and current Git state
without treating a historical closeout as present state?

## 3. Candidate slice

With the selected Bun package layout, create only these two deterministic
capabilities:

1. **Event validation** — parse every event file, validate the required common
   fields, accept only the initially approved event types, and report
   file-specific failures with non-zero exit status.
2. **Read-only Wake report** — read the repository instructions, discover the
   newest relevant event, inspect Git branch/HEAD/status/worktrees, and print
   observed facts separately from recorded claims and unknowns.

Neither capability writes an event, changes Git state, contacts a remote, or
infers human approval. A closeout writer is deferred until these read paths have
passed against a real workstream.

## 4. Required decisions before code

The implementation language and package layout were owner-reserved in the
proposed Contract. The completed feasibility assessment selected TypeScript +
Bun using these criteria:

- reliable YAML parsing and clear diagnostics;
- portable execution in the intended Codex workspace;
- deterministic, dependency-minimal test execution;
- straightforward access to Git without a persistent process; and
- a package layout that does not pre-commit CIEL to an IDE, model provider, or
  client bridge.

No SQLite index or bridge is part of that choice.

## 5. Acceptance tests for the first implementation slice

The approved implementation must prove all of the following:

| Case | Evidence of success |
|---|---|
| Current records | The repository's committed events validate, with a count and paths reported. |
| Invalid record | A fixture missing one required common key fails and names that key and file. |
| Event type boundary | An unapproved type fails deterministically; an approved `closeout` or `decision` validates. |
| Clean/dirty Git | The Wake report distinguishes a clean worktree from a deliberate uncommitted fixture change. |
| Historical snapshot | The report names the event checkpoint separately from current HEAD and identifies a traceable descendant as expected evolution. |
| Missing authority | The report labels an unrecorded review, approval, or external rule as unknown rather than fact. |
| Statelessness | Two fresh invocations from the same committed fixture produce equivalent semantic results without a local database or daemon. |

## 6. Stop conditions

Stop and return to owner review if the slice requires any of the following:

- SQLite, caching, a background process, or a network service;
- a second client bridge or an instruction-file rewrite;
- a schema expansion beyond the approved initial event types;
- a package/toolchain decision without the required feasibility evidence; or
- a result that cannot distinguish Git observation from event history.

## 7. Sequence

1. Establish the Bun + TypeScript foundation and its deterministic checks.
2. Implement event validation with fixtures and tests.
3. Add the read-only Wake report and its reconstruction tests.
4. Run the slice on one real workstream and record the observed proof gap, if any.
5. Only then consider a closeout writer, minimal knowledge, SQLite, or another client bridge.
