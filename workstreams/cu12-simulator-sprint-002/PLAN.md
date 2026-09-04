# CU12 Simulator — Sprint 2: virtual serial endpoint

**Workstream:** `cu12-simulator-sprint-002`
**State:** completed
**Execution lane:** single
**Plan revision:** 0.3
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective

Prove that a local application configured to use a serial CU12 connection can
open a simulator-provided virtual serial endpoint and exchange the existing
manual-derived CU12 frames with the same virtual board. This is a byte-stream
and application-transport proof; it is not a claim of electrical RS485
emulation or real-hardware conformance.

## Why this is the next slice

Sprint 1 proved the TCP/BU-facing path. The CU12 V1.1 manual identifies the
board communication interface as RS485 and specifies a factory-default serial
configuration of 19200 baud, 8 data bits, no parity, and 1 stop bit. An
application that opens a serial port therefore needs a separately proven
transport path before a physical RS485 setup can be trusted.

The CU12 board's RJ45 communication connector carries RS485, not Ethernet. A
virtual serial endpoint lets a client exercise its serial configuration and
wire framing without assuming that an RJ45 connector can be attached to a
laptop Ethernet port.

The intended foundation is deliberately layered: Sprint 1 established the
manual-derived frame and virtual-device behavior over TCP; this sprint adds
the serial-facing application boundary without hardware; only a later sprint
will test the electrical RS485 boundary. A virtual success is valuable because
it isolates application and protocol faults before a cable, adapter, power, or
bus fault can be confused with them.

## Authority and boundaries

- The owner authorized Phase 1 of this exact plan revision after reviewing the
  virtual-first approach. The corresponding decision event must be committed
  before implementation begins.
- The existing `cu12-simulator` checkout remains local-only with no remote or
  push in scope.
- Reuse the simulator's protocol decoder and virtual-device semantics; do not
  share a protocol implementation with a future production driver.
- The CU12 V1.1 manual remains the protocol source. Its local asset hash is
  `bec83d1819a919cbe7b1879d01cc672b240544a4eaf0f6c3ca4829643b1413b6`.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | continuity host and evidence | `.` |
| `cu12-simulator` | headless CU12 product | `checkouts/cu12-simulator` |

## Lifecycle

```text
Wake → owner decision → Execute Phase 1 → Closeout checkpoint → Wake
```

This lane is single; no parallel work or physical-hardware lane is implied.

## Intended code shape

```text
src/
  protocol.rs       Frame, checksum, and StreamDecoder (unchanged semantics)
  device.rs         VirtualCu12 command behavior (unchanged semantics)
  transport.rs      generic Read + Write frame/dispatch loop
  tcp.rs            loopback TCP listener and endpoint adapter
  pty.rs            macOS PTY creation and raw serial configuration
  main.rs           explicit TCP or PTY mode selection

tests/
  protocol.rs       existing golden-vector and decoder coverage
  transport.rs      transport-independent stream/dispatch coverage
  tcp_black_box.rs  existing TCP regression proof
  pty_black_box.rs  client opens the advertised PTY path and exchanges frames
```

`protocol.rs` and `device.rs` remain the protocol core. `transport.rs` is the
only shared byte-stream loop; TCP and PTY are adapters around it. A future
physical serial/RS485 adapter may call that same loop only after separate
hardware authorization.

## Phase 1 — local virtual serial transport proof

**State:** completed

### Definition of done

1. After a dependency preflight, the simulator can create a local macOS
   pseudo-terminal (PTY) pair and
   prints the client-facing device path explicitly; it does not depend on an
   untracked host tool such as `socat` to create that pair.
2. A client that opens the advertised PTY as a serial device can send the
   existing fragmented and concatenated CU12 frames and receive the exact
   manual-derived responses for `0x80`, `0x81`, and `0x8F`.
3. The serial endpoint is configured and documented as 19200, 8N1, raw bytes;
   no automatic port discovery, device enumeration, or implicit network
   listener is added.
4. The stream/dispatch core is shared by the TCP and PTY transports, and the
   current TCP black-box test remains green unchanged in intent.
5. Deterministic tests cover stream dispatch independent of transport, and a
   macOS PTY black-box proof opens the advertised client path from a separate
   process or test client.
6. The README gives a short reproducible local procedure and labels the PTY as
   virtual serial only, not real RS485 electrical proof.

### In scope

- A macOS-only local PTY endpoint and the minimum Rust dependency or platform
  API needed to create it, after dependency review.
- An explicit simulator mode or command that creates the endpoint and reports
  its client path.
- Serial settings, raw-byte framing, regression tests, and a local client
  proof using the selected manual-derived vectors.
- Refactoring the existing server loop only as needed to reuse the exact frame
  decoder and virtual device across TCP and PTY transports.

### Explicit non-goals

- USB-to-RS485 adapters, physical CU12 boards, RJ45 wiring, termination,
  biasing, multi-drop bus behavior, or direction-control timing.
- Windows virtual COM support, Linux PTY support, automatic driver install,
  GUI, persistence, fault injection, or a protocol monitor.
- New CU12 commands, multi-board/broadcast behavior, Medical Cart integration,
  or a production CU12 driver.
- Any CIEL database, index, bridge, write command, daemon, MCP server, remote,
  push, credential, browser, or user data.

### Proof contract

| DoD | Evidence | Lane |
|---|---|---|
| Client opens virtual serial path | macOS PTY black-box test and documented command output | Hard Gate |
| Exact CU12 responses remain stable | Existing golden vectors plus PTY black-box response bytes | Hard Gate |
| TCP behavior does not regress | Existing TCP black-box test | Hard Gate |
| No physical claim leaks into virtual proof | README and closeout label the boundary explicitly | Hard Gate |

## Deliberately deferred decision: physical RS485 proof

Connecting a USB-to-RS485 adapter and a real CU12 device is explicitly a later,
separate owner-reviewed sprint. It is not an optional extension of this one.
That decision must name the adapter, host OS/driver, cable and RJ45 pinout,
power isolation, bus topology, serial parameters, termination/biasing, and an
explicit safe test procedure. It cannot be inferred from a PTY success.

## Authorized immediate result

A macOS application can select the printed virtual serial path and exercise
CU12 protocol frames without hardware, while TCP remains available as a
regression transport. A cable connected to a USB-to-RS485 adapter or real CU12
device belongs to the next hardware sprint, after this virtual foundation is
closed out.
