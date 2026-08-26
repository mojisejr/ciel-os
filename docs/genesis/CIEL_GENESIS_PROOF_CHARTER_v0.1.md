# CIEL Genesis Proof Charter v0.1

**Status:** Proposed — prepared for owner review

**Purpose:** Define one small, repeatable proof that a fresh Codex session can
resume a CIEL workstream from durable evidence without relying on the previous
session's chat history.

**Authority:** This charter does not ratify or amend
`CIEL_GENESIS_CONTRACT_v0.2.md`. It records the proposed test boundary for the
first Codex-only proof.

## 1. Proof question

Given a workstream closed by Session A, can Session B inspect the repository
and accurately state what the work is, where it stands, what evidence supports
that statement, what is uncertain, and which action comes next?

The proof passes only when Session B works from repository artifacts and current
Git state, not from Session A's conversation memory.

## 2. Scope

This first proof exercises one CIEL-controlled Git workspace and Codex sessions
only. A mutable workstream may use one isolated Git worktree as an execution
lane. The worktree is an execution location, not ownership of the workstream by
an agent.

The proof deliberately does not create or evaluate a CLI, skill, SQLite store,
index, daemon, MCP server, dashboard, IDE bridge, `CLAUDE.md`, or automatic
cleanup mechanism.

## 3. Terms

| Term | Meaning in this proof |
|---|---|
| Project | A Git workspace/repository. |
| Workstream | One owner-directed objective that can span multiple sessions. |
| Session | A disposable execution period by a coding-agent client. |
| Closeout | An append-only record of a deliberate checkpoint, including evidence, unresolved items, and a next action. |
| Current view | A rebuildable statement of a workstream's present state, derived from records and live evidence. |
| Execution lane | A branch and, when files are changed, an isolated Git worktree used to perform mutable work. |

CIEL owns durable workstream records and evidence references. An agent owns no
durable task claim: it reads, acts, and records an outcome.

## 4. Evidence and reconciliation

Session B begins with the smallest sufficient context and deepens only when a
question remains unanswered or sources disagree.

1. Read the repository instructions, README, and relevant Genesis document.
2. Identify the candidate workstream from the newest relevant closeout event.
3. Inspect the referenced branch, worktree, revision, working-tree state, and
   any relevant Git history or PR state.
4. Compare recorded claims with observed state.
5. Report a discrepancy as uncertainty; do not rewrite or silently reinterpret
   the historical closeout.

For present Git state, direct observation is stronger than an older record. A
closeout remains historical evidence of what Session A observed and intended at
its checkpoint.

## 5. Recovery states

The following labels are proposed views, not mutable task ownership:

| View | Evidence condition | Required next behavior |
|---|---|---|
| `resumable` | Lane and recorded context agree sufficiently to take the listed next action. | Resume after normal preflight. |
| `needs-reconciliation` | A closeout is missing, a referenced lane is absent, or live evidence conflicts with the record. | Inspect before modifying anything; state the uncertainty. |
| `cleanup-eligible` | The workstream has terminal evidence, its lane is no longer needed for review/resume, and Git state has been checked. | Request or perform an explicit cleanup step; never remove during Wake. |
| `orphaned` | Git exposes a worktree or branch with no matching CIEL record. | Preserve it and ask for reconciliation; never infer that it is disposable. |

An unexpected process exit may leave no closeout. This is an expected recovery
case, not a reason to invent a completion record or require a persistent agent.

## 6. Session-A fixture

Session A must leave these durable artifacts before ending intentionally:

1. A worktree and branch, if the workstream changes files;
2. the workstream artifact or checkpoint it created;
3. one append-only `closeout` event containing the objective, outcome,
   evidence references, unresolved items, and next action; and
4. a reviewable diff, before any commit that checkpoints the event.

For this Genesis run, the fixture is this charter on branch
`docs/genesis-proof-charter` in the `ciel-os-genesis-proof` worktree.

## 7. Session-B acceptance rubric

Without relying on Session A's chat history, Session B must be able to report:

1. the workstream objective and scope;
2. the branch, worktree, base or checkpoint revision, and current Git status;
3. what was completed, with source references rather than copied diffs;
4. active constraints, unresolved risks, and any contradiction between record
   and live state; and
5. the next executable action and whether the lane is resumable,
   needs reconciliation, cleanup-eligible, or orphaned.

The proof fails if Session B guesses any missing item, treats an old closeout as
live state without checking Git, or cannot identify the next action from the
artifacts.

## 8. Known boundary conflicts

This proposed charter intentionally follows the current `AGENTS.md` Genesis
rule: begin with append-only `closeout` events only. It does not resolve these
conflicts with the proposed Genesis Contract v0.2:

- Contract v0.2 asks for more record types and two client bridges in its V0
  scenario; this charter evaluates a Codex-only, closeout-first proof.
- Contract v0.2 proposes a local SQLite event store; the Architecture Baseline
  delays SQLite until retrieval use demonstrates a need.

Only the owner may ratify an amendment that resolves those boundaries.

## 9. Next action

Review this charter and the accompanying closeout event. After owner approval,
commit the reviewed artifacts on this branch through the repository's PR
workflow. A genuinely fresh Session B can then perform the rubric against the
committed checkpoint.
