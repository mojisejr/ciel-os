# CIEL — Report what is there but unread, not only what is absent

**Workstream:** `ciel-wake-blind-spots-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective

Two things exist in this repository that Wake does not report, and both were
found by a person noticing rather than by a report. They are the same defect
wearing two faces: **Wake reports the absence of a thing, and stays silent about
the presence of a thing it cannot read.**

1. Work that is finished and pushed but not merged is invisible. A pull request
   handed to the owner leaves no trace in any report.
2. A decision event that names its workstream but is shaped wrongly authorizes
   nothing, and Wake goes on saying no decision exists.

This workstream makes both visible **without moving CIEL's evidence boundary**.
No slice here calls GitHub, and no slice makes Wake touch the network.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | the CLI, the contract, and the plan | `.` |

This workstream touches nothing outside this repository.

## Where these came from

Both were found while planning `dac2-durian-smart-account-001`, in one session,
hours apart.

The owner opened GitHub for an unrelated reason and found PR 42 sitting ready for
review and unmerged for roughly six hours. It carried the records that make
`cu12-simulator-sprint-003` derive as finished. So Wake was reporting that
workstream as unfinished while the correction for it sat on a branch, and nothing
in any report connected the two. That is worse than a report being quiet: the
remedy for the very thing Wake complained about was already written and Wake
could not say so.

Then, on this HQ's own branch, an agent wrote a decision event authorizing the
DAC2 plan. It validated, committed, and pushed. `bun run wake` went on reporting
`needs-owner-decision`. The event had written `evidence.plan` as a list and named
neither `plan_revision` nor `slice`; `decisionAuthorizesPlan` requires all three
as scalars. The only signal available was a lifecycle that failed to change, and
the agent noticed it only because it happened to be watching for the change. Both
events are on `main`: `20260907T104500_dac2_plan_authorized.yaml` is the inert
one and `20260907T111500_dac2_decision_reshaped.yaml` restates it.

Neither defect is theoretical, neither was caught by a check, and both were
recorded in the DAC2 closeout at
`memory/events/2026/09/07/20260907T112500_dac2_plan_ready_for_merge.yaml`.

## Starting evidence

**Wake makes no network call.** Searching `src/` for `github`, `octokit`,
`fetch(`, `https://`, and `gh` returns nothing. Every fact comes from
`Bun.spawn(["git", "-C", path, ...])`.

**Wake never fetches, either.** No `git fetch` is invoked anywhere in `src/`. Every
merge-state claim reads `refs/remotes/origin/main` exactly as the last human or
agent left it. The wording already in the code is careful about this: the details
say "reachable from **fetched** origin/main", which quietly concedes that the
freshness is somebody else's doing. Wake never says how old that view is.

**The evidence boundary predates the pull-request workflow by nine days.**
`2050657` defined it on 2026-08-26, the repository's second day. `73a060c`
introduced the branch-first, pull-request workflow on 2026-09-04. When the
boundary was written, "repository files and local Git" described the whole truth
because there was no remote review gate. Nothing re-examined it when one arrived.

**The reporting shape this needs already exists twice.**
`readMergedStandingBranches` in `src/wake/read.ts` walks `refs/heads/hq`, tests
each against `refs/remotes/origin/main` with `merge-base --is-ancestor`, and
reports what it finds without attaching a judgement.
`unsliceableDeliveryCloseout` in `src/portfolio/read.ts` finds a closeout that
nearly qualifies and names its path in the lifecycle detail instead of dropping
it. Slice 2 generalises the first; slice 1 copies the second.

**The query proposed in slice 2 was tested against the case that motivated it.**
`git merge-base --is-ancestor 01d4eff a6ed0c5`, the tip of
`docs/sprint-003-record-repair` against `origin/main` as it stood while PR 42 was
open, exits non-zero. The branch existed both as a local head and as a
remote-tracking ref at that moment. The query would have reported it.

**Two local staleness signals exist and neither is obviously right.**
`git reflog show --date=iso refs/remotes/origin/main` lists when the ref last
moved and is ordinary Git evidence, but a fetch that finds nothing new writes no
entry, so it answers "when did origin/main last change" rather than "when did we
last look". The modification time of `.git/FETCH_HEAD` answers the second
question but is a filesystem observation rather than a Git one. Slice 2 chooses
between them from what each can actually support.

## Invariants

1. **The Wake evidence boundary does not move.** No slice adds a network call, a
   `gh` invocation, or a dependency on GitHub. If a slice cannot be delivered
   inside the boundary, it is not delivered and the plan is revised.
2. Wake stays read-only. Nothing here writes, fetches, or mutates a ref.
3. New reporting is derived, never stored. No state file, no cache.
4. Report the observation and leave the judgement to the owner, as the existing
   branch reporting already does. "This branch is not on origin/main" is a fact;
   "you forgot to merge it" is not Wake's to say.
5. A change to reporting comes with a deterministic test that fails without it.

## Execution slices and acceptance criteria

### 1. Name a decision event that nearly authorizes, instead of dropping it

When a workstream has events of `type: decision` with `outcome.status: decided`
that name it, and none satisfies `decisionAuthorizesPlan`, `needs-owner-decision`
must say so and name the file and the requirement it missed. Today the detail
says only that no decision exists, which is true of the join and false of the
repository.

The near-miss test is deliberately narrow: a decision, decided, naming this
workstream, on this lane. Anything looser would start guessing at intent.

`AGENTS.md` also gains the missing sentence. It currently says a decision
"authorizes the plan revision and slice its `evidence` names" without saying that
`evidence.plan`, `evidence.plan_revision`, and `evidence.slice` are required
scalar keys, so a writer has no way to get the shape right except by reading the
source. That omission is what produced the inert event.

**Done when** a test builds a workstream with a decision matching on every field
but one, and Wake's detail names the file and the field; the existing
`needs-owner-decision` wording is unchanged when there genuinely is no decision;
and `AGENTS.md` states the required keys.

### 2. Report delivered work that has not reached origin/main

Generalise the standing-branch walk to every ref under `refs/heads` and
`refs/remotes/origin`, excluding `origin/HEAD` and the target branch itself, and
report those not reachable from `refs/remotes/origin/main`. Reading
remote-tracking refs as well as local heads is what lets a branch pushed from
another machine appear, which is most of what the pull-request gap actually is.

Report alongside it how old this checkout's view of `origin/main` is, chosen from
the two signals named in the evidence above. Wake asserting merge state without
saying how stale its view might be is the quieter half of this defect, and a
report that says "as of a view eleven hours old" is honest where one that says
nothing is not.

Nothing here says the word "pull request", because Wake cannot see one and must
not imply otherwise. It reports branches, which is what it can observe.

**Done when** a test with a branch ahead of `origin/main` reports it and a test
with everything merged reports nothing; the view's age appears in the report; the
existing `mergedStandingBranches` behaviour is unchanged or is subsumed
deliberately; and `bun run wake` on a clean current `main` adds no noise.

## Out of scope

A `gh`-backed command that reads real pull request state, draft or ready,
reviews, and conflicts. It would cover a pull request opened from a machine this
checkout has never fetched, which slice 2 cannot see. It is excluded now because
slice 2 covers the case that actually occurred at no cost to the boundary, and
because adding CLI surface needs its own proof. **It returns when a pull request
is missed that slice 2 could not have shown**, which is the evidence that would
justify the surface.

Also out of scope: changing the pull-request workflow itself, adding CI, any
change to the event schema, and anything in `dac2-durian-smart-account-001`.

## Unknowns

- Whether `.git/FETCH_HEAD` is reliably present and meaningful in a worktree, and
  whether a reflog-based answer is defensible when a no-op fetch writes no entry.
  Slice 2 answers this from observation; if neither signal holds up, reporting
  no age is better than reporting a wrong one.
- Whether reporting every unmerged ref is quiet enough in ordinary use. A
  developer with several long-lived local branches may see noise where the owner
  of this HQ sees none. If it is noisy, narrowing is a revision, not a failure.
- Neither slice helps a session that never fetched. Wake cannot fetch without
  leaving the boundary, so the staleness report is the whole of the answer, and
  it depends on a human reading it.
- This plan asserts that both defects share one shape. That is an interpretation.
  If slice 1 and slice 2 turn out to need unrelated machinery, the framing was
  rhetoric and the closeout should say so.
