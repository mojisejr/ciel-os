# CIEL — Say only what is true about what is done

**Workstream:** `ciel-report-fidelity-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.3
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective

Close the defects the two-session run exposed, and the two found while acting on
its results, all of which concern the same thing: whether the report a session
reads, and the record behind it, tell the truth about work that has already
happened.

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

Revision 0.3 adds two more, both found by delivering slice 1 rather than by
reasoning about it. Neither is a new kind of defect; both are the same failure
this workstream is named for, found in places it had not looked.

- **A closeout that names no slice is treated as this workstream's final
  delivery.** Observed on a clean, current `main` at `154b34e`: this workstream
  declares slices 1, 2 and 3, has delivered one of them, and Wake reports it as
  `completed` and raises no attention for it. The cause is in
  `isTerminalCloseout`: a closeout naming a slice must name the last declared
  one, but a closeout naming no slice falls through to the phase test and passes
  it, so this workstream's two opening closeouts each count as its last. This is
  worse than the defect slice 1 fixed. That one said work was unfinished when it
  was done; this one says work is done when two thirds of it has not started,
  which is the direction that gets a workstream abandoned.
- **`README.md` states things about CIEL that stopped being true.** It is not
  incidental documentation: `AGENTS.md` makes reading it step 2 of Wake, so a
  cold session meets it before anything else. Four claims were checked against
  the repository and are false or incomplete, listed in slice 4.

The first belongs in slice 2, which is already about what a closeout may say
about its own outcome. The second is its own slice, because it changes no code.

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

   The name collision is how this surfaced, but it is not the defect. The
   cleanup check assumes one branch belongs to one workstream's delivery, and a
   standing branch carries several by design, so no single workstream's closeout
   can decide whether it may be removed. Attributing it to one of them is a
   category error that a unique name would only have hidden.

   **Do not attribute a shared branch to one workstream.** When the topic branch
   a closeout records is also recorded by another workstream's closeout, skip
   the cleanup check for it. This is read from the event ledger that already
   exists, needs no new evidence field, and does not depend on the `hq/` naming
   convention, so it keeps working if the convention changes.

   Recording the branch tip at closeout time, so that a ref no longer pointing
   at it is recognised as a different branch, remains available and would also
   cover an ordinary topic branch whose name is reused. It is deliberately not
   taken now: ordinary branch names are topic-specific and no collision between
   them has been observed. Take it if one is.
3. Skipping the check above removes the only reminder that a merged standing
   branch still exists, because Wake reports a standing branch's age only while
   the checkout is on it. Report any `hq/*` branch that exists and is already
   reachable from fetched `origin/main`, so a forgotten one stays visible from
   `main`. Derived from local Git; nothing is stored.
4. `README.md` currently sends every HQ write to a standing branch. The standing
   branch exists for rounds with several sessions; a single-session change needs
   no such branch. Saying so is both truer and makes the collision rarer.

**Done when** a session that has just merged its own pull request is not told to
open one; a merged workstream stays `completed` while an unrelated branch of the
same name exists; and a forgotten merged standing branch is still reported from a
clean `main`. All three are checked by test rather than by inspection.

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
4. Stop a closeout that names no slice from counting as the final delivery of a
   plan that declares slices. A workstream that declares slices is finished by a
   closeout for its last slice; a closeout that names none is saying something
   about the workstream, not delivering it. The permissive fall-through exists
   for a plan that declares no slices at all, and that case keeps it.

   Two ways a workstream can wrongly leave the machinery are already known: the
   undefined vocabulary above lets one disappear, and this lets one appear
   finished. Both are read from the same event, so both are fixed where that
   event is interpreted.

**Done when** `bun run wake` derives a delivery state for every workstream whose
work has actually merged, an unrecognised status is reported rather than
ignored, and a workstream with undelivered slices is not reported as complete.

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

### 4. Make `README.md` say what CIEL currently is

Runs last, after slice 3 has made its own edit to the same file, so the file is
rewritten once rather than twice. Every claim below was checked against the
repository at `154b34e`; each is corrected to what the repository shows, and
nothing is added that a file or local Git cannot establish.

1. `README.md:17` says no second client bridge exists. `CLAUDE.md` exists, and
   `AGENTS.md:3` names Codex and Claude as its clients. The same claim appears
   again at `README.md:39` as "the only current integration is the
   Codex-oriented, local read-only CLI".
2. `README.md:45` describes `AGENTS.md` as the Codex bootstrap contract. It is
   the shared contract for both clients, and `CLAUDE.md` is missing from the
   repository listing entirely.
3. That listing shows `src/` as `events/` and `wake/`. It also contains
   `portfolio/`, `projects/`, `cli.ts`, and `index.ts`.
4. The status paragraph names the plan-first portfolio flow as what CIEL is
   currently proving. That proof is delivered; what is being proved now is
   several sessions at once and the fidelity of the report they read.

A statement that was true when written and has since been overtaken is
corrected, not deleted, so the direction remains legible. The genesis documents
are historical records and are not edited.

**Done when** no claim in `README.md` about what exists is contradicted by the
repository, checked item by item against the file rather than by impression.

## Boundaries and delivery

- No pilot code changes. The pilots' child work is merged and correct; only the
  HQ record of one of them is wrong.
- No change to how sessions are run, and nothing that records or addresses a
  session.
- If a remedy turns out to need a schema change or stored state, it is not taken
  in this workstream; it is recorded and planned separately.
- One session at a time. This workstream declares no parallelism, and it should
  not be run concurrently with work that touches `ciel-os` source.
