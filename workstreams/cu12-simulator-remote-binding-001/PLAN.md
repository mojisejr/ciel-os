# CU12 Simulator — private remote binding

**Workstream:** `cu12-simulator-remote-binding-001`
**State:** paused
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective

Promote the existing local CU12 Simulator Git history to the private canonical
repository `github.com/mojisejr/cu12-simulator`, then record and verify that
remote identity in CIEL. Make the current CIEL HQ checkpoint available through
its already-declared canonical remote as part of the same recoverability
boundary.

## Why this is a separate workstream

The completed CU12 protocol and PTY workstreams remain historical local-only
proofs. Changing a project from `local_only` to a remote canonical identity is
a new external commitment and must not rewrite those plans or closeouts.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | HQ whose tracked evidence must be remotely current | `.` |
| `cu12-simulator` | child whose existing history becomes a private remote repository | `checkouts/cu12-simulator` |

## Authority and boundaries

- This review plan does not create a repository, configure a remote, or push.
  A decision must explicitly authorize those external writes for its exact
  plan revision and phase.
- Preserve the child history rooted at
  `df032d3947d836e8f4a502ff4cdb4f200af787fb`; do not rewrite it.
- The target is private `github.com/mojisejr/cu12-simulator` on branch `main`.
- Change `projects/cu12-simulator/project.yaml` only after the child `origin`
  actually matches the created canonical remote. Remove `local_only: true`
  rather than claiming both identity modes at once.
- Do not commit `.assets`, `.env`, credentials, or machine-local bindings.
- No database, daemon, CIEL write command, client bridge, or Windows COM
  capability belongs here.

## Phase 1 — canonical remote checkpoint

**State:** remote binding complete; closeout checkpoint prepared for owner review

### Definition of done

1. A private `mojisejr/cu12-simulator` repository exists and `origin/main`
   contains the existing child commit `df032d3` without history rewrite.
2. The child local checkout has `origin` configured to exactly
   `github.com/mojisejr/cu12-simulator`, is clean, and tracks `main`.
3. The committed CU12 project identity names that canonical remote and no
   longer declares `local_only: true`; project validation and Wake accept the
   matching remote.
4. The HQ current `main` checkpoint is pushed to its declared origin and the
   observed divergence from `origin/main` is `0 0` after fetch/verification.
5. A closeout event records the two remote heads, commands/checks, and the
   fact that the private remote contains no ignored assets or environment data.

### Proof contract

| Claim | Evidence | Lane |
|---|---|---|
| CU12 remote preserves local history | `git merge-base --is-ancestor df032d3 origin/main` | Hard Gate |
| CIEL identity matches local checkout | project validation and `bun run wake` | Hard Gate |
| HQ is remotely current | fetched divergence check reports `0 0` | Hard Gate |
| Sensitive/local files did not leak | tracked-file and ignore checks | Hard Gate |

### Explicit non-goals

- A Windows clone or Windows COM implementation.
- Any transfer of `.env` or other secrets.
- Automatic background pushing; remote currency is an explicit checkpoint
  requirement, not an unreviewed daemon action.

## Exit condition

Prepare a closeout event for owner review before the local closeout commit.
Only then may the Windows portability workstream rely on these two remotes.
