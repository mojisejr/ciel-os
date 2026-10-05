# SMC — Owner-issued Windows licenses and first Windows simulator acceptance

**Workstream:** `smc-windows-license-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner direction

Make the owner able to issue SMC licenses from the owner's Windows machine,
recover that ability from an owner-controlled backup, and complete the first
owner-observed Windows acceptance run of SMC against CU12 Simulator.

On 2026-10-05 the owner chose to keep the two existing product repositories,
create a new signing key on Windows, issue licenses personally, and defer team
access and a control room until actual sales show a need. The owner then asked
to open this workstream and include the first Windows SMC/simulator test in its
slice plan, before moving on to a separate real-hardware proof.

This revision records that direction and the proposed executable slices. This
opening task prepares the plan only: it does not generate a credential, replace
an embedded public key, install an MSI, or authorize a remote write. Record an
execution decision naming this revision and the requested slice when the owner
asks to execute it; do not infer approval for later credential or external work
from creation of the plan.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `smc-v2` | SMC application, shared license core and owner CLI issuer | `checkouts/smc-v2` |
| `cu12-simulator` | Independent TCP cabinet simulator and console | `checkouts/cu12-simulator` |
| `ciel-os` | This plan, decisions and append-only evidence | `.` |

The owner license tool stays in `smc-v2`. No third product repository, copied
cryptographic implementation, or CIEL service is introduced.

## Starting evidence and dependencies

- `smc-v2` at `f2e023adf8b05eb23644540a25d7537346be26b5` includes
  `crates/license`, `smc-license` (`keygen`, `issue`, `inspect`, `machine`),
  an embedded development public key, and the SMC activation screen.
- `cu12-simulator` at `1a3b97cfe1aeb57db7afc2128820d250fc0a39ef` includes
  the console, TCP endpoint `tcp:127.0.0.1:5012`, manual door closure,
  automatic opening after unlock, and disconnect/fault scenarios.
- The Windows readiness records are
  `memory/events/2026/10/05/20261005T051812_windows_readiness_partial_closeout.yaml`
  and `memory/events/2026/10/05/20261005T052948_windows_backend_cache_reuse_verified.yaml`.
  They record builds and backend checks, not owner GUI/MSI acceptance. The
  earlier cache failures remain historical evidence; the follow-up records
  two successful 58-test backend runs after owner-reported Norton restores.
- On opening this plan, local Git shows the Windows candidate `a9b637c` is
  contained in fetched HQ `origin/main` at `d439153`. HQ was synchronized to
  that clean main before creating this topic branch.
- `workstreams/smc-v2-app-001/PLAN.md` revision 0.6 slice 11 already defines
  MSI installation, activation and an owner Windows load/dispense run. Slice 4
  below collects evidence against those criteria as well. This new plan does
  not silently authorize or finish that older workstream; any acceptance
  record there must reference the actual shared evidence and its own decision.
- `ciel-windows-portability-001` remains a separate paused fresh-session
  reconstruction proof. A successful SMC walkthrough does not finish it.

## Scope and invariants

- Reuse the existing Ed25519 license core, file format, machine binding and
  offline application verification. Keep expiry/grace and existing-medication
  dispensing policies intact.
- Build an owner-only CLI plus a small PowerShell guided menu in `smc-v2`.
  The menu gathers input and invokes the CLI; validation and signing have one
  authoritative implementation. It runs only when explicitly opened.
- Signing-key creation is a separate deliberate operation from routine license
  issuance. A license is created per customer machine; a signing key is not
  regenerated per customer or per issuer computer.
- New keys are development-only in this proof. Production key governance and
  any migration of deployed customer builds require a separate owner decision.
- Keep private keys, backup passwords and customer secrets outside repositories,
  events, logs and delivered application/issuer packages. Repository code accepts
  local paths; it does not embed a host name, issuer path or machine code.
- Keep the existing key and previously built artifacts intact. The old key's
  actual availability and any existing deployments/licenses remain unknown;
  establish that before replacing a distributed build.
- Use synthetic HNs and separate test data directories. Do not test with patient
  records or overwrite an existing SMC data directory.
- Each slice ends at a bounded checkpoint with actual evidence, unresolved items
  and the next action. Do not claim owner observation from automated tests.

## Execution slices

### 1. Make the existing owner issuer safe and convenient on Windows

Deliverables:

- Harden CLI argument handling: normalized valid machine codes, nonempty customer,
  exactly one positive supported duration or explicit lifetime, and clear errors.
- Create key/output files without silently replacing existing files. Use exclusive
  file creation rather than a separate existence check followed by overwriting.
- Validate an issued license against the intended public key before reporting
  successful delivery; expose the public-key fingerprint for key/build matching.
- Add a small guided PowerShell menu for issue, inspect and machine-code display,
  with a preview of customer, machine, expiry and selected key before signing.
  Key creation has its own explicitly selected setup action. Do not add a GUI,
  autostart, global hook, account system or persistent service.
- Document ordinary issuance and exact build/test commands in the child repo.

Definition of done:

- CLI integration checks use disposable keys and exercise invalid arguments,
  missing/wrong keys, existing destinations and issue/inspect round trips.
- A failed operation leaves an existing key/license untouched and emits no secret.
- The Windows menu works from a directory unrelated to the checkout, preserves
  paths containing spaces and passes values safely to the CLI.
- Relevant Rust formatting, tests and lint checks pass. Signing/verification is
  still performed by `crates/license`; the wrapper does not implement it again.

### 2. Create the owner's Windows development key and prove recovery

Prerequisites: slice 1 evidence; owner-confirmed key storage/backup locations and
backup protection method. If any existing user depends on the old development
build, preserve that distribution and agree its migration before changing it.

Deliverables:

- Generate one new development signing key in an owner-controlled location outside
  all repositories, with restricted Windows file permissions.
- Keep the old key/artifacts intact. Store only the new public key/fingerprint in
  tracked artifacts; no private-key contents, hashes or password are recorded.
- Make an owner-controlled encrypted backup and write a concise recovery procedure.
- Restore from that backup into a separate controlled location, issue a synthetic
  license using the restored key, and verify against the original new public key.

Definition of done:

- Original and restored keys produce licenses verified by the same public key.
- The recovery run uses no original key path, Mac key, chat memory or copied cache.
- Record which recovery steps were agent-observed and which were owner-observed.
  Restoring into another location on this Windows machine is not proof that a
  different physical computer has been tested.
- Secret scanning of changed tracked paths/package contents finds no private key.

### 3. Bind SMC builds to the new key and prove rollback

Deliverables:

- Update SMC's embedded development public key and build both application and issuer
  from the same reviewed source. Keep the licensing format and policy unchanged.
- Produce Windows application/issuer binaries and an MSI, with Git revision,
  public-key fingerprint and artifact SHA-256 references.
- Issue a development test license for this Windows machine and verify it with the
  embedded key. Keep the file local, outside tracked evidence.
- Write and exercise rollback using a retained old artifact and isolated test data;
  source rollback is a normal Git revert, not a history rewrite or key deletion.

Definition of done:

- New-key valid licenses verify; foreign-signing-key, wrong-machine and tampered
  licenses are rejected. Expiry/grace and clock-rollback policies remain tested.
- The issuer/application public keys match. Packaged outputs contain no private key.
- Old-key licenses are explicitly identified as incompatible with the new-key build;
  retained old builds are not claimed to have been revoked by changing source.
- Rollback result is observed. If the old signing key/license is unavailable,
  record that limitation and resolve it before claiming activation rollback passed.

### 4. First owner-observed Windows SMC and simulator acceptance

Deliverables:

- An owner checklist with expected results, matching artifact revisions/hashes and
  isolated synthetic data. Begin with the executable smoke test, then install the
  matching MSI and exercise its installed application under the intended Windows
  data-directory permissions without touching an existing live installation.
- Activate with the new machine-bound license, bootstrap the admin and select
  Simulator (test). Observe 12 slots, the connected line and simulator banner.
- Load one synthetic HN, observe automatic door opening, close it in the console,
  restart SMC with simulator running and verify persisted slot/admin/license/logs.
- Dispense the HN, close the door, answer the remaining-medication question to clear
  it, and compare the resulting state with the user-facing audit/simulator marks.
- Exercise wrong PIN, unknown HN, disconnect/reconnect, and restart with a door
  open while leaving simulator running. Check Thai text, dialogs, window behavior
  and the owner's DPI setting; exercise CSV, backup and diagnostics on synthetic
  data. Scanner input is tested only if the actual scanner is available.

Definition of done:

- The owner observes installed-MSI activation and one complete load/dispense/clear
  cycle on Windows against TCP simulator; logs and displayed state agree.
- Restart/reconnect do not silently clear the loaded or pending slot. Expected
  refusals do not unlock an unrelated door.
- Record pass, fail, fixed-and-retested, unavailable and untested honestly. Any
  failure required by these criteria is fixed narrowly and re-observed.
- Record actual ProgramData/override paths and permissions used; an isolated
  executable run alone does not prove the default installed behavior.
- Missing physical scanner is a visible limitation. COM/RS485 and real CU12 are
  still untested, regardless of simulator results.

### 5. Deliver evidence and prepare the real-hardware starting point

Deliverables:

- Final closeout linking reviewed child source/builds, key recovery proof without
  secrets, owner observations, rollback evidence and remaining limits.
- Cross-reference shared Windows acceptance evidence in `smc-v2-app-001` through a
  separate truthful checkpoint if its authority allows; do not duplicate tests or
  silently mark another plan complete.
- A bounded proposed next step for real CU12: identify board/adapter/Windows driver,
  confirm wiring and transport configuration with owner-supplied hardware evidence,
  and define a no-patient bench test plus stop conditions in its own later plan.

Definition of done:

- All mandatory prior slice criteria have evidence; final delivery offers owner
  review through the normal PR/closeout procedure. No agent merges a remote PR.
- Fresh sessions can locate the source, license procedure and recovery instructions
  without secrets or session locators. Key recovery still requires owner access to
  the protected backup; cloning Git alone cannot recreate a private key.
- Real-hardware readiness means a documented next test can be started once its
  equipment/scope are confirmed; it is not a hardware, electrical, medical-device,
  compliance or production-readiness verdict.

## Boundaries, rollback and unresolved items

- Team issuance, customer accounts, cloud activation, remote revocation, dashboards,
  production signing keys, telemetry and automatic updates are outside revision 0.1.
- No source change in the simulator is planned; a required simulator defect is
  diagnosed and scoped separately rather than absorbed silently.
- Do not copy real patient databases into CIEL evidence or a future control room.
- Preserve every committed event. A failed test is followed by a new outcome;
  reverting source or using an older artifact does not erase the failed proof.
- Exact Norton restored-file/exclusion details and the five reported npm build-tool
  audit findings remain unresolved from Windows setup. Diagnose only if they block
  this work; no blanket security exclusion, policy change or dependency upgrade is
  included merely to clean up a report.
- Existing external deployments, old-key availability, owner backup method and
  actual hardware/scanner availability are unknown. Resolve each at the affected
  slice, without holding up unrelated issuer/plan work.

## Delivery and next action

This opening delivers the local plan and its append-only opening/checkpoint
records for review, not implementation or finished Windows acceptance. Keep HQ
changes on a bounded topic branch from synchronized main. Source changes later
use an independent `smc-v2` topic branch after its own clean-main start gate.

Next executable work is slice 1 when the owner requests execution. Slices 2-4
require the named credential/backup choices and actual owner walkthrough at their
respective points; do not pre-approve or claim those actions from this plan.
