# CIEL Genesis Contract v0.2

**Status:** Proposed — awaiting คุณนนท์'s ratification

**Created:** 2026-08-25, Asia/Bangkok

**Supersedes if ratified:** `CIEL_GENESIS_CONTRACT_v0.1.md`

**Scope:** CIEL-OS only. No existing harness, coding-agent client, vendor runtime, IDE, or project workflow is adopted by implication.

## 1. Why this contract exists

CIEL-OS will let its owner carry coding work safely across coding-agent CLIs, IDEs, models, sessions, and devices. It will do this with owner-controlled workspace artifacts and a local CLI, not by making a particular LLM, conversation, or agent harness the place where work is remembered.

This is a founding agreement, not an implementation specification. It defines the durable promises implementation must preserve and leaves implementation choices visibly open.

## 2. Identity and purpose

CIEL is one continuous operating identity for a human's AI-assisted work across many workspaces, sessions, devices, coding-agent clients, and models.

- CIEL is not a human, an LLM, a chat transcript, an IDE extension, a vendor account, or a single `AGENTS.md` file.
- A client session performs work; a conversation is temporary working cache. Neither owns CIEL's identity or history.
- CIEL helps a human resume, inspect, challenge, and govern work with durable context, provenance, and explicit uncertainty.
- CIEL may report disagreement, uncertainty, and missing evidence. It must not invent confidence or claim a human approval that was not recorded.

## 3. Primary interface: files and local commands

CIEL's V0 interface is a local CLI plus human-readable, version-controlled workspace artifacts. It is designed to meet coding agents where they already work.

The CLI will initialize a workspace, inspect or compile continuity state, record outcomes, validate artifacts, and synchronize client bridges. It may run inside a terminal, task runner, or IDE terminal. It does not require CIEL to call a model-provider API.

## 4. Canonical state and client bridges

CIEL has one canonical truth boundary. Client-specific instruction surfaces are bridges into that boundary.

| Canonical CIEL state | Client bridge |
|---|---|
| Identity, workstream ledger, decisions, evidence references, constraints, projections, resume packets, schema versions, and verification results | `AGENTS.md`, `CLAUDE.md`, IDE instruction files, editor tasks/settings, or future client-specific configuration |

A bridge may tell an agent where to read, which CIEL command to run, how to resume or close work, and which local rules apply. It must not become the only copy of a decision, handoff, or evidence record.

Where a client supports a stable instruction-file convention, CIEL should generate or maintain an explicitly delimited CIEL-managed section. It must preserve client- or human-authored instructions outside that section. A client that cannot use such a file may still use CIEL through its CLI and human-readable packet.

## 5. Sovereignty boundary

CIEL must be owner-controlled in the following practical sense:

| CIEL owns | May be replaced through a bridge or adapter |
|---|---|
| Source code, Git history, schemas, ledger format, project artifacts, backups, recovery procedure, local configuration, bridge templates, and evaluation rules | Coding-agent CLI, model provider, model, IDE, terminal, transport, MCP host, search backend, and external harness |

Using a cloud model remains compatible with CIEL, but model credentials and provider conversations are execution dependencies, not CIEL's continuity store. A direct provider API adapter is a possible future leaf, never a V0 root requirement.

## 6. Human authority

The human owner supplies intent, can challenge every interpretation, and retains final authority over commitments, external actions, identity changes, retention choices, bridge installation, and governance rules.

CIEL or a coding agent may prepare evidence, warn of risk, and recommend an action. It must distinguish a human decision from an agent inference, tool output, or derived projection. It must not represent recommendation, configuration, or an instruction-file edit as approval.

## 7. Truth and provenance model

CIEL records chronology without pretending every record is a fact.

| Term | Meaning |
|---|---|
| **Event** | An immutable record that something occurred, with time, actor/source, and provenance. |
| **Claim** | An assertion that may be supported, weakened, contradicted, or unknown. |
| **Evidence** | A retrievable source or artifact that supports or challenges a claim. |
| **Decision** | An explicit resolution by an identified authority, with rationale and scope. |
| **Intent / commitment** | A desired or agreed future action; not proof that it happened. |
| **Question / unknown** | A visible absence of knowledge; never silently converted into a fact. |
| **Projection** | Rebuildable current meaning derived from recorded history. |
| **Bridge sync** | A recorded rendering or verification of a client bridge; not proof that a client followed it. |

Every durable record must identify who or what recorded it, when, what it refers to, and how reliable or current it is believed to be. Client/model name, tool version, workspace path, and Git revision are evidence when relevant—not identity or authority by themselves.

## 8. Immutability, correction, and secrets

The historical ledger is append-only. CIEL does not erase an event, claim, or decision to make the present look cleaner.

When understanding changes, CIEL records a correction or supersession linked to the earlier record and explains the newer interpretation. Projections, summaries, packets, and generated bridge sections may be rebuilt or replaced because they are not historical ledger entries.

Secrets must not be placed in the ledger, bridge files, documentation, evidence text, or fixtures. CIEL may retain a safe reference to an owner-controlled secret location.

## 9. Kernel and bridge boundary

The kernel is domain-neutral. It knows provenance, chronology, uncertainty, authority boundaries, workstreams, and reconstruction. It does not encode a project's business rules or a vendor's social/workflow policy.

The kernel must not directly depend on a model, a coding-agent CLI, an IDE, HTTP service, or always-running process. Client bridges and optional adapters sit outside the kernel and consume client-neutral packets and contracts.

## 10. Minimum continuity packet

A packet sufficient for a different agent client to resume a workstream must be compiled from recorded state and include:

1. CIEL identity and schema/version metadata;
2. workspace identity, repository location, and relevant revision/worktree state;
3. workstream objective, scope, and acceptance criteria;
4. current derived state and its source checkpoint/event range;
5. active constraints, explicit decisions, and their rationale;
6. relevant evidence references and verification status;
7. open questions, contradictions, and uncertainty;
8. completed work, failed approaches, and the next executable action; and
9. the applicable client-bridge instructions, or a stable reference to them.

It must be intelligible to a human and usable by a new coding-agent session without relying on the previous client's chat history.

## 11. V0 proof scenario

The first proof uses no direct LLM API:

1. Initialize one local Git workspace under CIEL control.
2. Define one workstream with objective, scope, acceptance criteria, and an explicit human authority boundary.
3. Produce and verify bridges for two client conventions, initially `AGENTS.md` and `CLAUDE.md`.
4. Append records for an observation, claim, evidence reference, decision, checkpoint, and bridge sync.
5. Compile a continuity packet and use it to start a second, different client session without the first client's chat history.
6. Rebuild the projection in a clean scratch store from the same ledger.
7. Verify that both the rebuilt state and packet preserve the objective, decisions, evidence references, active constraints, open questions, next action, and bridge references.

Passing demonstrates cross-client continuity and reconstruction. It does not prove that every client obeys instructions, model quality, retrieval quality, multi-agent coordination, IDE automation, or autonomous improvement.

## 12. V0 non-goals

- a model gateway, provider API proxy, local model, or model-training system;
- a daemon, distributed scheduler, queue, or permanent agent swarm;
- an IDE extension or MCP server before file-and-CLI bridges show a measured proof gap;
- automatic external actions, self-modification, or autonomous governance;
- replacing Git, package managers, or the operating system; or
- importing an existing Oracle/harness implementation as CIEL's kernel.

## 13. Proposed implementation guardrails

- Start with deterministic CLI commands, a local SQLite event store, Markdown packets, and versioned workspace artifacts.
- Make the canonical packet client-neutral; keep each bridge short, explicit, and replaceable.
- Define a non-destructive bridge-sync contract before writing `AGENTS.md`, `CLAUDE.md`, or any IDE file.
- Keep runtime facts, derived projections, generated bridge content, and human-authored meaning distinct.
- Version schemas and compatibility decisions before changing durable data.
- Use append-only ledger writes and clean rebuild tests before caching or convenience state.
- Add an IDE extension, MCP server, hooks, or model API only after a demonstrated failure of the file-and-CLI path.

## 14. Decisions still reserved for the owner

This document deliberately does not ratify:

- the legal licence and public/private distribution of CIEL-OS;
- encryption, backup destinations, recovery-key custody, and retention policy;
- the exact event schema and local-versus-shared storage topology;
- the initial set of supported coding-agent clients and their bridge file names;
- whether bridge files are committed, locally ignored, or chosen per workspace;
- whether a non-owner may read, write, or administer a ledger;
- the initial implementation language and package layout after a feasibility check; or
- the name and mechanics of any future direct model adapter.

## 15. Ratification gate

This contract becomes the binding Genesis Contract only when คุณนนท์ explicitly accepts it or requests a versioned amendment. Until then, it is the proposed baseline for discussion and does not authorize CIEL, a bridge, or a coding agent to make decisions on behalf of its owner.
