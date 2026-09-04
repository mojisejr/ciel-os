# CIEL Genesis Alignment v0.1

**Status:** Proposed — awaiting owner review and explicit acceptance  
**Created:** 2026-09-03, Asia/Bangkok  
**Scope:** CIEL-OS implementation sequence after the completed Codex-only
continuity core and portfolio-flow pilot.

## Purpose

This note preserves the intended destination of the proposed
`CIEL_GENESIS_CONTRACT_v0.2.md` while making the current implementation
sequence explicit. It does not ratify, supersede, or rewrite that contract.

CIEL remains an owner-controlled continuity layer whose identity and canonical
truth must not depend on one coding-agent client, model provider, device, or
session. Codex is the first client used to prove the smallest useful path; it
is not the owner of CIEL's identity or the limit of its future portability.

## Sources and precedence

| Artifact | Role now |
|---|---|
| `docs/genesis/CIEL_GENESIS_CONTRACT_v0.2.md` | Proposed authority and truth boundary; it remains unratified. |
| `docs/genesis/Agent HQ - Agent OS — Architecture Baseline v0.2.md` | Current implementation baseline. |
| `AGENTS.md` | Current Codex operating contract and scope guard. |
| Approved workstream plans and append-only events | Scoped execution authority and semantic history. |
| Local Git and repository files | Evidence for current CIEL facts. |

When these artifacts conflict, do not silently reconcile them. Surface the
conflict for an owner decision or a versioned amendment.

## Agreed implementation direction

1. **Codex-first, not Codex-bound.** CIEL proves its continuity path first
   through the Codex-oriented `AGENTS.md`, local CLI, repository files, and
   local Git. Future client bridges remain possible adapters, not duplicated
   truth stores.
2. **Vendor neutrality remains an invariant.** CIEL must not treat provider
   chat history, credentials, model state, a client instruction file, or an
   external harness as canonical identity, evidence, or owner authority.
3. **Evidence gates capability.** Do not add a second client bridge, database,
   index, write command, daemon, MCP server, dashboard, or persistent agent
   runtime merely because a target architecture describes one.
4. **No SQLite until evidence.** SQLite is a possible rebuildable implementation
   choice, not a present requirement. It requires a recorded proof that the
   file-and-local-Git path cannot retrieve or reconstruct required continuity
   with acceptable accuracy and operator cost.
5. **Real work is the next proof.** Before extending the CIEL kernel, operate
   one real product workstream using the existing project identity, local
   binding, plan, append-only event, Wake, and local-Git evidence model.

## What the completed pilots establish

The Codex-only continuity core and portfolio-flow pilot establish that CIEL can
validate append-only events, reconstruct Git-aware current state, identify
locally bound projects, and recover an intentionally interrupted single lane
without treating chat or ambient global capabilities as CIEL evidence.

They do not establish cross-client continuity, a compiled continuity packet,
retrieval at production scale, event-writing ergonomics, real-hardware
conformance, or a need for SQLite. Those are unproven hypotheses, not missing
features to implement by default.

## Next product proof

The proposed first real project is a CU12 Hardware Simulator. Its first
workstream should use the current CIEL structure and prove a small headless
wire-protocol slice: a local TCP client sends manual-derived CU12 frames and
receives matching responses. The workstream must preserve the protocol manual
as evidence, retain documented ambiguities, and keep the simulator independent
from any future production driver.

The first workstream must not silently expand into the whole simulator, a
Medical Cart application, a production serial connection, or CIEL platform
features. A later decision must name its plan, execution phase, acceptance
checks, and owner-authorized scope before implementation begins.

## Open decisions retained by the owner

- Whether to accept this alignment and issue a ratified amendment to the
  proposed Genesis Contract.
- Which client bridge becomes the second proof target, and when.
- What measured retrieval, reconstruction, or authoring gap would justify
  SQLite or another rebuildable index.
- The exact CU12 Simulator repository identity, local binding, and first
  workstream plan.

## Acceptance test for this note

An agent reading this note, `AGENTS.md`, the Genesis Contract, the Architecture
Baseline, and local Git can distinguish the long-term vendor-neutral identity
from the current Codex-first proof sequence, and will not infer authorization
to add platform infrastructure or begin the CU12 workstream.
