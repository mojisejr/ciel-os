# CIEL — Retain and close the cross-machine handoff experiment

**Workstream:** `ciel-cross-machine-handoff-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and authority

Deliver the evidence already obtained and end this exploratory workstream at
its owner-chosen checkpoint. Completion of this revision means evidence delivery
and withdrawal of the unfinished proposal, not completion of revision 0.1's
three slices or a Mac–Windows proof.

On 2026-10-04 the owner chose to retain the evidence, return to the base, and
stop this experiment. Windows publication is authorized through a PR for
owner-reviewed merge and later Mac synchronization. This delivery stops at
owner review; it does not move either checkout or merge any repository.

The owner now intends to operate Windows work from the Mac through the host's
device-control capability. This is owner-reported context, not a CIEL capability
or SMC readiness proof. The proposed offer/receipt contract was never adopted.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | publish evidence and close this exploratory scope | `.` |

This revision does not close, authorize, or change `smc-v2-app-001` or
`ciel-windows-portability-001`. They retain their own plans and decisions.

## Historical scope and preservation

Revision 0.1 is reconstructable with:

```text
git show 7d386587c0960af98154ceabd4617839e74e038d:workstreams/ciel-cross-machine-handoff-001/PLAN.md
```

Its slice 1 produced the plan. Its slice 2 produced partial scripted local
Git experiments: failed-result transport, incomplete publication and repair,
receipt retry, missing offers, incorrect references, and changed scope after
an offer. Slice 2's full DoD did not pass. Slice 3 never ran. No contract,
event type, CLI behavior, source change, or SMC change resulted.

The six original events remain immutable. EVIDENCE.md explains what published
Git preserves and which original artifacts remain local. FIXTURE_REPLAY.py
provides a standard-library-only runner for comparable mechanical scenarios;
it does not recreate original hashes or establish production enforcement.

## Delivery slice

### 1. Publish evidence and close the withdrawn experiment

Scope: this revised plan, an owner closure decision, a final closeout, and the
two supporting files above in this workstream's existing directory. Keep prior
events and commits; do not publish nested fixture Git repositories, long
transcripts, credentials, disposable session locators, or absolute host paths.

Definition of done:

- Preserve actual outcomes, the failed fixture setup and correction, unknowns,
  and the original plan through Git and append-only events.
- Explain how a future reader can inspect evidence and rerun comparable
  fixtures without ignored original directories. Exact old objects/transcripts
  remain explicitly local-only.
- Check artifact structure, references, replay behavior, and common credential
  and session-locator patterns; report actual checks and platform limits.
- Obtain verification of the exact pushed candidate head where supported Bun
  is available. Windows Wake remains a separate limitation.
- Create a draft PR; commit/push a final closeout naming revision 0.2 slice 1
  and observed PR/head; verify containment on PR head, update its description,
  and offer owner review. No merge, cleanup, or checkout switch in this delivery.

## Lifecycle and truthful closure

The plan stays active while the bounded evidence delivery awaits review.
Its final closeout uses ready-for-owner-merge and names this revision's sole
slice, following existing semantics in src/portfolio/read.ts. Paused still
appears in attention; an arbitrary outcome word would be ignored.

After owner merge, fetched ancestry determines state. Clean current main with
topic refs removed derives completed and is excluded from attention. A merged
unsynchronized checkout derives merged-needs-sync and is also excluded, but
is not evidence that sync finished. Clean current main retaining the topic
ref derives merged-needs-cleanup and can remain in attention until README's
cleanup gate is satisfied. No new lifecycle status or code change is needed.

A later owner may commission a new scope/revision using the evidence. Old
decisions and next actions do not authorize future work; it requires a new
explicit decision and current repository checks.

## Remaining boundaries

Supported Windows Bun/dependencies, Wake/check, child bindings/assets, actual
Mac–Windows handoff, fresh-agent behavior, competing writers, unrelated HQ
integration, and deployed-rule rollback remain unproved. Local Git cannot
establish remote liveness or unpublished work. No lock or automatic event
gate exists. This delivery claims no SMC, portability, or device-control readiness.

Next action: owner reviews this PR. After any owner merge, independently sync
Mac and Windows and complete allowed cleanup before new tracked work.
