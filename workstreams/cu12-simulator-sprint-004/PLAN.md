# CU12 Simulator — Sprint 4: door physics and faults for building an application against it

**Workstream:** `cu12-simulator-sprint-004`
**State:** active
**Execution lane:** single
**Plan revision:** 0.2
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

Make the simulator behave enough like the real cabinet that SMC v2
(`smc-v2-app-001`) can be built and proven against it alone: the door pops
open after Unlock the way the owner recalls the real cabinet doing, and the
faults an application must survive — a board that does not answer, a board
that answers with an error code — can be provoked from the tester's
terminal. Nothing here is a hardware-fidelity claim.

On 2026-09-18 the owner recalled the real cabinet's behaviour from use: after
Unlock the door pops open and the hook bit reads 0; it stays 0 until a
person closes the door, then reads 1. This is recalled, not measured; it is
recorded as such and stands until real hardware is observed. The owner also
confirmed that the simulator's twelve-hook mapping matches the cabinet in
use. The owner agreed the simulator is ready for the application's happy
path as it is, and that the fault work should be shaped once the
application's gateway exists (after `smc-v2-app-001` slice 1).

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `cu12-simulator` | protocol, hook state, physics, faults, control CLI | `checkouts/cu12-simulator` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence

- Simulator `main` @ `6f0594b3d0099c6df5e20dcd5ce2ad55bf1fec10`, clean,
  equal to `origin/main`; 15 tests; `src/hook_state.rs` holds the twelve
  bits in one `AtomicU16`; `src/device.rs` answers Unlock with ACK and no
  hook change; `src/control.rs` parses `help | show | hook`.
- `docs/protocol-evidence.md` records the mapping assumption and that no
  actuator model exists. The sprint-3 plan chose "no timer, auto-close,
  implicit reset or automatic mechanical transition" on purpose; this plan
  adds one, opt-in, with the default unchanged.
- The manual: page 8 unlocking time default 550 ms (`0x0037 × 10 ms`); page
  14 hardware default 500 ms (`SPEC-AMBIGUITY-001`); page 6 ASK codes
  `0x11` failed, `0x12` wait timeout, `0x13` unknown command, `0x14` data
  verification failure.

## Invariants

1. Default behaviour is unchanged: with no new environment variable and no
   new command, every existing test passes as it is.
2. Framing, checksum, addressing and the three commands stay as they are;
   no opcode is added.
3. Physics is a model of what the owner recalled, labelled so in the README
   and the evidence note, never a claim about the cabinet.
4. Faults are provoked only by explicit tester input and affect only the
   next response(s) named; nothing is random.

## Execution slices and acceptance criteria

### 1. Door physics, opt-in

**Deliverable**

- `CU12_SIM_PHYSICS=door`: after an Unlock ACK for lock N (or all twelve
  for `0x0C`), that hook's bit clears to 0 after the unlocking time —
  default 550 ms, `CU12_SIM_UNLOCK_MS` to override — and stays 0. Closing
  the door remains the tester's `hook N locked`. A hook already 0 stays 0.
- `show` unchanged; README documents the mode, its source (owner-recalled,
  2026-09-18) and its limit; `docs/protocol-evidence.md` gains the same.

**Acceptance**

- With physics on: Unlock lock 3 → a status read within a bounded timeout
  shows bit 3 = 0 and every other bit unchanged; `hook 3 locked` → 1 again;
  unlock-all clears all twelve. With physics off: the existing tests pass
  unchanged.
- `cargo fmt --check`, `cargo test`, `cargo clippy --all-targets -- -D
  warnings` pass; no dependency added.

### 2. Faults and trace

**Deliverable**

- Control commands: `drop <n>` — suppress the next `n` responses;
  `ask <hex>` — answer the next request with that ASK code (`11`, `12`,
  `13`, `14`) and no data; `show` reports pending faults.
- `CU12_SIM_TRACE=1`: every received and sent frame on stderr as hex with a
  timestamp; never on the wire.
- A disconnect (closing and reopening the PTY or TCP endpoint) is not in
  scope; an application test kills and restarts the process instead. If
  slice 1 of `smc-v2-app-001` finds that insufficient, this slice is
  revised before it is authorized.

**Acceptance**

- Each fault is observed through an independent client over TCP and, on
  macOS, the PTY, with literal expected bytes; a dropped response is
  observed as a client timeout, not as a delay.
- The checks above pass; README and the evidence note describe the faults
  as tester-provoked.

### 3. Command-targeted faults (revision 0.2)

**Why.** On 2026-09-20 the owner ran SMC v2 against slice 2 and typed
`ask 11` before an Unlock; the application's status poll, sent every two
seconds, consumed the fault first (`02 00 00 80 11 00 03 96` in the
application's system log at 15:30:29Z). Against a polling application,
"the next request" can never be the Unlock by hand. Slice 2 stands as
specified; this slice adds the missing aim.

**Deliverable**

- An optional last word on `drop` and `ask` naming the command the fault
  waits for: `status` (Get Status `0x80`), `unlock` (`0x81`) or `version`
  (`0x8F`) — `ask 11 unlock`, `drop 3 unlock`, `drop 5 status`. Without
  it, the fault is consumed by the next answered request as in slice 2.
- A targeted fault lets requests for other commands pass untouched and is
  consumed by the first request of its command; faults stay in one queue
  in the order typed, and a request takes the first pending fault that
  applies to it. `show` prints the target beside each fault.
- README and `docs/protocol-evidence.md` gain the form and the reason.

**Acceptance**

- Over TCP: with `ask 11 unlock` queued, three Get Status requests are
  answered normally, then the first Unlock gets the literal `0x11` frame
  and moves no hook; with `drop 2 unlock`, two Unlocks are client timeouts
  while status reads between them are answered; with `drop 1 status`, an
  Unlock passes and the next status read times out. On macOS the unlock
  case repeats through the PTY.
- Slice-2 forms and every earlier test pass unchanged; `cargo fmt
  --check`, `cargo test`, `cargo clippy --all-targets -- -D warnings`
  pass; no dependency added.

## Boundaries and delivery

- No USB, Windows COM, electrical, motor timing or multi-board work; no
  network control endpoint; no scenario DSL.
- Delivery per slice: a draft pull request in `cu12-simulator`, closeout on
  its head, owner review, merge, then sync, as in sprint 3.
