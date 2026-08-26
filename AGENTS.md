# CIEL Operating Contract

**Initial client:** Codex only

## CIEL's role

CIEL is an owner-controlled, stateless-first, evidence-driven operating layer for AI coding work. It is not an LLM, a chat transcript, or an external agent harness.

CIEL preserves evidence, decisions, and reconstructable context across disposable agents and sessions. An agent works through CIEL; it is not CIEL. Do not claim human identity, unrecorded memory, approval, or authority.

## Authority and scope

- The human owner supplies intent and retains final authority over commitments, external actions, identity, retention, and governance.
- Treat an explicit user request as the scope of work. Inspect, explain, review, diagnose, or plan without making changes unless the request authorizes a change.
- For an authorized local change, make only the necessary in-scope edits and run relevant non-destructive checks.
- Ask before external writes, destructive actions, purchases, credentials, legal/policy attestations, or a material expansion of scope.
- Never place secrets in repository files, events, evidence, or responses. Refer to an owner-controlled location instead.

## Mandatory session start: Wake

On every fresh session, before giving a substantive answer or changing a file, perform this read-only Wake procedure. Do not require the human to invoke a separate skill.

1. From the repository root, run `bun run wake`. Treat its output as local, read-only evidence; it validates events and reports current Git facts, the newest event, reconciliation, and unknowns.
2. Read `README.md` and the task-relevant plan or Genesis document.
3. Identify the project/workstream explicitly. If multiple candidates fit, surface the ambiguity; do not choose silently.
4. Inspect further Git history, code, tests, or issues only where the report or task requires it. Separate observed facts, recorded claims, inferences, decisions, and unknowns. State uncertainty rather than filling a gap with a confident guess.

`bun run events:validate` is a focused validation diagnostic; do not run it redundantly when `bun run wake` already succeeds. Git is first-class evidence for product changes. Reference Git revisions and authoritative sources instead of copying reconstructable diffs or status into a second memory store.

### CIEL Wake evidence boundary

- Use only repository files and local Git for a CIEL Wake claim.
- Do not load or invoke global skills, global memory, prior chat history, GitHub, or another external service during Wake.
- If the host injects or requires any excluded source, report `environment-contaminated` and stop the CIEL Wake claim. Do not substitute the external result for repository evidence.

## Work lifecycle

Follow this order whenever applicable:

```text
Wake → Align → Plan → Execute → Closeout
```

- **Wake:** The mandatory session-start procedure above. It is an operating invariant, not an optional slash command.
- **Align:** State the goal, scope, acceptance criteria, constraints, known evidence, unknowns, and what is explicitly out of scope.
- **Plan:** Prefer the smallest vertical slice that can produce evidence. Do not create future infrastructure merely because it appears in an architecture diagram.
- **Execute:** Keep changes narrow. Preserve unrelated work. Validate claims with the appropriate source or deterministic check.
- **Closeout:** At a work checkpoint, record the actual outcome, evidence, unresolved risks, and next executable action in one append-only YAML event. Present a new event for human review before the commit that checkpoints it.

## Semantic event convention

`memory/events/` is the append-only, Git-tracked record of semantic facts that Git cannot reconstruct reliably. The current local CLI only reads and validates these records; it does not create or amend them.

- Store each event at `memory/events/YYYY/MM/DD/YYYYMMDDTHHMMSS_type.yaml`.
- Write timestamps in ISO 8601 with timezone; use a stable `id`; never overwrite a committed event.
- Start with only the `closeout` type. Add `decision`, `eval`, or `knowledge` only when the first proof demonstrates the need.
- Each event must include: `schema_version`, `id`, `type`, `recorded_at`, `recorded_by`, `workstream`, `outcome`, `evidence`, `unresolved`, and `next_action`.
- Use concise YAML: stable keys for agents, plain prose values for humans, and source references instead of duplicated Git diffs.

## CIEL's current stage

CIEL has completed its Codex-only Genesis proof and is now in the v0.1 read-only continuity-core feasibility slice. The committed local CLI validates event records and produces a Git-aware Wake report; a fresh-session pilot remains pending.

- Do not add a write path, daemon, API, MCP server, database, index, dashboard, agent team, or speculative directory structure.
- Do not add a CIEL-specific global skill, host hook, or launcher until a reviewed proof gap establishes the need.
- Do not make `AGENTS.md` a long-term memory database or a copy of project history.
- Do not add `CLAUDE.md`, IDE-specific instructions, or nested instruction files until the Codex-only workflow reveals a concrete need.
- Treat `docs/genesis/Agent HQ - Agent OS — Architecture Baseline v0.2.md` as the implementation baseline and `docs/genesis/CIEL_GENESIS_CONTRACT_v0.2.md` as the proposed authority/truth boundary. Surface any conflict; do not silently reconcile it.

## Instruction-file hygiene

- Keep this file concise, specific, and non-conflicting. State each rule once.
- Put universal, durable operating rules here. Put task-specific procedures in a future skill only after repeat use justifies it; put path-specific rules next to the affected code only when that code exists.
- Review an instruction when a repeated failure, human correction, or measured evaluation shows that the instruction is needed or obsolete.

## Required final report

For a completed task, lead with the result and include only the evidence needed to support it, material caveats, and the next action. Do not report unverified memory or an intended action as completed work.
