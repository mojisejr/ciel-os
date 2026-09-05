# CIEL — multi-client support on one foundation

**Workstream:** `ciel-multi-client-support-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Let a Claude session and a Codex session operate CIEL from the same repository
foundation, with the same rules, the same evidence boundary, and the same
lifecycle, without either client becoming CIEL's identity.

The owner directed that CIEL itself be upgraded rather than compensated for by
an out-of-repository shim. A client bridge is therefore a repository artifact
that CIEL owns and can audit, not a private file inside one client's host
configuration.

This plan does not ratify Genesis Contract v0.2, adopt a second client as a
permanent supported target, or authorize a bridge generator, write path, or
runtime capability beyond the slices below.

Slice 2 must be executed before any decision event can authorize a later slice
of this plan, because the current code cannot authorize a plan whose execution
phase is `none`. The owner authorizes slice 1 and slice 2 directly through this
plan's confirmation; from slice 3 onward the normal decision path applies.

## Starting evidence

- `memory/events/2026/09/05/20260905T112800_cross_client_session_closeout.yaml`
  records six friction points a Claude session hit against the current contract,
  their single root cause, and three things that needed no help at all.
- Root cause recorded there: `AGENTS.md` states the draft rule in one line while
  the operative procedure — ancestor proof, review template, who advances a pull
  request, branch cleanup — lives in `README.md` and in decision events that
  `AGENTS.md` never references. A client reading only `AGENTS.md` fills the gap
  with its own defaults and sounds correct while doing so.
- The same event records two defects found during that session:
  `isTerminalCloseout` joining on `execution_phase`, and the validator accepting
  an event with no checkpoint reference. The owner directed that both be closed
  here rather than deferred.
- A third dependent was found while preparing this plan and is not yet in any
  event: `decisionAuthorizesPlan` requires a non-null execution phase, so under
  the current plan policy no decision can ever authorize execution, and
  `deriveLifecycle` detects an interrupted lane from a marker the policy no
  longer writes. With `isTerminalCloseout` these are one root cause, not three
  separate bugs: `Execution phase` served both as a retired progress marker and
  as the live key binding decisions and closeouts to a plan.
- Measured while preparing this plan: 29 of 77 committed events carry no
  checkpoint reference that `findCheckpoint` accepts, including 15 of 26
  `decision` events. The proposed fix recorded in that event, which was to make
  the validator fail, would break the existing ledger and is superseded by the
  warning-based approach in slice 2.
- `AGENTS.md` currently forbids adding `CLAUDE.md`, IDE instructions, or nested
  instruction files "until the Codex-only workflow reveals a concrete need". The
  event above is that recorded need, and the owner has authorized this
  workstream to amend the rule.
- Genesis Contract v0.2 section 4 requires a bridge to be an explicitly
  delimited CIEL-managed section that preserves human-authored content outside
  it, and section 11 names `AGENTS.md` and `CLAUDE.md` as the two V0 bridges.
- Proof Charter section 8 records that this two-bridge requirement was
  deliberately deferred and remains an unresolved conflict for the owner.
- A Claude session resumed and completed another client's workstream from
  repository artifacts and local Git alone, so the continuity core itself needs
  no change to serve a second client.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | bridge artifacts, operating contract, and proof | `.` |

No child project is touched. No product repository changes.

## Authority and scope

- The owner confirms this plan and any reframe before execution starts, and
  authorizes each execution phase by naming this plan path, revision, and phase.
- The owner has authorized this workstream to amend `AGENTS.md`, including the
  rule that currently forbids `CLAUDE.md`, because the recorded need is the
  cross-client closeout event named above. Record that authorization in the
  phase closeout; do not treat this plan as a standing licence to edit the
  operating contract in later workstreams.
- The owner remains the authority for every merge, for the supported-client set
  under Genesis Contract v0.2 section 14, and for any change to the Wake
  evidence boundary. This workstream does not change that boundary.
- The agent performs, without asking again, the steps `README.md` already
  assigns to it after proof: the closeout ancestor check, the review-template
  update, advancing a draft pull request to ready, post-merge synchronization,
  and cleanup of a branch proven fully merged with no open pull request.
- Agent sessions are disposable and are not stored as evidence or locators.
  A client name is provenance, never authority.
- Global host capabilities remain ambient assistance. They may not establish a
  CIEL fact before or after this work, and this plan does not widen that rule.
- One execution lane. Any proposed parallel lane, same-project overlap, or
  worktree split is surfaced for owner confirmation before it begins.
- The owner chose the authorization key for slice 2: a decision names the slice
  it authorizes, and `Execution phase` becomes optional rather than required.
- Slices 2 and 3 change `src/`. Keep those changes minimal, covered by tests, and
  free of any behaviour change beyond the recorded defects.

## Invariants

1. One canonical truth boundary. A bridge points at repository state; it never
   becomes the only copy of a rule, decision, or evidence record.
2. Client-neutral first. A rule that applies to any client belongs in the shared
   foundation. Only genuinely client-specific mechanics belong in a bridge.
3. No client owns CIEL. Neither bridge may claim authority, identity, or
   approval, and neither client's name may appear in a shared rule as its owner.
4. The Wake evidence boundary is unchanged. A bridge may not widen it, and must
   restate that global skills, global memory, prior chat history, and external
   services cannot establish a CIEL fact.
5. Additive to Codex. No existing Codex behaviour, rule, or artifact regresses.
   A Codex session after this workstream behaves as it does before it, except
   where slice 1 makes an existing rule easier to reach and slice 2 makes a
   broken derivation correct.
6. The ledger is append-only. No historical event is edited, back-filled, or
   invalidated to satisfy a stricter check introduced here.
7. Bridges are rebuildable projections, not ledger entries. They may be
   rewritten; the events that record their existence may not.
8. Earn every capability. Hand-authored bridges first. No generator, CLI write
   path, hook, launcher, or global skill unless a slice below proves the need.

## Execution slices and acceptance criteria

### 1. Complete the shared foundation

The root cause is a shared-foundation gap, not a Claude gap. Fix it before
adding any bridge, so both clients benefit from the same correction.

- `AGENTS.md` references where the operative procedure lives, so an agent that
  reads it can reach every rule it needs without guessing.
- The pull-request lifecycle states plainly which steps the agent performs on
  its own after proof: ancestor verification, description template, advancing a
  draft to ready, post-merge synchronization, and branch cleanup.
- No rule is duplicated. `AGENTS.md` gains references, not a second copy of
  `README.md`.
- Acceptance: for each of the six recorded friction points, name the file and
  line a client would now reach, or record explicitly that the point is
  client-specific and deferred to slice 4.
- Acceptance: a Codex session reading the amended `AGENTS.md` finds no rule
  changed in meaning, only rules made reachable.

### 2. Decouple authorization and lifecycle from `Execution phase`

The owner's plan policy stopped writing execution progress into plan headers, so
`Execution phase` is permanently `none` and `Execution state` permanently
`idle`. Three code paths still join on those fields and are therefore dead or
broken. They share one root cause: `Execution phase` was serving both as a
progress marker, which is retired, and as the key that binds a decision or a
closeout to its plan, which is still required.

The owner chose the approach: a decision names the **slice** it authorizes, and
`Execution phase` becomes optional rather than load-bearing.

- `decisionAuthorizesPlan` in `src/portfolio/read.ts` requires
  `workstream.executionPhase !== null`, so with a phase of `none` no decision
  can ever authorize execution. Match instead on plan path, plan revision, and
  an `evidence.slice` value naming a slice this plan declares.
- `isTerminalCloseout` joins a terminal closeout to its plan on
  `execution_phase`, so no workstream following the policy reaches
  `awaiting-owner-merge`, `merged-needs-sync`, `merged-needs-cleanup`, or
  `completed`. Match on workstream id and plan revision, treating
  `execution_phase` as optional.
- `deriveLifecycle` detects an interrupted lane from
  `executionState === "executing"`, a marker the policy no longer writes, so
  that detection can never fire. Proof Charter section 5 treats an interrupted
  lane as a real recovery state, so it must not be dropped silently.

- Acceptance: a decision event naming this plan, revision `0.1`, and a declared
  slice moves that workstream to `authorized`.
- Acceptance: existing decisions that name an `execution_phase` against a plan
  that still declares a numeric phase continue to authorize. Backward
  compatibility is proven, not assumed.
- Acceptance: `cu12-simulator-sprint-003` reports `completed` from evidence
  alone, with no plan header edited and no event added to force it.
- Acceptance: the two workstreams already reporting `completed` still do, and no
  workstream reports terminal without a merged closeout reachable from fetched
  `origin/main`.
- Acceptance: state explicitly whether interrupted-lane detection is re-derived
  from evidence or deliberately retired, and record the reason either way. Do
  not leave a branch of code that can never execute without saying so.
- Acceptance: `Execution phase` and `Execution state` remain accepted header
  fields so every existing plan still parses. Nothing is required to change in
  a plan file.
- Acceptance: covered by `test/portfolio/read.test.ts`.

### 3. Make the validator catch what Wake depends on

The validator requires `evidence` to exist but never inspects it, while
`findCheckpoint` in `src/wake/read.ts` needs one of
`evidence.repository.head`, `evidence.repository.base_revision`,
`evidence.base_revision`, or `evidence.prior_checkpoint`. An event lacking all
four validates cleanly and then degrades Wake reconciliation to `unknown` for
every session that follows. This session produced exactly such an event and only
caught it because the owner asked what a fresh session would see.

- Measured before planning: 29 of 77 committed events carry no such reference,
  including 15 of 26 `decision` events and 14 closeouts. A hard failure would
  break `bun run wake` against a ledger that is append-only and cannot be
  back-filled, so the earlier proposal to fail is superseded.
- The fix warns and never fails. The exact scope is an open question for this
  slice to settle from evidence: warn for every event, warn only for `closeout`,
  or warn only when the newest event lacks a reference and reconciliation
  therefore degrades.
- Record the option chosen and why, including whether a `decision` event
  legitimately carries no Git position.
- Acceptance: writing a checkpoint-less closeout produces a visible warning at
  validation time instead of a silent loss of reconciliation.
- Acceptance: all 77 existing events still validate and `bun run wake` still
  reports `validationErrors: []`.
- Acceptance: no historical event is edited or back-filled.

### 4. Add the Claude bridge

- Amend the `AGENTS.md` prohibition on `CLAUDE.md` to reflect the owner's
  decision, recording that the concrete need is the event named above rather
  than silently dropping the rule.
- Add `CLAUDE.md` at the repository root containing one explicitly delimited
  CIEL-managed section, with content outside that section preserved.
- The bridge is short and consists only of pointers and client-specific
  mechanics: read `AGENTS.md` as the operating contract; run `bun run wake`
  before any substantive answer or file change; do not let a global skill,
  global memory, prior session history, or an external service establish a Wake
  fact; the operative procedure continues in `README.md` and in events.
- Acceptance: the bridge contains no rule that exists only there.
- Acceptance: removing `CLAUDE.md` leaves CIEL fully operable for Codex, proving
  the bridge holds no canonical state.
- Acceptance: the bridge names `claude` consistently with the ledger value the
  owner chose.

### 5. Prove both clients on one foundation

This is the first execution of Genesis Contract v0.2 section 11's two-bridge
requirement, and it closes the conflict Proof Charter section 8 deferred.

- A fresh Claude session, given only an ordinary opening question and no
  steering, performs Wake before answering, cites repository evidence, and does
  not use a global skill, prior session history, or an external service to
  establish a CIEL fact.
- A fresh Codex session performs its unchanged Wake and reports the same
  workstream state from the same artifacts.
- Both sessions independently state the same current state, the same next
  action, and the same unknowns for one nominated workstream.
- Any divergence between the two reports is recorded as a finding, not smoothed
  over.
- Acceptance: the proof runs without either session reading this conversation
  or any other client's chat history.
- Acceptance: record what the bridge did not fix, so a later slice is justified
  by evidence rather than ambition.

## Boundaries and delivery

- No bridge generator, `ciel bridge sync` command, event write path, daemon,
  MCP server, database, index, dashboard, hook, launcher, or CIEL-specific
  global skill. If slice 5 shows hand-maintained bridges drift, that is a
  recorded finding and the input to a separate decision.
- Slices 2 and 3 are the only changes to `src/`, and only for the recorded
  defects. No other derivation, schema field, command, or output shape changes.
- No IDE instruction file, nested instruction file, or third client.
- No change to the Wake evidence boundary, the required event schema fields,
  the plan policy, `projects/`, any other workstream, or any child project.
- No historical event is edited or back-filled to satisfy slice 2 or 3.
- No SMC work, CU12 work, or hardware claim.
- Record outcomes in append-only CIEL events. Deliver through a topic branch and
  a draft pull request whose head carries the phase closeout, verified before
  the pull request is advanced for owner review.

## Explicit non-goals

- Proving that a client obeys its bridge in every future session. Slice 5 proves
  one run, not a guarantee. A bridge sync is a rendering, never proof of
  obedience.
- Ratifying Genesis Contract v0.2, or resolving its remaining conflicts with the
  Proof Charter beyond the two-bridge item that slice 5 exercises.
- Making CIEL client-agnostic in general. Two clients on one foundation is the
  claim; a third client remains unproven.
- Compiling the minimum continuity packet of Contract section 10. It stays
  unbuilt and unclaimed.
