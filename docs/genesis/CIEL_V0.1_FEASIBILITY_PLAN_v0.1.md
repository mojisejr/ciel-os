# CIEL v0.1 Feasibility Plan v0.1

**Status:** Active — foundation, event validation, and read-only Wake implemented; fresh-session pilot pending

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

### Session-load contract

Before the pilot, the repository's session-start instructions must point a fresh
Codex session to the implemented Wake command without turning `AGENTS.md` into
a history store or a CLI manual. `bun run wake` is the single fast path: it
validates current event records and reports local Git evidence. A session reads
the relevant plan or Genesis document afterwards, then deepens inspection only
when the report or task requires it. `bun run events:validate` remains a
focused diagnostic, not a mandatory duplicate scan.

A CIEL Wake claim uses repository files and local Git only. Global skills,
global memory, prior chat, GitHub, and external services are excluded evidence.
If a host injects or requires one, the session must report
`environment-contaminated` rather than claim a CIEL Wake result. This policy
does not itself enforce host capabilities; enforcement remains a later,
separately justified test-environment concern.

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
| Session-load contract | `AGENTS.md` directs a fresh Codex session to the read-only Wake command without copying event history or implementation detail into the instruction file. |
| Evidence boundary | A CIEL Wake claim excludes global skills, global memory, prior chat, GitHub, and external services; an injected source produces `environment-contaminated`, not a passing claim. |

## 6. Stop conditions

Stop and return to owner review if the slice requires any of the following:

- SQLite, caching, a background process, or a network service;
- an instruction change beyond the reviewed, Codex-only Wake invocation;
- a schema expansion beyond the approved initial event types;
- a package/toolchain decision without the required feasibility evidence; or
- a pilot that cannot run without excluded host context; or
- a result that cannot distinguish Git observation from event history.

## 7. Sequence

1. Establish the Bun + TypeScript foundation and its deterministic checks.
2. Implement event validation with fixtures and tests.
3. Add the read-only Wake report and its reconstruction tests.
4. Activate the reviewable session-load contract in `AGENTS.md` and align repository-facing status documentation with the committed read-only core.
5. Run the slice in one genuinely fresh Codex session and record the observed proof gap, if any.
6. Only then consider a closeout writer, minimal knowledge, SQLite, or another client bridge.
