# CIEL — Owner Operating Contract

**Workstream:** `ciel-owner-operating-contract-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Add the smallest owner-controlled operating contract that lets a fresh Codex
or Claude session apply one confirmed working rule without turning CIEL into a
personal-memory system:

> Progress before meta-optimization.

When an agent encounters a CIEL, tooling, or process side issue during an
owner-committed product outcome, it first determines whether the issue blocks
that outcome, has a safe workaround, or risks serious and irreversible harm.
A non-blocking issue with a safe workaround is deferred and the product outcome
continues. The agent must not inherit the owner's observed tendency to turn a
local problem into an expanding systems problem and perform that tendency on
the owner's behalf.

The owner confirmed this framing through a two-round alignment on 2026-09-08.
The contract applies across CIEL-operated projects. The first live dogfood lane
will be the owner's urgent `mootech-fe` work after slice 1 merges. DAC2 slice 6
remains unauthorized and is not part of this workstream.

## Revision 0.2: an optional owner layer, loaded without agent memory

On 2026-10-20 a Claude session ran Wake and then answered without reading
`OWNER.md`; it read `README.md` only after the owner asked. `AGENTS.md` makes
`OWNER.md` mandatory Wake input, but nothing loads it. The rule depends on the
agent remembering to open the file.

The same gap covers the whole contract for Claude. When a repository has both
`CLAUDE.md` and `AGENTS.md`, Claude Code loads only `CLAUDE.md` by default, and
the current bridge asks in words for `AGENTS.md` to be read. The Claude Code
documentation names that pattern: Claude sees `AGENTS.md` only if it decides to
open the file.

The owner also wants `OWNER.md` to be an optional layer. A workspace without one
runs on `AGENTS.md` alone, with no error and no invented owner rules.

The owner agreed the following in a two-round syncup on 2026-10-20:

- The contract is loaded by the client or by CIEL's own code, not by agent
  memory.
- The change stays minimal and solves the observed problem. Layer boundaries
  stay clear, so the system does not decay as time passes.
- Every client receives `OWNER.md` when it exists, Codex included.
- CIEL gets no hook. A hook belongs to the host machine's own configuration,
  which CIEL does not know about.
- This work is recorded here as revision 0.2, not as a new workstream. The
  bridge change cross-references `ciel-multi-client-support-001`.

### Layers

| Layer | Kept in | Holds | Delivers `OWNER.md` by |
|---|---|---|---|
| CIEL contract | repository | `AGENTS.md`, optional `OWNER.md` | — |
| CIEL code | repository | Wake | echoing the `OWNER.md` text when present, for every client |
| Client bridge | repository, one per client | `CLAUDE.md`: an `@AGENTS.md` import plus Claude-only mechanics | `AGENTS.md` carrying a bare `@OWNER.md` import, which Claude Code expands |
| Host | the owner's machine | hooks, launchers, terminals | out of scope; CIEL does not reference it |

### Starting evidence for revision 0.2

- HQ began on clean `main` at `2e4d572c645f123c46d523319221ddd2f1233eff`,
  equal to fetched `origin/main`.
- Wake observes `OWNER.md` by presence only
  (`ownerOperatingContractPresent` in `src/wake/read.ts`), so a missing file
  already passes. `test/git-workflow.test.ts` asserts the "mandatory Wake
  input" wording.
- Headless Claude Code 2.1.304 was tested in scratch folders:
  - `CLAUDE.md` importing `@AGENTS.md`, which imports `@OWNER.md`, loads both
    files.
  - With `OWNER.md` absent, the import is skipped with no notice and
    `AGENTS.md` still loads.
  - With no `CLAUDE.md`, native `AGENTS.md` loading also expands `@OWNER.md`.
- Native `AGENTS.md` loading needs Claude Code 2.1.277 or later. Per the
  documentation, it stops in four cases: a `CLAUDE.local.md` exists, the
  Project instructions setting is changed, the built-in plugin is disabled, or
  it is the first session after an upgrade. A `CLAUDE.md` that imports
  `AGENTS.md` works in all four, so the thin bridge stays.
- An import written inside backticks is not expanded, so the import line must
  be bare.
- Codex 0.163.0-alpha loads `AGENTS.md` natively and does not expand `@`
  imports. A Codex SessionStart hook could inject the file, but the layer rule
  above excludes hooks.
- `ciel-mini-template` carries `AGENTS.md` only. `ciel-os-template` does not
  exist yet and syncs from `ciel-os` under its own plan. Neither is in scope.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | contract, Wake observation, tests, plan, and evidence | `.` |

No child repository is changed by this workstream.

## Authority boundary

- A committed outcome exists only when the owner states or authorizes it in the
  current request or in a repository decision/plan. An agent does not infer the
  next commitment from preference, chronology, or plan proximity.
- If the commitment, blocker status, safety consequence, or required authority
  is unclear, the agent asks before acting.
- If the necessary action is clear, in scope, non-destructive, and needs no new
  decision, the agent completes it, reports the result, and returns to the main
  line.
- Only the owner may activate, amend, adopt, supersede, or roll back the Owner
  Operating Contract. Agent observations may suggest an interpretation but may
  not edit the contract as though the interpretation were confirmed.

The change path is:

```text
Observe -> suggest interpretation -> owner explicitly confirms -> record
```

## Contract boundary

`OWNER.md` is a versioned operating contract, not a profile. It contains only
confirmed observable working patterns and agent response rules. It contains no
biography, psychological diagnosis, chat history, secret, personal preference
catalogue, inferred trait, or client/session locator.

Universal CIEL rules remain in `AGENTS.md`. Confirmed owner-specific response
rules live in `OWNER.md`, and client bridges point through the shared contract
without copying either rule set.

## Progress-before-meta decision rule

For a side issue outside the committed outcome's acceptance criteria, determine:

1. Does it block the current committed outcome?
2. Is there a safe workaround?
3. Would deferral create serious or irreversible harm?
4. If a fix is necessary, what is the minimum fix that returns execution to the
   main line?

The response is:

- Non-blocking + safe workaround + no serious harm: stop investigating or
  fixing the side issue, defer it, report it only when useful, and continue the
  committed outcome without asking for redundant permission.
- Blocking + clear in-scope minimum fix: make that minimum fix, report it, and
  continue the committed outcome.
- Unclear classification, material scope expansion, or missing authority: stop
  and ask the owner with the evidence already gathered.
- Serious or irreversible risk: stop the affected execution and surface the
  risk without exposing secrets or taking unauthorized external action.

There is no quick-fix exception for a non-blocking CIEL defect. Estimated effort
does not turn a diversion into main-line work.

Serious risk is limited to matters such as imminent data loss, credential or
secret exposure, privacy breach, destructive migration/corruption, an
irreversible external action, or execution without owner authority. Ordinary
technical debt, naming, wording, refactoring opportunities, and optional
tooling improvements are not serious by default.

## Existing vocabulary only

This workstream adds no `PARK` state, command, field, queue, or issue type.

- Use `deferred` as ordinary prose.
- Put a durable side issue in a closeout's existing `unresolved` list with its
  safe workaround.
- Use `next_action` only when the item truly is the next executable action.
- Do not use workstream state `paused` for one side issue.
- Do not create an issue or successor workstream automatically.
- Do not persist a trivial observation that has no future value.

## Execution slices and acceptance criteria

### 1. Install and prove Owner Operating Contract v0.1 Experimental

1. Capture a before-change baseline from one fresh Codex session and one fresh
   Claude session using the same natural scenario prompt. The prompt describes
   an authorized product outcome and a non-blocking duplicate Wake detail, asks
   what to do, and supplies no expected vocabulary or answer rubric.
2. Add root `OWNER.md` with status `Experimental`, version `0.1`, the single
   confirmed pattern, the response rule, safety boundary, existing-vocabulary
   rule, and owner-only change control.
3. Amend Mandatory Wake so every fresh session reads `OWNER.md` after
   `README.md` and before the task-relevant plan or Genesis document and before
   Align. Amend instruction hygiene only enough to distinguish universal CIEL
   rules from confirmed owner-specific rules.
4. Make Wake report only whether `OWNER.md` is present, alongside the existing
   instruction-file presence observations. Presence is not compliance.
5. Update the current repository description in `README.md`. Leave
   `CLAUDE.md` unchanged because it already points to the shared contract.
6. Add deterministic tests for present/missing observation, mandatory-read
   wiring, ordering before Align, and the no-duplicate Claude bridge boundary.
7. Run the same natural scenario from a fresh Codex session and a fresh Claude
   session against the candidate branch. Evaluate responses after the run; do
   not put the rubric in the prompt.
8. Run the complete local check and Wake. Record the observed baseline,
   candidate behavior, limitations, exact Git checkpoint, and rollback surface
   in a closeout on the draft PR head.

Slice 1 is done when both candidate clients identify the authorized product
outcome, avoid changing a non-blocking CIEL issue, retain a safe workaround,
and continue the product outcome without an unnecessary owner question. A
baseline that already behaves correctly is recorded and limits any improvement
claim; it does not get rewritten as a failure.

### 2. Make the owner layer optional and loaded without agent memory

1. `AGENTS.md`:
   - Wake reads `README.md` and the task-relevant plan.
   - `OWNER.md` is read when present and skipped without error when absent.
   - A bare `@OWNER.md` line on its own carries the import, and a plain
     sentence states the same rule for clients that do not expand imports.
   - Instruction-file hygiene states the layers in one line.
2. `CLAUDE.md` becomes an `@AGENTS.md` import plus Claude-specific mechanics
   only.
   - It keeps the note that global skills, global memory and session history
     are not Wake evidence.
   - It drops the restated Wake instruction, which now arrives through the
     import.
3. Wake echoes the `OWNER.md` text verbatim when the file exists.
   - The text is not parsed, so there is no profile and no compliance claim.
   - The text is placed last in the report, so a tail-truncated read still
     shows it.
   - When the file is absent, Wake reports presence false and no text.
4. Update the `README.md` wording, and update the tests to cover:
   - the `OWNER.md` echo, present and absent;
   - the optional-read wording;
   - `CLAUDE.md` carrying `@AGENTS.md` and still no owner rule text.
5. Prove the change on the candidate branch, recording observed output only:
   1. Headless Claude in the candidate checkout quotes a line from each of
      `AGENTS.md` and `OWNER.md` without using tools.
   2. Headless Claude in a scratch copy without `OWNER.md` quotes `AGENTS.md`
      with no error.
   3. `codex exec` runs in both. It quotes `AGENTS.md`, then runs Wake and
      reports the `OWNER.md` text, or reports none in the copy.
   4. The owner opens an interactive Claude session, and `/context` lists both
      `AGENTS.md` and `OWNER.md`. The agent hands this check to the owner step
      by step when it cannot observe it.
   5. After `/compact`, `OWNER.md` is still listed. The agent tries this first
      and hands it to the owner step by step when needed.
   6. `bun run check` and `bun run wake` pass, and `git status` matches the
      intended change.

Slice 2 is done when checks 1, 2, 3 and 6 pass, and checks 4 and 5 are each
either observed or recorded as owner-confirmed. A failure is recorded as found,
not reworded. A failure in check 5 alone does not block the slice, because the
Wake echo remains the floor.

Out of scope for slice 2:

- any hook, launcher or Wake auto-run;
- any change to the content of `OWNER.md`;
- the templates;
- behavioural evaluation of rule compliance;
- Genesis ratification.

Limits:

- Claude receives the owner text twice, through the import and through Wake.
  That costs about 120 lines of context, accepted so that each layer stands on
  its own.
- Codex must still run Wake. That single point remains agent discipline, as
  `AGENTS.md` has always required.
- Import behaviour belongs to Claude Code and can change upstream. The Wake
  echo is the client-neutral floor.

Rollback of slice 2 is a forward change from current `main`. It restores the
bridge sentence, removes the import lines and the echo field, and restores the
mandatory wording and its tests.

### 3. Decide after real dogfood

After slice 1 reaches `main`, run the contract for four weeks and collect at
least three real qualifying encounters across CIEL-operated work. Synthetic
before/after sessions do not count toward the three.

A qualifying encounter is a real opportunity to apply the rule, whether the
result is good or bad: correct deferral, incorrect deferral of a blocker,
unnecessary stoppage, diversion into CIEL work, correct serious-risk handling,
or a justified owner question. A durable observation may be stated concisely in
the affected workstream's existing closeout evidence or unresolved list. No new
observation database or event type is introduced.

After four weeks and three encounters, present the evidence for an owner-only
decision to adopt v0.1, supersede it with a separately approved revision, or
roll it back. Four weeks with fewer than three encounters is `inconclusive`,
not passed. Slice 3 is not authorized by this plan's slice 1 decision.

This slice was numbered 2 in revision 0.1; revision 0.2 renumbered it so that it
stays last. Its four-week window, which began after slice 1 merged, ended on
2026-10-07 without an adoption verdict. The verdict remains the owner's, and
revision 0.2 does not decide it.

## Behavioral scenarios

| Scenario | Expected response |
|---|---|
| Wake wording is duplicated but Git and authority remain reliable | Defer the presentation defect and continue product work |
| Wake cannot establish whether the product slice is authorized | Ask the owner or make only an already-authorized minimum fix |
| A product test required by current acceptance fails | Fix the product; this is main-line work |
| A tracked secret or destructive migration risk appears | Stop the affected execution and surface the serious risk |
| A CIEL refactor appears to take five minutes | Defer it; there is no quick-fix exception |
| No owner-committed outcome exists | Ask which outcome to commit to; do not choose one |
| Blocker status or harm is unclear | Ask before acting |

## Tests and proof

- Wake unit test: `ownerOperatingContractPresent` is true when `OWNER.md`
  exists and false when it does not.
- Repository contract test: Mandatory Wake names `OWNER.md` before Align,
  `OWNER.md` declares version/status and owner-confirmed change control, and
  `CLAUDE.md` remains a pointer rather than a second copy.
- Regression: `bun run check` and `bun run wake` pass without new validation
  errors or warnings.
- Behavioral: one baseline and one candidate observation per supported client,
  using fresh non-persistent sessions and the same natural prompt.
- No session ID, URL, credential, or transcript is committed. The closeout
  records only the prompt, observable response behavior, environment/client,
  and limitation that four samples do not establish future consistency.

An agent's account of its own behavior is evidence, not a verdict. The owner
retains the adoption verdict after dogfood.

## Rollback contract

Rollback is a new owner decision and forward change from current `main`, never
`git reset`, history rewriting, or checkout of an old repository state.

A rollback removes only the active integration: the Mandatory Wake pointer,
current-tree `OWNER.md`, its Wake presence field, its focused tests, and its
README listing. It preserves this plan, all decisions and closeouts, Git
history, later unrelated CIEL changes, and every product commit made while v0.1
was active. If a later change overlaps one of the integration files, rollback
applies a surgical inverse to current `main` rather than blindly reverting the
whole delivery PR.

## Boundaries and delivery

- One HQ topic branch and one draft pull request for slice 1. The pull request
  remains draft until its closeout is committed, pushed, and verified on the
  PR head.
- The owner merges. After merge, return HQ to clean current `main` and delete
  only the verified merged branch.
- The urgent `mootech-fe` work begins only after slice 1 merges. It gets its own
  alignment, plan, authorization, product branch, and delivery.
- No DAC2 slice 6 work, child-repository change, Genesis ratification/version
  bump, database, SQLite, index, MCP server, daemon, API, embedding, global
  skill, agent team, new event type, auto-learning, profile inference, issue
  automation, or `PARK` mechanism.
- Slice 2 and slice 3, and any amendment or rollback, each require a separate
  owner decision.
- Slice 2 uses one topic branch, `feat/owner-layer-optional`, and one draft
  pull request. It touches the shared files `AGENTS.md`, `README.md` and
  `src/`, so no other HQ session may be live while it runs.

## Starting evidence for revision 0.1

- HQ began on clean `main` at
  `18ea9c04cf5e367c0e8ab037e0c2f608fde3414a`, equal to fetched
  `origin/main`.
- Mandatory Wake currently reads `README.md` plus the relevant plan/Genesis;
  no owner-specific artifact is named.
- Wake currently reports presence for `AGENTS.md`, `CLAUDE.md`, and
  `README.md` only.
- `CLAUDE.md` already carries no independent rule and points to `AGENTS.md`.
- The event validator currently supports only `decision` and `closeout`.
- Both before-change clients already chose to continue the authorized product
  outcome and defer the non-blocking Wake presentation issue. The experiment
  therefore begins with no demonstrated baseline failure; its remaining claim
  is whether an explicit, owner-controlled contract makes the behavior durable
  without causing over-stoppage or context bloat.
