# CU12 Simulator — Sprint 3: operator-controlled hook scenarios

**Workstream:** `cu12-simulator-sprint-003`  
**State:** active  
**Execution lane:** single  
**Plan revision:** 0.1  
**Execution phase:** none  
**Execution state:** idle  
**Parallelism:** none

## Objective and owner agreement

Allow a tester to change the simulated hook state of each of 12 locks from a
local terminal while an independent application reads CU12 responses over
macOS PTY. This enables repeatable access and re-latching scenarios before
building the SMC application workflow.

The owner agreed to separate CU12 protocol handling, simulated hook state, and
the tester's CLI. Unlock acknowledgement must not automatically change hook
state. CLI actions represent external physical inputs chosen by the tester;
they are not additional CU12 commands or proof of actual mechanical behavior.

This plan establishes that workstream. It does not authorize an SMC rebuild,
new product repository, or physical-device operation.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan and semantic evidence | `.` |
| `cu12-simulator` | protocol, hook state, and local control CLI | `checkouts/cu12-simulator` |

The simulator has a canonical private remote at
`github.com/mojisejr/cu12-simulator`; the local-only statements in historical
Sprint 2 describe its earlier state. Each repository follows the current
topic-branch and owner-reviewed PR workflow.

## Starting evidence

- Simulator baseline: `df032d3947d836e8f4a502ff4cdb4f200af787fb`.
- `src/device.rs` stores two hook-status bytes; the manual fixture is
  `[0x02, 0x00]`. Unlock currently acknowledges without changing these bytes.
- `src/transport.rs` holds a mutable device while blocking on stream reads;
  introducing CLI state updates requires a small, explicit concurrency boundary.
- Existing tests cover manual vectors, stream fragmentation/concatenation,
  invalid frames, TCP, PTY, and ACK without hook mutation.
- CU12 manual V1.1 pages 5–7 define framing, lock addressing and status examples.
  Reference hash: `bec83d1819a919cbe7b1879d01cc672b240544a4eaf0f6c3ca4829643b1413b6`.
  The owner-held PDF is
  `.assets/cu12-simulator/reference/CU12 Protocol and Introduction-12.08.2022.pdf`.
- Legacy discovery is recorded in
  `memory/events/2026/09/04/20260904T230000_smc_legacy_understanding.yaml`.
  `.assets/smc-legacy/SMC_LEGACY_UNDERSTANDING.md` is an optional local reference;
  it does not travel with a clone. This plan contains the necessary proof scope.

## Invariants

1. Preserve existing framing, checksum, addressing, and three supported commands
   (`0x80`, `0x81`, `0x8F`). Do not add opcodes or reinterpret unsupported ones.
2. Get Status serializes a consistent snapshot of the current hook inputs.
3. Unlock ACK does not imply a changed hook, open door, or successful human action.
   Repeated Unlock and the existing all-lock selector also leave hook state alone.
4. Only explicit tester input changes hook state in this slice. No timer,
   auto-close, implicit reset, or automatic mechanical transition is introduced.
5. Model lock-hook state, not medicine occupancy, patient assignment, or a
   separate door sensor whose relationship to the hook has not been established.
6. Preserve startup fixture `[0x02, 0x00]` for regression compatibility. It is a
   manual example, not a claim about factory or power-on physical state.

## Small implementation shape

```text
External client --CU12 bytes / PTY--> transport.rs --> device.rs
                                                        |
                                                    hook_state.rs
                                                        ^
Tester terminal --local text input--> control.rs --------+
```

Use one simulator process. Suggested modules:

- `hook_state.rs`: one canonical in-memory state, validated 1–12 lock selection,
  and tested mapping to the two status bytes; no duplicate boolean/byte stores.
- `device.rs`: command dispatch, reading hook snapshots, producing responses.
- `control.rs`: parse local tester commands and display their result.
- `main.rs`: opt-in control mode and lifecycle wiring.
- Existing `protocol.rs`, `transport.rs`, `pty.rs`, and `tcp.rs`: retain their
  responsibilities; adapt access to state only as required.

Prefer a small shared hook-state handle with short critical sections using
standard-library synchronization. Never hold its lock across stdin, serial
reads/writes, or waiting for a client. The serial loop keeps sole ownership of
protocol dispatch and response writing. CLI must remain usable while that loop
is idle and blocked on a read. No actor framework, service, or async runtime is
required merely to introduce this boundary.

## Proposed tester interface

Opt in with `CU12_SIM_CONTROL=stdin`; retain the existing transport selection:

```sh
CU12_SIM_TRANSPORT=pty CU12_SIM_CONTROL=stdin cargo run
```

These are intended commands, not currently implemented commands:

```text
help
show
hook 3 locked
hook 3 unlocked
```

CLI labels use human lock numbers 1–12. Wire LOCKNUM uses 0–11 for individual
locks; `0x02` therefore selects human lock 3. Verify status-bit mapping against
the manual independently of that command index. `show` prints hook inputs and
their serialized bytes, with terms explicitly defined in the README.

An accepted mutation emits a deterministic confirmation after the update is
visible. Invalid commands or numbers emit errors without changing state.
Text and diagnostics never enter the PTY byte stream. With no control flag,
retain existing headless behavior. Stdin EOF disables control input without
resetting hooks or terminating CU12 service; stop the process normally with
Ctrl-C. Restart restores the documented fixture; state is not persisted.

## Execution slices and acceptance criteria

### 1. Hook state and protocol boundary

- Confirm hook-bit mapping from the manual and record any ambiguity before
  implementing assumptions.
- Set/read each of 12 hooks without changing any other hook or unused bits.
- Get Status responds with the correct current bytes and recalculated checksum.
- Unlock for an individual/all-lock selector does not mutate hooks.
- Existing default golden vectors, Query Version, and parser tests still pass.

### 2. Local control while PTY is serving

- Implement the opt-in stdin commands and synchronization above.
- CLI changes are usable with no client request pending and become visible to
  the next status request after confirmation.
- Invalid input, EOF, and disabled control mode follow the specified behavior.
- Existing TCP and PTY tests remain regression gates.

### 3. Independent scenario proof and handoff

Spawn the simulator as a separate process with piped control input; open its
advertised PTY using a client configured for 19200/8N1/raw. Use independently
constructed requests and expected byte vectors; do not compute the expected
status with the simulator's serializer.

1. Set human lock 3 to locked and await CLI confirmation.
2. Request status and verify lock 3's bit and checksum.
3. Send Unlock for wire LOCKNUM `0x02`; verify ACK.
4. Read status again: lock 3 remains locked until tester input changes it.
5. Set hook 3 to unlocked, await confirmation, and verify status over the same PTY.
6. Leave it unchanged through repeated status requests, proving an open-hook wait.
7. Set hook 3 back to locked and verify the new status and unchanged other hooks.
8. Repeat a status change across the boundary between the two status bytes.

This covers tester-controlled re-latching, a hook remaining unlocked, and an ACK
with no observed hook movement. A test asserts observations, not a diagnosis
of an actual jam. Suppressing replies, disconnect injection, and timing faults
are separate future scope, not requirements for this slice.

Tests use explicit control confirmations and bounded timeouts instead of fixed
sleeps as synchronization. Run `cargo fmt --check`, `cargo test`, and
`cargo clippy --all-targets -- -D warnings`; record actual outcomes. Document a
short manual reproduction and record owner observation if performed.

The existing Desktop Lab remains a fixture-oriented client. Its golden-vector
match label is not a correctness oracle for changed status. Use the independent
PTY test for this gate; no Lab modifications are required.

## Boundaries and delivery

- One board, current command scope, in-memory state, macOS PTY scenario proof.
- No USB, Windows COM, electrical simulation, motor timing, or hardware fidelity
  claims. No new UI, database, network control endpoint, or scenario DSL.
- No HN, medication, authentication, audit database, or SMC application code.
- Record outcomes in append-only CIEL events, keeping plans as acceptance
  contracts. Future remote delivery uses draft PRs, verified closeout on the
  PR head, owner review, then post-merge sync and cleanup per repository.

The resulting proof is that an independent CU12 client observes tester-controlled
hook changes through the existing protocol. Application workflow completion and
actual CU12 mechanical behavior still require their own evidence.
