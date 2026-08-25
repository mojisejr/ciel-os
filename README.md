# CIEL-OS

CIEL-OS is a local-first continuity system for coding-agent work.

> Coding agents execute work. CIEL carries the work forward.

CIEL gives a human-owned workspace one durable operating memory across coding-agent CLIs and IDEs. A Claude Code session, Codex session, VS Code, or a future client can read the same project instructions, resume packet, evidence, decisions, and constraints without becoming the owner of that continuity.

CIEL's primary integration is **workspace files plus a local CLI**, not a hosted LLM API. Provider-native instruction files such as `AGENTS.md`, `CLAUDE.md`, and future IDE instruction surfaces are bridges into CIEL; they are not its source of truth.

## Status

Genesis proof in progress. No runtime, CLI, database, or client-specific integration exists yet. The root `AGENTS.md` and the first append-only closeout event are the minimum artifacts under evaluation.

The current proposed foundation is [CIEL Genesis Contract v0.2](docs/genesis/CIEL_GENESIS_CONTRACT_v0.2.md). It changes the earlier kernel-only framing into a coding-agent continuity system while preserving the local-first, owner-controlled truth model. [v0.1](docs/genesis/CIEL_GENESIS_CONTRACT_v0.1.md) remains as the superseded proposal.

## How CIEL will work

```text
Human owner
    │ approves commitments and external actions
    ▼
CIEL canonical state
    │ ledger, decisions, evidence, constraints, resume packets
    ├───────────────┐
    ▼               ▼
CLI commands     Generated or maintained client bridges
    │               `AGENTS.md` · `CLAUDE.md` · IDE instructions
    ▼               │
Coding-agent CLI / IDE session ── reads context, performs work, records outcome
```

CIEL records durable work history and compiles a client-neutral resume packet. A bridge tells a particular client where that packet is, what rules apply, and how to report back. The agent's model credentials, chat history, and proprietary session store stay outside CIEL's truth boundary.

## Current repository

```text
README.md
AGENTS.md             Codex bootstrap contract and mandatory Wake rule
docs/
  genesis/        The only current artifacts: Genesis contracts and the architecture baseline
memory/
  events/         First justified runtime artifact: append-only semantic closeout records
```

CIEL adds a new artifact only when the agreed proof requires it. `AGENTS.md` and `memory/events/` now exist because the first cross-session proof requires an automatic Wake rule and a durable semantic closeout. A runtime, index, client bridge, or automation remains out of scope.

## First proof target

Without calling an LLM API, CIEL must let a new Codex session reconstruct and resume one workstream from Git-aware evidence, concise semantic records, and current knowledge—without the human retelling the previous session's chat history. Multi-client bridges and an index are later proofs, not initial structure.

## Deliberate non-goals for this stage

- a model gateway, provider API proxy, or model-training system
- a daemon, distributed scheduler, or permanent agent swarm
- an IDE extension or MCP server before file-and-CLI bridges prove insufficient
- automatic self-modification or autonomous governance
- copying an existing agent harness into this repository

## Working rule

The contract, schema, and proof come before implementation. Any permanent change to CIEL's identity, canonical-truth boundary, or human-authority boundary requires a versioned decision with explicit human approval.
