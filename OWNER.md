# Owner Operating Contract

**Version:** 0.1
**Status:** Experimental
**Authority:** Human owner
**Applies to:** CIEL-operated work across supported clients

## Purpose and boundary

This file records confirmed observable working patterns and the response rules
the owner wants a coding agent to apply. It is not a biography, personality
profile, psychological diagnosis, chat history, preference catalogue, or
personal-memory system.

An agent may observe behavior and suggest an interpretation. It must not add,
amend, generalize, or remove an owner rule from inference. Only an explicit
owner decision changes this contract.

## Confirmed pattern 1: Progress before meta-optimization

The owner can productively pursue root causes in depth. The confirmed failure
mode is narrower: a local problem encountered during committed product work can
be reframed as a system or tooling problem and absorb effort while the committed
outcome stops moving. An agent must not inherit that failure mode and perform it
on the owner's behalf.

### Establish the main line

A committed outcome exists only when the owner explicitly states or authorizes
it in the current request or in a recorded decision/plan. Do not infer a
commitment from preference, chronology, proximity, or what seems useful. If the
current commitment is unclear, ask before choosing one.

A defect required to meet the committed outcome's acceptance criteria is
main-line work. A CIEL, tooling, process, refactoring, or infrastructure matter
outside those criteria is a side issue.

### Classify a side issue

Before changing it, determine:

1. Does it block the current committed outcome?
2. Is there a safe workaround?
3. Would deferral create serious or irreversible harm?
4. If a fix is necessary, what is the minimum fix that returns work to the main
   line?

Then respond as follows:

- If it does not block, has a safe workaround, and creates no serious harm,
  stop investigating or fixing it, defer it, report it only when useful, and
  continue the committed outcome without asking for redundant permission.
- If it blocks and a minimum fix is clear, already authorized, non-destructive,
  and needs no new decision, make that minimum fix, report it, and return to the
  committed outcome.
- If blocker status, consequence, scope, or authority is unclear, stop and ask
  the owner with the evidence already gathered.
- If it presents serious or irreversible risk, stop the affected execution and
  surface the risk without exposing secrets or taking an unauthorized external
  action.

There is no quick-fix exception for a non-blocking CIEL defect. Estimated effort
does not turn a diversion into main-line work.

### Serious means serious

Serious or irreversible harm includes imminent data loss, credential or secret
exposure, privacy breach, destructive migration or corruption, an irreversible
external action, or execution without owner authority.

Technical debt, code smells, naming, wording, refactoring opportunities,
optional tooling, and architecture that could be improved are not serious by
default.

### Defer without inventing a system

CIEL already has sufficient vocabulary. Do not create a `PARK` state, command,
field, queue, issue, or workstream automatically.

- Use `deferred` as ordinary prose.
- If a side issue has durable future value, put one concise entry and its safe
  workaround in the current closeout's existing `unresolved` list.
- Use `next_action` only when the item truly is the next executable action.
- Do not use workstream state `paused` for one side issue.
- Do not persist a trivial observation that has no future value.

## Change control

Every change follows:

```text
Observe -> suggest interpretation -> owner explicitly confirms -> record
```

Only the owner may activate, amend, adopt, supersede, or roll back this
contract. Agent self-evaluation is evidence, not a verdict.

Version 0.1 is authorized by
`memory/events/2026/09/08/20260908T220051_owner_operating_contract_slice1_authorized.yaml`.
