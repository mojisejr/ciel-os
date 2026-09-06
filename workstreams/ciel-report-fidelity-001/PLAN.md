# CIEL — Say only what is true about what is done

**Workstream:** `ciel-report-fidelity-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective

Close the five defects the two-session run exposed, all of which concern the
same thing: whether Wake's report, and the record behind it, tell the truth
about work that has already happened.

They are ordered here by whether they can make a session **act** wrongly, not by
how visible they are. A report that is merely noisy wastes attention. A report
that states something untrue about what is already done causes work to be
repeated or abandoned.

## Where these came from

`ciel-parallel-lanes-001` ran two cold sessions against one checkout and
delivered successfully. Three defects were recorded in its slice 2 closeout, and
two more were found immediately afterwards while acting on that closeout's own
next action, one of which refuted a conclusion the closeout had already stated.
The correction is recorded at
`memory/events/2026/09/06/20260906T203359_stale_advice_conclusion_refuted.yaml`.

Two of the five were introduced by that workstream's own slice 1. That is stated
plainly rather than softened: the reporting it added is what made the
contradiction possible, and the branch convention it introduced is what makes
the name collide.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | the report, the record, and the conventions being corrected | `.` |

## Invariants

- No new state store, no session identity, no daemon, no schema change. Every
  remedy must be derivable from local Git and committed files.
- No committed event is edited. Corrections are new events.
- A remedy may reduce what Wake asserts. It may not add a claim Wake cannot
  establish.
- Existing tests must keep passing, and each changed behaviour gains one.

## Execution slices and acceptance criteria

### 1. Stop reporting a finished instruction as a current one

Two defects, one shape: Wake states something untrue about what has already been
done, and a session acted on it.

1. A record's `next_action` is presented alongside a lifecycle that may already
   contradict it. Mark a record whose own commit is reachable from fetched
   `origin/main`, so a reader can tell advice that has been carried out from
   advice that has not. `deriveTerminalLifecycle` already performs exactly this
   test for terminal closeouts; nothing new is needed to establish it. What the
   marking should look like is open: annotate, or suppress, or report both the
   advice and its state. The narrowest option that removes the contradiction
   wins.
2. A closeout's recorded topic branch is resolved by name, so a new branch that
   reuses a name inherits the identity of an old one. Demonstrated: with a clean
   current `main` and a newly opened `hq/20260906` holding one unrelated commit,
   two merged and complete workstreams both reported `needs-reconciliation`.
   Either the identity must be the commit rather than the name, or the recorded
   branch must be disambiguated. Prefer whichever leaves existing events valid.
3. `README.md` currently sends every HQ write to a standing branch. The standing
   branch exists for rounds with several sessions; a single-session change needs
   no such branch. Saying so is both truer and makes the collision rarer.

**Done when** a session that has just merged its own pull request is not told to
open one, and a merged workstream stays `completed` while an unrelated branch of
the same name exists. Both are checked by test rather than by inspection.

### 2. Define what a closeout may say about its own outcome

`outcome.status` is required by `AGENTS.md`, its permitted values are documented
nowhere, and nothing validates them. Ninety-eight committed events use eighteen
distinct values in two casing styles while the code recognises two. One cold
session chose the plain word `completed` and its workstream silently left the
delivery machinery.

1. Document the values that mean something and what each causes. A word the code
   ignores must be visibly different from one it acts on.
2. Validate. A previous workstream already established that failing on existing
   events would break the ledger, so this warns rather than fails, and the
   warning names the file.
3. Repair `pilot-report-status-flag-001`, which is still outside the machinery.
   Its work is genuinely merged, so the repair is to make the record say so in a
   form the code recognises, by a new event and a plan correction rather than by
   editing what is committed.

**Done when** `bun run wake` derives a delivery state for every workstream whose
work has actually merged, and an unrecognised status is reported rather than
ignored.

### 3. Stop the two halves of the report contradicting each other

1. `deriveAttention` counts overlap without consulting decisions, while
   `deriveLifecycle` does. Observed during the run: two workstreams reported as
   conflicts by one half and as authorized by the other, for the same revision
   and slice. Attention must respect a decision the owner has already recorded.
2. Record the working rule the standing branch needs and does not have. Under one
   shared branch the lanes never merge, so the loud merge conflict that separate
   branches would have produced does not exist; a second writer to the same file
   silently replaces the first, and Git reports one modified file with no
   indication that anything was lost. Demonstrated in a scratch repository. The
   rule that follows is that a shared file such as `AGENTS.md`, `README.md`, or
   anything under `src/` is not edited while another lane is live. Staging only
   your own paths does not help, because the loss happens at the write.

**Done when** an owner-approved overlap raises no conflict, and the shared-file
rule is written where a cold session will meet it.

## Boundaries and delivery

- No pilot code changes. The pilots' child work is merged and correct; only the
  HQ record of one of them is wrong.
- No change to how sessions are run, and nothing that records or addresses a
  session.
- If a remedy turns out to need a schema change or stored state, it is not taken
  in this workstream; it is recorded and planned separately.
- One session at a time. This workstream declares no parallelism, and it should
  not be run concurrently with work that touches `ciel-os` source.
