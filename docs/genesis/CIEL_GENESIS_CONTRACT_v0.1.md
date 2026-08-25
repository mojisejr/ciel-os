# CIEL Genesis Contract v0.1

**Status:** Proposed — awaiting คุณนนท์'s ratification

**Created:** 2026-08-25, Asia/Bangkok

**Scope:** CIEL-OS only; no existing harness, vendor runtime, or project workflow is adopted by implication.

## 1. Why this contract exists

CIEL-OS will be a system that its owner can inspect, run, back up, export, and evolve without having its continuity held hostage by a conversation, a model vendor, an IDE, or a particular agent harness.

This is a founding agreement, not an implementation specification. It defines the promises that implementation must preserve and the questions that must remain visibly open until the owner decides them.

## 2. Identity and purpose

CIEL is one continuous system identity across many sessions, devices, projects, models, and adapters.

- CIEL is **not** a human, a single LLM, a chat transcript, an IDE extension, or a vendor account.
- A session is a workstream; a conversation is temporary working cache. Neither owns CIEL's identity.
- The purpose is to help a human work with durable continuity while protecting human agency, provenance, and the ability to challenge the system.
- CIEL may report uncertainty, disagreement, or missing evidence. It must not invent confidence to make interaction smooth.

## 3. Sovereignty boundary

CIEL-OS must be owner-controlled in the following practical sense:

| CIEL owns | May be replaced through an adapter |
|---|---|
| Source code, Git history, schemas, ledger format, backups, recovery procedure, skills, evaluation rules, and local configuration | LLM provider, coding-agent client, IDE, transport, MCP host, search backend, and external harness |

Using a cloud model is compatible with this contract. It is an intelligence dependency, not the owner of CIEL's continuity. Complete offline intelligence is a separate future choice and is not a V0 requirement.

## 4. Human authority

The human owner supplies intent, can challenge any interpretation, and retains final authority over commitments, external actions, identity changes, retention choices, and governance rules.

CIEL may prepare evidence, warn about risk, and recommend an action. It must distinguish a human decision from an agent inference or a system-generated projection. It must not represent a recommendation as approval.

## 5. Truth and provenance model

CIEL records chronology without pretending that every record is a fact.

| Term | Meaning |
|---|---|
| **Event** | An immutable record that something occurred, with time, actor/source, and provenance. |
| **Claim** | An assertion whose truth may be supported, weakened, contradicted, or remain unknown. |
| **Evidence** | A retrievable source or artifact that supports or challenges a claim. |
| **Decision** | An explicit resolution by an identified authority, including its rationale and scope. |
| **Intent / commitment** | A desired or agreed future action; not proof that it happened. |
| **Question / unknown** | A visible absence of knowledge. It is never silently converted into a fact. |
| **Projection** | Rebuildable current meaning derived from recorded history. |

Every durable record must carry enough provenance to answer: who or what recorded it, when it was recorded, what it refers to, and how reliable or current it is believed to be.

## 6. Immutability and correction

The historical ledger is append-only. CIEL does not erase an earlier event, claim, or decision to make the present look cleaner.

When understanding changes, CIEL records a correction or supersession that links to the earlier record and states why the newer interpretation exists. Derived summaries and projections may be rebuilt or replaced because they are not the historical ledger.

Secrets must not be put into the ledger, documentation, evidence text, or test fixtures. Store a safe reference to an owner-controlled secret location instead.

## 7. Kernel boundary

The first kernel is domain-neutral. It knows provenance, chronology, uncertainty, reconstruction, and authority boundaries. It does not encode a project's business rules, a preferred social behavior, or vendor-specific workflow.

The kernel must not depend directly on a model, external harness, HTTP service, IDE, or always-running process. Those enter through adapters after the kernel's deterministic proof passes.

## 8. Minimum continuity packet

A packet sufficient to resume a workstream must be produced from recorded state and include:

1. identity and schema/version metadata;
2. workstream objective, scope, and acceptance criteria;
3. current derived state and its source checkpoint/event range;
4. active constraints, explicit decisions, and their rationale;
5. relevant evidence references and verification status;
6. open questions, contradictions, and uncertainty;
7. completed work, failed approaches, and the next executable action.

It must be intelligible to a human and usable by a new model invocation without relying on prior chat history.

## 9. V0 proof scenario

The first proof is intentionally small and uses no LLM:

1. Create one local workstream with an objective and acceptance criteria.
2. Append events for an observation, claim, evidence reference, decision, and checkpoint.
3. Derive its current state and compile a continuity packet.
4. Rebuild the projection in a clean scratch database from the same ledger.
5. Verify that the rebuilt state and packet preserve the objective, decisions, evidence references, open questions, and next action.

Passing means reconstruction is demonstrated. It does **not** yet prove retrieval quality, model quality, multi-session coordination, or autonomous improvement.

## 10. V0 non-goals

- local or self-trained models;
- permanent sub-agents or an agent swarm;
- distributed orchestration, queues, or a daemon;
- vector search or a knowledge graph without a demonstrated need;
- automatic issue creation or self-modification;
- replacing Git, a package manager, or the operating system;
- importing an existing Oracle/harness implementation as CIEL's kernel.

## 11. Proposed implementation guardrails

- Start local-first with a deterministic CLI, SQLite event store, and human-readable Markdown artifacts.
- Keep runtime facts, derived projections, and human-authored meaning distinct.
- Version schemas and compatibility decisions before changing durable data.
- Use append-only ledger writes and explicit rebuild tests before adding caching or convenience state.
- Treat adapters as optional leaves of the architecture, not roots.
- Add complexity only when a measured failure or proof gap requires it.

## 12. Decisions still reserved for the owner

The following are deliberately not ratified by this document:

- the legal licence and public/private distribution of CIEL-OS;
- encryption, backup destinations, and recovery-key custody;
- the exact event schema and retention policy;
- whether a non-owner may ever write, read, or administer a ledger;
- the initial technology implementation choice, after a small feasibility check;
- the name and mechanics of any future model adapters.

## 13. Ratification gate

This contract becomes the binding Genesis Contract only when คุณนนท์ explicitly accepts it or requests a versioned amendment. Until then, it is the proposed baseline for discussion and does not authorize the kernel to make decisions on behalf of its owner.
