# CIEL — pull-request workflow policy and HQ transition

**Workstream:** `ciel-pr-workflow-policy-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** 3
**Execution state:** executing
**Parallelism:** none

## Objective

Establish one simple, durable Git workflow for CIEL-bound projects: `main` is
the verified integration and recovery branch; every tracked change begins on a
short-lived topic branch. Local-only projects merge locally after checks, and
projects with a canonical remote merge through a reviewed pull request.

Apply that workflow once to adopt the unpushed CIEL HQ history into a pull
request without rewriting or force-pushing any history, then prove the
post-merge return-to-main protocol before starting any subsequent tracked work.

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

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | Policy home and one-time history-adoption PR target | `.` |
| `cu12-simulator` | First child to follow the remote-project rule after its seed push | `checkouts/cu12-simulator` |

## Policy v0.1 proposed for decision

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
8. Before the owner merges a PR, its phase closeout event must be committed and
   pushed on that PR head. After any merge, repeat the clean-and-synced-main
   start gate before new tracked work begins.

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

**State:** implementation checkpoint prepared; owner review pending

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

## Proof contract

| Claim | Evidence | Lane |
|---|---|---|
| Policy is durable and concise | tracked `AGENTS.md`, `README.md`, decision event, and deterministic test | Hard Gate |
| Existing HQ history is preserved | ancestor check from `a3ee7da` to PR head and `git log origin/main..PR-head` | Hard Gate |
| Protected `main` is respected | PR targets `main`; no direct or force push occurs | Hard Gate |
| Local-only stays simple | documented `--ff-only` local merge path, with no remote/PR requirement | Hard Gate |
| Remote work begins from canonical state | clean `main`, fetched `origin/main`, `--ff-only`, equal SHA, then topic-branch creation | Hard Gate |
| Closeout reaches review before merge | closeout event commit is an ancestor of the PR head re-read before merge | Hard Gate |
| Post-merge local state is unambiguous | fetched `main`, equal SHA, clean status, and prior topic branch no longer active | Hard Gate |
| Branch cleanup preserves evidence | empty `git log origin/main..<branch>`, no open PR reference, then local-before-remote deletion | Hard Gate |

## Explicit non-goals

- Rewriting the current local HQ history.
- Merging a PR without owner review.
- Changing GitHub's existing branch rules, adding a review quota, or creating
  CI, CODEOWNERS, a merge queue, a database, a daemon, or an automated bot.
- Altering CU12 source or implementing Windows COM, serial, RS485, or hardware
  behavior.

## Exit condition

Commit and push the reviewed implementation checkpoint, then open the one
follow-up PR. Prepare, review, commit, and push the final Phase 3 closeout on
that PR before owner merge. After the merge and verified local return to
`main`, the owner-provided Windows clone proof may resume as its separate
paused workstream.
