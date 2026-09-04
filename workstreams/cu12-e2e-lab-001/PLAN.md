# CU12 E2E Desktop Lab

**Workstream:** `cu12-e2e-lab-001`  
**State:** active  
**Execution lane:** single  
**Plan revision:** 0.1  
**Execution phase:** 1  
**Execution state:** executing  
**Parallelism:** none

## Objective

Prove that a separate native desktop application can configure and open the
simulator's macOS virtual PTY, send independently constructed CU12 requests,
and render the manual-derived responses in a simple UI.

The proof is application-to-simulator end to end. It does not use TCP at the
application boundary and does not claim USB, electrical RS485, Windows COM, or
real CU12 hardware behavior.

## Proposed project identity

The prospective private repository is `mojisejr/cu12-e2e-lab`. It does not
exist yet and is deliberately not listed as a CIEL project identity or local
binding. Phase 1 may create and register it only after an owner decision names
this plan revision and phase.

## Known starting evidence

- `cu12-simulator` is a clean private remote project at child revision
  `df032d3947d836e8f4a502ff4cdb4f200af787fb` when this plan was prepared.
- In macOS PTY mode, the simulator prints a client path and expects the client
  to configure 19200 baud, 8 data bits, no parity, 1 stop bit, and raw bytes.
- The simulator already proves its PTY transport using black-box tests for
  unicast `Get Status (0x80)`, `Unlock (0x81)`, and `Query Version (0x8F)`.
- The manual-derived response vectors and protocol ambiguities remain owned by
  the simulator's evidence documents. The desktop lab uses independently
  encoded request/response fixtures as its client-side test oracle; it must
  not import the simulator crate or its protocol implementation.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | plan, decisions, and closeout evidence | `.` |
| `cu12-simulator` | independently launched virtual device | `checkouts/cu12-simulator` |

## Product boundary

```text
cu12-e2e-lab desktop process
  native UI + independent client framing + serial I/O worker
    → pasted /dev/ttys… path at 19200 / 8N1 / raw
      → separately launched cu12-simulator PTY process
```

The desktop lab and simulator are separate private repositories, separate
processes, and separate protocol implementations. Their shared truth is the
manual-derived vectors, not shared source code.

## Proposed stack

| Concern | Choice | Reason |
|---|---|---|
| Desktop UI | Rust `eframe` / `egui` | Native Rust window with a small immediate-mode UI; no web runtime or bridge. |
| Serial I/O | Rust `serialport` | Explicit POSIX TTY configuration through one Rust API. |
| Concurrency | `std::thread` + bounded channels | Keeps blocking serial reads off the UI thread without adding an async runtime. |
| State | In-memory only | Connection state and byte log disappear when the lab closes. |
| Build | Cargo lockfile | Reproducible local build; no service or database. |

Dependency versions are selected and locked only after the owner authorizes
Phase 1 and the current crate documentation/license compatibility is reviewed.

## Intended repository shape

```text
cu12-e2e-lab/
  Cargo.toml
  Cargo.lock
  README.md
  src/
    main.rs          native application startup
    app.rs           UI state and command dispatch
    serial.rs        serial settings, worker, and bounded channels
    protocol.rs      independently encoded CU12 frames and response decoding
  tests/
    protocol.rs      manual-derived golden vectors
    serial.rs        serial configuration and error-boundary tests where deterministic
```

`protocol.rs` is a client implementation, not a reusable CU12 library and not
a dependency of the simulator or any future production driver.

## Phase 1 — establish the bounded client

### Entry gate

The owner authorizes this exact plan revision and the external creation of one
private repository. Only then may the local repository be initialized and its
empty canonical remote be seeded once on `main`; later tracked changes use the
normal topic-branch and PR workflow.

### Definition of done

1. The private repository exists with no secrets, `.env`, `.assets`, simulator
   source, or copied manual PDF.
2. `cargo run` opens a native macOS window with a PTY-path field,
   Connect/Disconnect control, fixed visible 19200/8N1/raw settings, command
   controls, connection state, decoded response panel, and RX/TX byte log.
3. The UI remains responsive while a serial worker owns blocking reads.
4. Invalid or unavailable paths produce an explicit UI error, not a panic or
   silent connection claim.
5. `cargo fmt --check`, `cargo test`, and the selected lint command pass.

## Phase 2 — independent serial client behavior

### Definition of done

1. The lab opens only the user-supplied PTY path and applies 19200/8N1/raw;
   it does not enumerate ports or start a TCP listener/client.
2. Client-side golden-vector tests independently encode the three selected
   requests and validate their expected response bytes and decoded fields.
3. The UI sends one request per explicit user action for `0x80`, `0x81`, and
   `0x8F`; it renders request bytes, response bytes, and decoded outcome.
4. Disconnect, read timeout, and malformed/unexpected response are shown as
   application errors without corrupting subsequent command use.

## Phase 3 — manual end-to-end proof

### Definition of done

1. Start the unmodified simulator in a separate terminal with:

   ```bash
   CU12_SIM_TRANSPORT=pty cargo run
   ```

2. Copy the printed `/dev/ttys…` path into the desktop lab, connect, and issue
   Get Status, Unlock, and Query Version from the UI.
3. Capture the displayed RX/TX bytes and decoded outcomes. Each response must
   match the committed client golden vectors and the simulator's manual-derived
   behavior.
4. Prove that Unlock acknowledgement does not claim a hook-state change beyond
   the simulator's documented mechanical model.
5. Re-run `cargo test` in the simulator unchanged as a regression check.
6. Record the simulator revision, lab revision, commands, visual/manual proof,
   unresolved protocol ambiguities, and next hardware action in reviewed
   closeouts for their respective repositories.

## Proof contract

| Claim | Evidence |
|---|---|
| The application is a real external client | Separate repository/process; no simulator crate dependency; manually pasted PTY path |
| Serial configuration is exercised by the application | UI state, serial worker configuration test, and PTY connection proof |
| CU12 byte exchange is end to end | UI RX/TX log plus independent client golden vectors and unmodified simulator behavior |
| UI does not hide transport failure | Invalid-path, disconnect, timeout, and malformed-response evidence |
| No TCP or physical claim leaks in | Source review, README, and closeout boundaries |

## Explicit non-goals

- TCP use by the desktop lab, TCP UI controls, or simulator changes.
- USB-to-RS485 adapters, RJ45 wiring, bus topology, termination/biasing,
  hardware direction timing, actual CU12 boards, or electrical conformance.
- Windows COM, Linux support, automatic port discovery, installer/package
  distribution, persistence, authentication, telemetry, cloud service,
  database, daemon, or remote control.
- New CU12 commands, broadcast/multi-board behavior, production-driver reuse,
  or Medical Cart integration.

## Exit and next decision

After Phase 3, the completed outcome is only: a native macOS application has
visibly and independently exercised the CU12 simulator through a virtual serial
endpoint. The next decision is whether to run the separate Windows portability
proof or authorize a hardware/USB-to-RS485 sprint; neither is implied by this
success.
