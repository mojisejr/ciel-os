# CIEL — Evidence-backed handoff between local machines

**Workstream:** `ciel-cross-machine-handoff-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective

Let the owner continue one workstream between independent Windows and macOS
checkouts through Git and append-only semantic events. A receiving agent must
reconstruct the actual state, including failed or unfinished work, and verify
an explicit transfer before editing. Continuity must not depend on the owner
remembering which machine last worked, a chat history, or a client connection.

This workstream proposes a small operating-contract change and measures it.
It does not promise automatic synchronization or distributed mutual exclusion.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | shared plans, decisions, and semantic evidence | `.` |

The real child project is deliberately not selected. Before slice 3, an owner
decision must name it, its existing authorized workstream, and the permitted
pilot action; revise this table then. SMC and CU12 are examples, not authority
to execute their pending product slices.

## Authority and owner alignment

The owner authorized opening this workstream and preparing this plan on
2026-10-04. Only slice 1 is authorized now. Slices 2 and 3 require decisions
naming this plan, its exact revision, and one declared slice.

Confirmed intent for the proposal:

- Git connects independent local checkouts; execution occurs on the machine
  actually running the work. Codex Remote, Cloud, and chat sync are optional
  host capabilities, not CIEL dependencies or evidence.
- The same workstream transfers sequentially after source closeout and
  publication of the relevant repositories. Disjoint workstreams may proceed
  concurrently, subject to existing shared-file and project-overlap rules.
- Every actual state can transfer: passed, failed, unfinished, blocked, and
  unknown. A transfer records reality; it does not certify product completion.
- Missing or inconsistent transfer evidence stops edits in the affected
  workstream. Read-only investigation and explicit owner-directed recovery
  remain possible. A clean receiving checkout alone does not authorize resume.
- Generic mechanisms belong in CIEL. Actual OS, execution locality, revisions,
  failures, and limitations belong in evidence. Never embed credentials,
  absolute host paths as shared bindings, or disposable session locators.
- Committed events remain immutable. New decisions, corrections, and reverts
  preserve what happened, rather than making an unsuccessful trial disappear.

The owner reports that Mac work is currently idle. This is an owner statement,
not remote-machine inspection, and must be reconfirmed before shared-file edits.

## Existing evidence and the gap

1. `AGENTS.md` already establishes Wake, owner authority, closeout, checkpoint
   heads, and append-only events. `README.md` establishes independent repository
   currentness, topic branches, draft PR delivery, and shared-checkout lanes.
2. `workstreams/ciel-parallel-lanes-001/PLAN.md` revision 0.3 concerns several
   sessions in one checkout. Its standing branch is not a cross-machine lock.
   Independent checkouts prevent local overwrites but not Git merge conflicts
   or incompatible semantic changes after publication.
3. `src/events/validate.ts` validates event structure, not a transfer protocol.
   `src/portfolio/read.ts` cannot establish whether a claimed lane is live or
   abandoned. Existing Wake does not prove another machine has stopped.
4. `workstreams/ciel-windows-portability-001/PLAN.md` revision 0.1 remains the
   separate Windows readiness proof. Its 2026-09-28 decision restricted Windows
   publication to `win/*` and retained Mac integration authority. This plan
   does not supersede those restrictions or authorize a product slice.
5. Local Git at opening: clean `main` equalled fetched `origin/main` at
   `f0ae0adbf9cb5335d01d82459b41c3493c30fb46` before this topic branch was created.
   The older HQ check incident and `e63ce24` fix are reachable from this head;
   the incident's then-local publication warning is historical, not a fresh
   assertion that these changes are still unpushed.
6. Windows Wake currently fails because the `yaml` dependency is unavailable.
   Bun is 1.2.4, outside the committed `>=1.3.2 <2` range; frozen installation
   failed with a registry certificate error. Default Git fetch also failed
   certificate verification; using Windows trust through per-command
   `http.sslBackend=schannel` succeeded without disabling TLS verification.
   These are observed local blockers, not a cross-machine proof result.
7. The 2026-10-04 HQ incident records 44 passing checks on Mac, explicitly no
   Windows HQ check, and possible remaining path assumptions. Local inspection
   finds `path.split("/")` in plan parsing; its runtime effect is unproved.
   No local child bindings/checkouts have been verified for the real pilot.

The missing contract is how a source releases a bounded scope, how a receiver
verifies and accepts it, and what an agent does when those facts are missing.
No new service is justified by that gap.

## Proposed transfer procedure — pending slice 2

### Source: preserve and offer the actual state

1. Identify the workstream, authorized slice, affected repositories, intended
   receiving execution context, and bounded scope. Stop edits in that scope
   before offering it. Other independent work need not stop.
2. Inspect each relevant repository separately. Preserve transferable tracked
   work in commits, including incomplete code if allowed by that project's
   policy. Record dirty, uncommitted, ignored, unavailable, or non-transferable
   material explicitly. Do not smuggle secrets or runtime data into Git.
   When a required artifact cannot transfer, the receiver may inspect but
   cannot perform an action that depends on it.
3. Record an ordinary closeout checkpoint with the actual result, unresolved
   issues, next executable action, HQ checkpoint, and child project identities,
   branches, and exact observed commits. Report check results with command,
   execution OS, and tested revision; distinguish fail from not-run.
4. Describe the handoff offer under existing `evidence`, using a small proposed
   convention: workstream scope, source execution OS and locality, intended
   receiver OS if known, and source statement that edits in scope stopped.
   Host aliases are optional owner labels, not mandatory identifiers or locks.
   An agent observing from Windows must not label a Mac test as a Windows test.
5. With the required external authorization, publish child commits first and
   the HQ closeout last. Fetch and verify each required revision and the commit
   containing the event on the advertised remote refs. Publication across
   repositories is not atomic: partial success is an incomplete transfer.
   The event's checkpoint predates its own commit; verify containment of the
   event commit separately, without a self-referencing hash or endless events.
6. After verification, present the offer's event ID and exact Git locations.
   Do not resume source writes in that scope while it is offered/accepted. A
   withdrawal or change must be recorded and reconciled before another writer
   proceeds. These are proposed operating rules, not existing CLI enforcement.

### Receiver: verify before continuing

1. Treat "continue this workstream" as a request to locate its transfer, not
   proof of one. Refresh authorized remote refs outside Wake, then run Wake
   using only repository files and local Git. Without refresh, label freshness
   unknown; without a working Wake, do not claim the reconstruction proof passed.
2. Read the plan, decision, closeout offer, and any later acceptance, withdrawal,
   or recovery record. If an event is on a fetched unmerged branch, inspect it
   with local `git show`; do not pretend Wake indexes every branch's events.
3. Verify plan authority, scope, repository identities, object availability,
   remote reachability, and ancestry against advertised refs. Compare branch
   tips and later records: unrelated descendant commits need reconciliation,
   while affected-scope changes after the offer invalidate blind acceptance.
   Timestamps alone cannot choose between competing offers or writers.
4. Integrate only the required published state using the repository's approved
   workflow. Do not switch an HQ branch underneath live local lanes, blindly
   pull into dirty work, or overwrite a receiving checkout. A child's WIP
   topic branch can transfer before its final PR merge; handoff does not waive
   owner review or permit direct main pushes. The exact HQ branch integration
   route must be exercised in slice 2 before the real pilot.
5. Verify machine-local bindings and necessary ignored assets independently.
   Record acceptance as an ordinary semantic checkpoint referring to the
   source event ID and the Git commit containing it, plus verified revisions
   and the receiver's actual execution context. Acceptance does not claim that
   product checks passed. Publish/verify this receipt before shared continuation
   under the agreed route; a failed receipt publication leaves the transfer
   incomplete and stops edits until reconciled.
6. Continue only the authorized next action. On return, repeat the same source
   and receiver procedure in the other direction.

### Missing evidence or interrupted transfer

Stop affected edits, inspect available files and Git, and explain the exact
missing fact. Never infer unpublished source changes from a remote tip or
invent the source's consent. The owner may recover from the available published
checkpoint with an explicit decision recording that the source is unavailable,
what may be lost or unknown, and the authorized bounded action. Concurrent or
late source work must then be reconciled; the recovery is not proof it vanished.

This reduces reliance on memory when an agent reads the contract. It cannot
prevent an agent that ignores it, two receivers accepting concurrently, an
offline writer, or unpublished files. No strict lock or zero-conflict claim is
made. If these limitations defeat the intended use, record the measured gap
and obtain a revised plan rather than adding infrastructure automatically.

## Delivery slices

### 1. Open the workstream and prepare the review plan

Changes: this plan, one opening decision, and one local planning closeout.
Do not change operational instructions, CLI, OWNER.md, other plans, or remotes.

Definition of done:

- The plan distinguishes existing evidence, owner intent, proposal, and unknowns.
- It names the minimal candidate files, transfer and recovery sequence,
  counterexamples, rollback, and the gates for later slices.
- An owner decision authorizes revision 0.1 slice 1 only; the closeout records
  actual local Git and validation limitations without marking the workstream done.
- Focused local checks validate these artifacts. Bun checks, publication, and
  Windows/Mac dogfood are not represented as completed when unavailable.

### 2. Prove a minimal contract using disposable Git fixtures

Prerequisite: owner review and an exact slice decision, confirmation shared
files are quiet, and agreement on the remote publication/integration route.

Candidate changes and why:

- `AGENTS.md`: a concise resume gate and truthful release/acceptance boundary
  applicable to any client. Keep universal rules here once.
- `README.md`: concrete multi-repository handoff and recovery mechanics, with
  distinctions between local lanes, cross-machine transfer, and final PR delivery.
- Events in this workstream: actual experiment outcomes and owner decisions.
  Keep one evidence convention under existing fields; no separate transfer store.

Use ignored temporary fixtures with two independent clones and a local bare
remote, including a child repository where needed. A local bare remote proves
Git mechanics, not GitHub permissions, network behavior, or actual Mac execution.
Fixtures must not masquerade as production events or become registered projects.

Definition of done:

- A new reader can identify the offer, exact checkpoint, permitted next action,
  execution provenance, and receipt without a chat transcript.
- Exercise the scenario matrix's Git/event cases, especially missing offer,
  partial publication, stale offer, divergent offers, failed checks, and revert.
- Demonstrate event-on-unmerged-branch discovery and safe HQ integration while
  preserving unrelated events; explain conflicts rather than promising none.
- Old events remain readable without new required fields or retroactive edits.
- Run repository Wake and relevant checks with supported dependencies. If a
  measured CLI defect blocks the proof, close out the gap and request a bounded
  plan revision; `src/` and new automation are outside this slice's default scope.
- Show the candidate contract and evidence for owner review before adoption.
  If existing mechanics suffice, avoid adding extra rules merely to fill a plan.

### 3. Dogfood Windows → Mac → Windows with a fresh reader

Prerequisites: reviewed slice 2 result; owner decision for slice 3 and the named
pilot; Windows readiness proof and supported toolchain; both machines available;
necessary child bindings/assets verified; no competing writer in pilot scope.
Any pilot-specific product action needs its own existing or new authorization.

Sequence: source Windows prepares an intentionally unfinished authorized task,
offers/publishes it; a fresh Mac reader verifies/accepts and makes the permitted
next change; Mac offers it back; a fresh Windows reader verifies/accepts and
continues. At least one hop carries a real failed or blocked result. Do not
manufacture a failure in a live product without explicit pilot authorization.

Definition of done:

- On both machines, actual Wake and relevant project checks are recorded with
  command, revision, OS, and pass/fail/not-run status.
- Both hops reconstruct scope, exact HQ/child revisions, actual failure or
  blocker, limitations, and next action from files and local Git. Only a
  workstream identifier or evidence locator is supplied to the fresh reader.
- One missing-transfer attempt stops edits and permits read-only investigation;
  record the observed behavior, not the agent's compliance verdict.
- Non-transferable assets and independent work remain explicitly accounted for;
  no secrets, session identifiers, or absolute shared bindings are introduced.
- Both offer/receipt pairs and any correction remain reachable in Git. Report
  sample size and limitations; one successful round is not universal robustness.
- Final closeout names slice 3 only when all DoD evidence exists and offers the
  workstream for owner review under the repository's PR procedure.

## Scenario matrix and before/after expectations

These are proposed experiments, not claims that they have already happened.

| Scenario | Current gap / risky assumption | Expected result to measure |
|---|---|---|
| Windows stops mid-task; Mac continues | Clean Mac clone mistaken for source release | Mac verifies explicit offer and exact child/HQ revisions before editing |
| Tests fail on Windows | Failure omitted or handoff confused with completion | Failure and tested revision transfer; Mac executes the documented next diagnostic |
| Owner forgets source closeout | "Continue" relies on owner recollection | Agent stops edits, identifies missing offer, gathers facts read-only |
| Child push fails but HQ push succeeds | Event points to unavailable code | Missing object/reachability blocks acceptance; partial publication stays visible |
| Source edits after offering | Old closeout treated as latest truth | Scope-changing tip/record discrepancy requires a new reconciled offer |
| Two receivers or divergent offers | Separate clones assumed to prevent contention | Competing evidence stops affected work; no inferred winner or lock guarantee |
| Different child workstreams run in parallel | Separate repos assumed to prevent every conflict | Preserve both HQ events; reconcile shared files and semantic coupling explicitly |
| Required ignored asset stays on source | Git push assumed to carry the whole environment | Name the missing prerequisite; dependent action cannot proceed until verified |
| Machine clocks differ | Latest timestamp assumed to establish ownership | Use event references and Git ancestry; report ambiguous order |
| Source becomes unavailable | Available remote mistaken for complete source state | Explicit bounded recovery decision retains unknown unpublished work |
| Proposed rule fails and is reverted | History rewritten to look as if no trial occurred | Original experiment, failure, revert, and next-action evidence all remain readable |

## Rollback and learning proof

Before adoption, the existing contract remains operative; withdrawing an
unadopted proposal needs no code rollback. Record the actual outcome and why.
After adoption, a rollback needs owner authority for the affected contract and
uses a normal reviewed topic branch. Revert the observed implementation commit
with `git revert`, resolving only its effects and preserving unrelated work.
Never reset published history, force-push, or delete committed events.

Append a closeout recording the hypothesis, exact scenario and input revisions,
observed failure, effect on continuation, actual revert revision and checks,
remaining risk, and next action. If the governing decision must be superseded,
append that explicit owner decision too. Do not mark a rule withdrawn solely
because an agent disliked it. Do not record "we tried and it failed" before a
real measurement exists.

Slice 2 must demonstrate this in fixtures: apply the candidate rule, exercise
an adverse case, revert the tracked change, retain the failed-case record, and
give a fresh reader enough evidence to distinguish the original baseline,
experiment, failure, and rollback. A production rollback is recorded only if
one actually occurs; fixture evidence is labeled as such.

## Non-goals and unresolved prerequisites

- No new daemon, database, API, MCP server, lock service, event writer, host
  hook, global skill, client bridge, scheduler, or permanent agent team.
- No OWNER.md amendment, retroactive machine tagging, secrets, session IDs,
  automatic background synchronization, direct main push, or silent takeover.
- No Windows COM/RS485/hardware proof, product feature implementation, or
  expansion of SMC/CU12 authority through this plan.
- Windows toolchain/TLS, missing dependencies/local bindings, possible remaining
  path assumptions, and unsynchronized local time need resolution or measured
  limits in the existing readiness proof. Do not repair them during slice 1.
- Choose the real pilot and approve an HQ/child publication route compatible
  with the older Windows decision. Independent machines do not automatically
  know which execution host the owner intends.
- Remote writer liveness, unpublished work, and instantaneous remote currentness
  cannot be proven by local Git. External writes require owner authorization.

## Sources and next action

Use `AGENTS.md`, `README.md`, `OWNER.md`, the existing Windows and parallel-lane
plans, `src/events/validate.ts`, `src/portfolio/read.ts`, and the recorded HQ
incident as the local operating evidence. The Genesis architecture baseline
and proposed v0.2 contract remain the role/truth boundaries, not permission to
implement their future infrastructure.

Next action: owner reviews revision 0.1, chooses any scope corrections, and
decides the publication route and whether to authorize slice 2. Before the real
cross-machine pilot, finish the separate Windows readiness prerequisites and
name the pilot explicitly. Keep pending work pending until its evidence exists.
