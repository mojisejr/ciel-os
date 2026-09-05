# CIEL Operating Contract

**Clients:** Codex and Claude. This file holds the shared operating contract; `CLAUDE.md` points to it and holds nothing else.

## CIEL's role

CIEL is an owner-controlled, stateless-first, evidence-driven operating layer for AI coding work. It is not an LLM, a chat transcript, or an external agent harness.

CIEL preserves evidence, decisions, and reconstructable context across disposable agents and sessions. An agent works through CIEL; it is not CIEL. Do not claim human identity, unrecorded memory, approval, or authority.

## Authority and scope

- The human owner supplies intent and retains final authority over commitments, external actions, identity, retention, and governance.
- Treat an explicit user request as the scope of work. Inspect, explain, review, diagnose, or plan without making changes unless the request authorizes a change.
- For an authorized local change, make only the necessary in-scope edits and run relevant non-destructive checks.
- Ask before external writes, destructive actions, purchases, credentials, legal/policy attestations, or a material expansion of scope.
- Never place secrets in repository files, events, evidence, or responses. Refer to an owner-controlled location instead.
- Agent sessions are disposable. Never store a session id, URL, or other locator in a commit, event, or repository file. A client name is provenance, not authority.

## Mandatory session start: Wake

On every fresh session, before giving a substantive answer or changing a file, perform this read-only Wake procedure. Do not require the human to invoke a separate skill.

1. From the repository root, run `bun run wake`. Treat its output as local, read-only evidence; it validates events and reports current Git facts, the newest event, reconciliation, and unknowns.
2. Read `README.md` and the task-relevant plan or Genesis document.
3. Identify the project/workstream explicitly. If multiple candidates fit, surface the ambiguity; do not choose silently.
4. Inspect further Git history, code, tests, or issues only where the report or task requires it. Separate observed facts, recorded claims, inferences, decisions, and unknowns. State uncertainty rather than filling a gap with a confident guess.

`bun run events:validate` is a focused validation diagnostic; do not run it redundantly when `bun run wake` already succeeds. Git is first-class evidence for product changes. Reference Git revisions and authoritative sources instead of copying reconstructable diffs or status into a second memory store.

### CIEL Wake evidence boundary

- Use only repository files and local Git for a CIEL Wake claim.
- Do not invoke global skills, global memory, prior chat history, GitHub, or another external service while establishing Wake facts.
- Ambient availability of a host capability is not itself CIEL evidence. A reported CIEL fact must remain traceable to a repository file or local Git output.
- After Wake, an agent may use a task-relevant global capability as optional assistance. It has no CIEL authority: verify any material factual claim locally, or label it as an unverified suggestion.
- If a Wake claim requires or relies on an excluded source, report `environment-contaminated` and stop that claim. Do not substitute the external result for repository evidence.

## Work lifecycle

Follow this order whenever applicable:

```text
Wake → Align → Plan → Execute → Closeout
```

- **Wake:** The mandatory session-start procedure above. It is an operating invariant, not an optional slash command.
- **Align:** State the goal, scope, acceptance criteria, constraints, known evidence, unknowns, and what is explicitly out of scope.
- **Plan:** Prefer the smallest vertical slice that can produce evidence. A plan records intended scope and acceptance criteria, not a journal of Git-derived completion; do not create future infrastructure merely because it appears in an architecture diagram.
- **Execute:** Keep changes narrow. Preserve unrelated work. Validate claims with the appropriate source or deterministic check.
- **Closeout:** At a work checkpoint, record the actual outcome, evidence, unresolved risks, and next executable action in one append-only YAML event. For remote work, commit and push that event to the draft PR head, verify it there, and present it for owner review as part of the final ready-for-review PR; for local-only work, review it before the local merge.

## Git workflow

- Do not develop tracked changes directly on `main`. Use a short-lived topic branch; local-only projects merge locally after checks, while projects with a canonical remote merge through an owner-reviewed pull request.
- Before starting tracked work in a remote project, and after its PR merges, return to a clean local `main` that matches fetched `origin/main`.
- Keep every remote PR as a draft until its phase closeout is committed and pushed to that PR head; verify the head, then report the ready-for-review PR to the owner.
- `README.md` records the operative pull-request procedure and which steps the agent performs on its own after proof. Follow it, not a general rule.

## Semantic event convention

`memory/events/` is the append-only, Git-tracked record of semantic facts that Git cannot reconstruct reliably. The current local CLI only reads and validates these records; it does not create or amend them.

- Store each event at `memory/events/YYYY/MM/DD/YYYYMMDDTHHMMSS_<slug>.yaml`. The slug describes the event; the `type` field carries its type.
- Write timestamps in ISO 8601 with timezone; use a stable `id`; never overwrite a committed event.
- Use `closeout` and `decision`. Add `eval` or `knowledge` only when a recorded proof demonstrates the need.
- Each event must include: `schema_version`, `id`, `type`, `recorded_at`, `recorded_by`, `workstream`, `outcome`, `evidence`, `unresolved`, and `next_action`.
- Give each closeout a checkpoint at `evidence.repository.head`. Wake reconciles through it; an event without one validates but silently disables reconciliation.
- Use concise YAML: stable keys for agents, plain prose values for humans, and source references instead of duplicated Git diffs.

## CIEL's current stage

Active workstreams and their state are the plans under `workstreams/`, as
reported by `bun run wake`. This file does not track them.

- Do not add a write path, daemon, API, MCP server, database, index, dashboard, agent team, or directory structure beyond the approved project registry and workstream-plan proof.
- Do not add a CIEL-specific global skill, host hook, or launcher until a reviewed proof gap establishes the need.
- Do not make `AGENTS.md` a long-term memory database or a copy of project history.
- Do not add IDE-specific instructions, nested instruction files, or a third client bridge until a reviewed proof gap establishes the need.
- Treat `docs/genesis/Agent HQ - Agent OS — Architecture Baseline v0.2.md` as the implementation baseline and `docs/genesis/CIEL_GENESIS_CONTRACT_v0.2.md` as the proposed authority/truth boundary. Surface any conflict; do not silently reconcile it.

## Instruction-file hygiene

- Keep this file concise, specific, and non-conflicting. State each rule once.
- A client bridge carries pointers and client-specific mechanics only, never the only copy of a rule. A rule that applies to any client belongs here, stated once.
- Put universal, durable operating rules here. Put task-specific procedures in a future skill only after repeat use justifies it; put path-specific rules next to the affected code only when that code exists.
- Review an instruction when a repeated failure, human correction, or measured evaluation shows that the instruction is needed or obsolete.

## Required final report

For a completed task, lead with the result and include only the evidence needed to support it, material caveats, and the next action. Do not report unverified memory or an intended action as completed work.
