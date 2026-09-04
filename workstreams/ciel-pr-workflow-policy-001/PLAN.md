# CIEL — pull-request workflow policy and HQ transition

**Workstream:** `ciel-pr-workflow-policy-001`
**State:** paused
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective

Establish one simple, durable Git workflow for CIEL-bound projects: `main` is
the verified integration and recovery branch; every tracked change begins on a
short-lived topic branch. Local-only projects merge locally after checks, and
projects with a canonical remote merge through a reviewed pull request.

Apply that workflow once to adopt the current unpushed CIEL HQ history into a
pull request without rewriting or force-pushing any history.

## Observed starting point

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
4. In a repository with a canonical remote: fetch and fast-forward `main`,
   branch from it, run checks, push the topic branch, and open a PR to `main`.
   The owner reviews and authorizes the merge; merge commits are preferred so
   evidence that names existing Git revisions remains traceable.
5. The one permitted direct `main` push is the initial seed of an empty remote
   repository. The policy applies immediately after the canonical remote is
   established.
6. Read-only investigation and ignored machine-local material need no branch.
   A tracked plan, decision, closeout, documentation, or test change does.
7. Do not add required reviewers, CODEOWNERS, merge queue, or hosted CI rules
   until a measured workflow need proves them necessary.

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

**State:** implementation complete; closeout checkpoint prepared for owner review

### Definition of done

1. CIEL records an explicit owner decision for policy v0.1.
2. `AGENTS.md` contains only the short durable rule required at session start;
   `README.md` carries the full local-only and remote command workflow.
3. The CIEL test suite checks the committed policy artifact where deterministic
   coverage is appropriate, without attempting to automate GitHub decisions.
4. The policy distinguishes a remote seed push from every later change and
   makes the no-direct-`main` invariant observable to a future agent.

## Phase 2 — one-time HQ history-adoption PR

**State:** PR #16 opened; closeout checkpoint prepared for owner review

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

## Phase 3 — prove the steady-state rule

**State:** pending the adopted HQ PR merge and fresh local fetch

### Definition of done

1. The next bounded tracked change in CIEL or CU12 starts from a named topic
   branch, not `main`.
2. For a remote project, its PR and local Git evidence demonstrate the policy
   without introducing new automation.
3. A closeout records which policy parts are proven and any remaining
   owner-only merge or Windows-proof action.

## Proof contract

| Claim | Evidence | Lane |
|---|---|---|
| Policy is durable and concise | tracked `AGENTS.md`, `README.md`, decision event, and deterministic test | Hard Gate |
| Existing HQ history is preserved | ancestor check from `a3ee7da` to PR head and `git log origin/main..PR-head` | Hard Gate |
| Protected `main` is respected | PR targets `main`; no direct or force push occurs | Hard Gate |
| Local-only stays simple | documented `--ff-only` local merge path, with no remote/PR requirement | Hard Gate |
| Future remote work is reviewable | topic branch plus PR evidence on the next remote change | Pending proof |

## Explicit non-goals

- Rewriting the current local HQ history.
- Merging the transition PR without owner review.
- Changing GitHub's existing branch rules, adding a review quota, or creating
  CI, CODEOWNERS, a merge queue, a database, a daemon, or an automated bot.
- Altering CU12 source or implementing Windows COM, serial, RS485, or hardware
  behavior.

## Exit condition

Prepare a CIEL closeout event for owner review only after the adopted HQ PR is
merged and fetched locally. The owner-provided Windows clone proof remains a
separate paused workstream.
