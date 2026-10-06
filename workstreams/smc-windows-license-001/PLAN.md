# SMC — Retire the separate Windows-license proposal after scope consolidation

**Workstream:** `smc-windows-license-001`
**State:** completed
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner authority

Close only the separate planning lane by transferring its intended work into
`smc-v2-app-001` revision 0.7 slice 11. On 2026-10-05 the owner asked to combine
the workstreams and then explicitly instructed "รวมเลยครับ". No independent
implementation was performed in this lane. Completion of revision 0.2 means
local scope transfer and retirement of a duplicate proposal, not completion
of revision 0.1's five execution slices or Windows/hardware acceptance.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | preserve planning history and this retirement checkpoint | `.` |

Product execution belongs solely to the receiving plan. This retired lane
makes no claim over the application or simulator repositories.

## Historical proposal and scope mapping

Revision 0.1 is preserved in local Git:

```text
git show edb397003a03741f0d648be6ad829aff63323f64:workstreams/smc-windows-license-001/PLAN.md
```

| Former revision 0.1 slice | Receiving revision 0.7 step |
|---|---|
| 1: owner issuer/menu | smc-v2-app-001, 11.1 |
| 2: Windows key and recovery | smc-v2-app-001, 11.2 |
| 3: matching builds and rollback | smc-v2-app-001, 11.3 |
| 4: owner Windows simulator walkthrough | smc-v2-app-001, 11.4 |
| 5: final evidence and hardware starting point | smc-v2-app-001, 11.5 |

The original opening and planning closeout remain unchanged:

- `memory/events/2026/10/05/20261005T144047_smc_windows_license_workstream_opened.yaml`
- `memory/events/2026/10/05/20261005T144640_smc_windows_license_plan_prepared.yaml`

## Retirement slice

### 1. Transfer the plan and close the separate planning lane

Definition of done:

- The receiving plan carries all five deliverable/DoD groups, secret/recovery
  rules, rollback, baseline references and unresolved items; slices 1-10 are
  not renumbered or rewritten as incomplete work.
- This plan is retained as history with an explicit retirement boundary,
  while the receiving SMC workstream stays active and idle before execution.
- Append the owner's consolidation decision and factual closeouts. Do not
  amend committed events or report execution of the withdrawn five slices.
- Wake validates the plans/events and reports no application/simulator scope
  conflict between these workstreams. Run the relevant HQ checks.

## Delivery and next action

Retirement is recorded locally on the existing planning topic branch. Remote
publication and merge remain separate owner-authorized actions. No repository
is deleted and no source, key, license, MSI installation or patient data is
changed by this scope transfer.

Continue at `workstreams/smc-v2-app-001/PLAN.md` revision 0.7 step 11.1 when
execution is requested. All unfinished product work and previous limitations
live there; this lane has no remaining product execution.
