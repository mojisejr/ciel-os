# CU12 Simulator — Sprint 1

**Workstream:** `cu12-simulator-sprint-001`  
**State:** completed
**Execution lane:** single  
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective

Prove that a real external TCP client can send selected CU12 V1.1 wire frames
to a headless local simulator and receive byte-for-byte manual-derived
responses, without a UI, a serial adapter, hardware, or CIEL platform changes.

## Authority and scope

- The owner authorized a local-only `cu12-simulator` checkout under
  `checkouts/cu12-simulator`; it has no `origin` and no remote or push is in
  scope.
- This plan authorizes only Phase 1 after
  `evt_20260903T071800_cu12_sprint1_authorized`.
- The CU12 manual at
  `.assets/cu12-simulator/reference/CU12 Protocol and Introduction-12.08.2022.pdf`
  is the external protocol evidence. Its SHA-256 is
  `bec83d1819a919cbe7b1879d01cc672b240544a4eaf0f6c3ca4829643b1413b6`.
- The simulator and future production driver must not share a protocol
  implementation. Manual-derived vectors are the common test oracle.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | continuity host and evidence | `.` |
| `cu12-simulator` | headless CU12 product | `checkouts/cu12-simulator` |

## Lifecycle

```text
Wake → Align → Plan → owner authorization → Execute → Closeout checkpoint → Wake
```

The lane is single. A later session that finds this plan still `executing` must
reconcile the plan, local Git, tests, and events before changing the simulator.

## Phase 1 — headless unicast protocol slice

**State:** completed

### Definition of done

1. A local Rust binary listens on an explicitly configured TCP loopback port
   and handles a single virtual CU12 board at address `0x00`.
2. The buffered parser accepts a valid frame split across reads and multiple
   valid frames received in one read; it validates `STX`, `ETX`, `DATALEN`, and
   checksum before dispatch.
3. Unicast `0x80` Get Status, `0x81` Unlock, and `0x8F` Query Version return
   manual-derived byte sequences through a black-box TCP test.
4. An Unlock acknowledgement does not mutate hook status in manual mechanical
   mode; a later Get Status still reports the configured hook state.
5. Golden-vector, parser/checksum, device-state, and TCP black-box tests pass.
6. The repository records the source-document hash and the two known protocol
   ambiguities: unlock default `550ms` versus `500ms`, and push-door wait versus
   delayed unlock interaction.

### In scope

- Headless Rust binary and tests.
- One board, address `0x00`, unicast requests only.
- The three named commands and their documented successful responses.
- Deterministic test-only hook-state setup.

### Explicit non-goals

- Multi-board or broadcast behavior.
- Commands `0x82` through `0x85` and `0x8E`.
- UI, persistence, fault injection, protocol monitor, virtual serial, real
  hardware, Medical Cart integration, or a production CU12 driver.
- A response policy for malformed frames when the manual does not define one.
- Any CIEL database, index, bridge, write command, daemon, MCP server, remote,
  push, credential, browser, or user data.

### Proof contract

| DoD | Evidence | Lane |
|---|---|---|
| Exact manual responses | Golden-vector and black-box TCP tests | Hard Gate |
| TCP stream safety | Fragmented and concatenated-frame tests | Hard Gate |
| Unlock is distinct from hook state | Device-state test followed by Get Status | Hard Gate |
| Source ambiguity remains visible | Tracked protocol-evidence document | Hard Gate |

## Exit condition

Prepare a closeout event with the child commit, passing command output,
unresolved manual behavior, and the next narrow action. Do not extend Phase 1
or start a successor lane without owner direction.
