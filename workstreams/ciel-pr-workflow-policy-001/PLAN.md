# CIEL — pull-request workflow policy and HQ transition

**Workstream:** `ciel-pr-workflow-policy-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.3
**Execution phase:** 4
**Execution state:** executing
**Parallelism:** none

## Objective

Establish one simple, durable Git workflow for CIEL-bound projects: `main` is
the verified integration and recovery branch; every tracked change begins on a
short-lived topic branch. Local-only projects merge locally after checks, and
projects with a canonical remote merge through a reviewed pull request.

Apply that workflow once to adopt the unpushed CIEL HQ history into a pull
request without rewriting or force-pushing any history. Then prove a
draft-gated remote lifecycle in which the required closeout is on the PR head
before the PR can be made mergeable, and a merged repository returns to one
clean, current `main` with no obsolete topic-branch evidence left behind.

## Historical starting point

- `ciel-os` is a remote project with canonical remote
  `github.com/mojisejr/ciel-os`; its GitHub `main` rule requires pull requests.
- GitHub reports the rule permits merge, squash, or rebase and currently
  requires zero approving reviews, resolved conversations, and re-review after
  a push when applicable.
- Local HQ `main` is at `a3ee7da`; fetched `origin/main` is at `00a714c`, so
  the local branch is ahead by 21 commits and behind by zero.
- CU12 Simulator was seeded as an empty private remote from its existing local
  `main`; now that it has a canonical remote, its next tracked change must use
  this policy.

## Current post-merge position

- PR #16 merged into `main` at `40071bf3a8481355e0cdc600c08972350fc771c9`.
- Before this Phase 3 branch was created, local `main` fetched and
  fast-forwarded to that same revision; `origin/main...main` reported `0 0`
  and the working tree was clean.
- Phase 2's prepared closeout was committed on the prior topic branch after
  PR #16 merged, then carried unchanged onto
  `chore/reconcile-pr-workflow-adoption`. It needs one small follow-up PR to
  become part of canonical HQ history.
- PR #17 merged at `3c8f67715b61d85a0d6c2ed2814db3404651deb5`, with parents
  `40071bf` and `ec5abac`; local `main` then fetched and fast-forwarded to the
  same revision with divergence `0 0` and a clean working tree.
- PR #17 was merged before its final Phase 3 closeout was committed and pushed
  to the PR head. It proves the post-merge return gate, but it does **not**
  prove the pre-merge closeout gate. This is recorded as an exception, not
  silently retrofitted as a passing proof.

## Currentness semantics

- **CIEL OS is current** only when this HQ checkout is on clean `main` and its
  `HEAD` equals fetched `origin/main`.
- **A project is current** only when its own bound checkout independently
  passes the same clean-default-branch and fetched-remote equality gate.
- Do not claim that every project is current from HQ state alone. CIEL reports
  currentness per project; each project must pass its own gate before tracked
  work starts or after its PR merges.
- A finished remote change leaves no topic-branch residue only after its merge
  is verified, its local and remote topic branches are either absent or proven
  fully merged, and the repository has returned to clean current `main`.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | Policy home and one-time history-adoption PR target | `.` |
| `cu12-simulator` | First child to follow the remote-project rule after its seed push | `checkouts/cu12-simulator` |

## Policy v0.1 observed and v0.2 proposed for decision

1. `main` is not a development branch. Do not make normal tracked commits on
   it; use it only to start a topic branch, receive a completed merge, or
   inspect/recover the current integration state.
2. Name every topic branch `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, or
   `chore/<topic>`. One branch serves one bounded vertical slice in one
   repository.
3. In a local-only repository: branch from `main`, run the applicable checks,
   then merge back with `git merge --ff-only`. Delete the topic branch after
   that local merge.
4. In a repository with a canonical remote: begin only with a clean working
   tree, `main` checked out, and local `main` equal to fetched `origin/main`;
   then create a topic branch, run checks, push it, and open a PR to `main`.
   The owner reviews and authorizes the merge; merge commits are preferred so
   evidence that names existing Git revisions remains traceable.
5. The one permitted direct `main` push is the initial seed of an empty remote
   repository. The policy applies immediately after the canonical remote is
   established.
6. Read-only investigation and ignored machine-local material need no branch.
   A tracked plan, decision, closeout, documentation, or test change does.
7. Do not add required reviewers, CODEOWNERS, merge queue, or hosted CI rules
   until a measured workflow need proves them necessary.
8. Create every remote PR as a **draft**. A draft is the merge lock while the
   PR's final closeout is being prepared; do not mark it ready for review yet.
9. Prepare the phase closeout against the actual draft PR and head revision,
   obtain owner review, commit and push it to that PR branch, then re-read the
   PR head and prove the closeout commit is its ancestor. Only then may an
   agent mark the PR ready for review and ask the owner for a merge decision.
10. After any merge, repeat the clean-and-synced-main start gate before new
    tracked work begins. Clean up only after the merge is verified, the
    candidate has no commits outside `origin/main`, no open PR references it,
    and local deletion precedes remote deletion.

## Authority and boundaries

- This review plan makes no branch, PR, merge, reset, force-push, ruleset
  change, or remote write.
- Preserve the current 21 local HQ commits. Do not squash, rebase, reset, or
  rewrite them merely to retrofit the policy.
- The owner remains the authority for a PR merge and for any later repository
  rule change.
- No database, daemon, client bridge, hosted CI, approval bot, or GitHub
  project board is part of this policy proof.

## Phase 1 — record the durable workflow

**State:** completed and merged through PR #16

### Definition of done

1. CIEL records an explicit owner decision for policy v0.1.
2. `AGENTS.md` contains only the short durable rule required at session start;
   `README.md` carries the full local-only and remote command workflow.
3. The CIEL test suite checks the committed policy artifact where deterministic
   coverage is appropriate, without attempting to automate GitHub decisions.
4. The policy distinguishes a remote seed push from every later change and
   makes the no-direct-`main` invariant observable to a future agent.

## Phase 2 — one-time HQ history-adoption PR

**State:** PR #16 merged; prepared closeout carried into Phase 3 follow-up

### Definition of done

1. Create `chore/adopt-local-main-history` at current local head `a3ee7da`
   without changing that commit or losing any of its 21 ancestors.
2. Push only that topic branch and open a PR from it to `main`; do not bypass
   the GitHub branch rule or force-push `main`.
3. The PR describes that it adopts the previously local-only HQ history and
   establishes the future policy, with the passed local evidence attached.
4. The owner reviews and decides whether to merge. A later merge may use a
   merge commit; after it lands, local `main` fetches and fast-forwards to the
   exact remote head.

## Phase 3 — reconcile the merge and prove the steady-state rule

**State:** partial; post-merge return passed, pre-merge closeout not proven

### Definition of done

1. Preserve the Phase 2 closeout event exactly as recorded and include it in a
   small follow-up PR; do not revise history to make it appear that it landed
   before PR #16 merged.
2. Add the remote-project start gate to the concise AGENTS rule and the exact
   `git status`/`fetch`/`switch main`/`pull --ff-only`/SHA-equality commands to
   README.md. Keep detailed procedure out of AGENTS.md.
3. Add the pre-merge closeout-on-PR-head rule to the README workflow and a
   deterministic test that prevents either policy boundary from disappearing.
4. Demonstrate that this follow-up branch began from clean, synced `main`
   (`40071bf` and divergence `0 0`) before any tracked Phase 3 change.
5. Push this single topic branch and open a PR to `main`; before the owner
   merges it, prepare, commit, and push its own closeout event onto that PR
   head.
6. After the owner merge, fetch and fast-forward local `main`, verify `HEAD`
   equals `origin/main`, verify a clean working tree, and only then mark the
   next workstream startable.
7. Clean up only branches that are no longer needed: after fetch, verify the
   candidate has no commits outside `origin/main` and no open PR references it;
   delete the local branch first, then delete its remote branch only when the
   owner-approved work no longer needs it. Keep any branch that carries an
   unmerged closeout or other unique evidence.

### Observed outcome

- Passed: the branch began from clean, synced `40071bf`; the policy artifacts
  and deterministic tests merged through PR #17; post-merge HQ `main` is
  clean and equals `origin/main` at `3c8f677`.
- Not passed: the final closeout was not on PR #17's head before the owner
  merge. Phase 3 therefore cannot establish the pre-merge closeout claim or
  branch-cleanup proof.

## Proof contract

| Claim | Evidence | Lane |
|---|---|---|
| Policy is durable and concise | tracked `AGENTS.md`, `README.md`, decision event, and deterministic test | Hard Gate |
| Existing HQ history is preserved | ancestor check from `a3ee7da` to PR head and `git log origin/main..PR-head` | Hard Gate |
| Protected `main` is respected | PR targets `main`; no direct or force push occurs | Hard Gate |
| Local-only stays simple | documented `--ff-only` local merge path, with no remote/PR requirement | Hard Gate |
| Remote work begins from canonical state | clean `main`, fetched `origin/main`, `--ff-only`, equal SHA, then topic-branch creation | Hard Gate |
| A PR cannot merge during closeout | observed GitHub draft state before the closeout is reviewed and pushed | Hard Gate |
| Closeout reaches review before merge | closeout event commit is an ancestor of the PR head re-read before merge | Hard Gate |
| Post-merge local state is unambiguous | fetched `main`, equal SHA, clean status, and prior topic branch no longer active | Hard Gate |
| Branch cleanup preserves evidence | empty `git log origin/main..<branch>`, no open PR reference, then local-before-remote deletion | Hard Gate |

## Phase 4 — draft-gated lifecycle proof (proposed; owner decision required)

**State:** implementation checkpoint prepared; owner review pending
**Authorization:** `evt_20260904T103716_pr_workflow_phase4_authorized`

### Definition of done

1. Record the PR #17 exception without changing historical claims, and update
   the durable workflow wording and deterministic tests for the draft gate.
2. From a clean, fetched `main` that equals `origin/main`, create one bounded
   topic branch for this proof, make the scoped tracked changes, and pass its
   applicable checks.
3. Push that branch and open exactly one **draft** PR to `main`; record the
   PR number, URL, draft state, and observed head revision in its closeout.
4. Present the Phase 4 closeout event for owner review; after approval, commit
   and push it to the draft PR head.
5. Re-read the remote PR and Git refs. Prove that it remains draft, its head
   includes the reviewed closeout commit, and the closeout commit is an
   ancestor of that head.
6. Mark the PR ready for review only after step 5. The owner alone decides
   whether and when to merge it.
7. After an owner merge, fetch and fast-forward local `main`; prove `HEAD`
   equals `origin/main`, divergence is `0 0`, and the working tree is clean.
8. Fetch again and clean only the finished proof branch: verify no commit lies
   outside `origin/main` and no open PR references it; delete local first and
   remote second when present. Verify clean, current `main` again afterward.
9. State the outcome per repository: HQ currentness is proven locally; any
   child project is called current only after its own independent gate passes.

## Explicit non-goals

- Rewriting the current local HQ history.
- Merging a PR without owner review.
- Changing GitHub's existing branch rules, adding a review quota, or creating
  CI, CODEOWNERS, a merge queue, a database, a daemon, or an automated bot.
- Altering CU12 source or implementing Windows COM, serial, RS485, or hardware
  behavior.

## Exit condition

Review and commit the Phase 4 implementation checkpoint, then push the proof
branch and open its one draft PR. Complete the draft-gated proof through
post-merge cleanup. Only then may the owner-provided Windows clone proof resume
as its separate paused workstream.
