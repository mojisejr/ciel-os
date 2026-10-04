# Retained evidence and comparable fixture replay

This archives a stopped experiment, not an adopted operating contract.
Read plan revision 0.2 and its owner closure decision before further work.

## What Git preserves

Six original YAML events under `memory/events/2026/10/04/` retain observations,
fixture revisions/hashes, the failed setup and correction, unknowns, and advice
as recorded then. Their next actions are superseded, never edited retroactively.

| Record suffix | Evidence obtained | Limit |
|---|---|---|
| `cross_machine_handoff_plan_authorized` | revision 0.1 planning authority | not implementation authority |
| `cross_machine_handoff_plan_prepared` | review plan and check limits | Windows Wake/check unavailable |
| `cross_machine_handoff_fixture_start_authorized` | incremental local fixture scope | no live contract adoption |
| `cross_machine_handoff_fixture_step1` | unmerged closeout, failed-result transport, independent child fetch | one Windows host, script only |
| `cross_machine_handoff_fixture_step2` | incomplete publication and repair | first fixture setup was wrong and is recorded |
| `cross_machine_handoff_receipt_and_stale_probes` | receipt retry, absent/wrong references, late scope changes | no fresh-agent/edit enforcement |

The original revision 0.1 plan is retained at
`7d386587c0960af98154ceabd4617839e74e038d`. Prefer a merge commit as README
specifies: squash/rebase would not retain every original revision named by
these historical events.

## What remains local-only

Original scripts, JSON results, long transcripts, and nested Git repositories
remain ignored under `.local/cross-machine-handoff-proof/` on Windows. This PR
does not publish them. Historical fixture hashes identify objects in those
repositories, not CIEL HQ. Script hashes cannot reconstruct script contents.

A fresh clone can reconstruct recorded semantic outcomes and the old plan,
but cannot reproduce exact old object IDs or audit every original command
from hashes alone. No old event is amended to pretend those artifacts transferred.

## Comparable replay from published files

`FIXTURE_REPLAY.py` is a consolidated supporting runner, not a byte-for-byte
copy of the originals or a CIEL event writer. Python's standard library and
Git suffice. It creates new local fixture repositories, never contacts a
network, and never writes into real CIEL events. Fixture `.yaml` files contain
JSON, a YAML subset, and are explicitly fixture data.

From an HQ clone choose a new ignored output directory:

```text
python workstreams/ciel-cross-machine-handoff-001/FIXTURE_REPLAY.py --output .local/handoff-replay
```

Use `python3` if that is the host's Python command. Existing or non-ignored
output directories are refused. Results stay inside that ignored directory;
choose another new directory for another run. No recursive cleanup occurs.

The runner measures failed-result transport, partial publication/repair,
receipt retry, incorrect references, missing offers, and late scoped changes.
It checks working-tree preservation during read-only probes. New hashes depend
on the run and are not historical proof IDs. A pass describes script/Git
assertions, not agent obedience, actual Mac–Windows continuity, locking, or SMC.

The step-2 event retains the original push mistake: exit 128 occurred after
publication to another configured destination. The runner uses one explicit
nonexistent local destination and direct remote checks; an error exit alone
never substitutes for observing publication state.

## Future use

Read the closure decision and final closeout first. Future scope requires a
new owner decision. Historical next actions and this runner do not authorize
automatic continuation of the withdrawn proposal.
