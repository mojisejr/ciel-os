# SMC Windows simulator checkpoint — closeout and hardware handoff

Prepared on 2026-10-06 from repository records and local Git.
Owner approved checkpoint closure on 2026-10-06 under plan revision 0.9.
This closes the tested evidence scope; original revision-0.8 gaps below remain
unperformed. Remote delivery/merge are established by the final event and Git,
not inferred from this document.

## Result and boundary

The installed Windows SMC application has passed the recorded synthetic tests
against the independent local TCP CU12 simulator. Source is
`23e7781af3faa8f58b51e9e7a200a35b8089b527`; simulator source is
`1a3b97cfe1aeb57db7afc2128820d250fc0a39ef`. This is readiness for the tested
simulator workflow, not real CU12, scanner, production or regulatory acceptance.

The owner observed activation, license, simulator connection and the initial
synthetic load. Agent Computer Use subsequently tested the dispense/clear cycle
and failure/restart/export cases with owner authorization. A claim that the owner
personally observed that whole cycle is not supported by the current record.

## Timeline (Bangkok time)

| When | Work | Evidence |
|---|---|---|
| September 18–30 | Product contract and slices 1–10: gateway, state/store/PIN, UI, licensing/operations, recovery behavior, Windows cross-check, owner walkthrough and explicit simulator mode | PLAN.md slices 1–10; child Git history through `f2e023a` |
| October 5, 17:39–17:42 | Consolidated Windows licensing into the SMC lane and retired the separate proposal | `20261005T173923_smc_windows_scope_consolidation_confirmed.yaml`; `20261005T174219_smc_lane_consolidation_checkpoint.yaml` |
| October 5, 18:17 | Hardened existing issuer and added owner Windows menu; 15 licensing/issuer checks passed | `20261005T181708_smc_owner_issuer_step11_1_local_checkpoint.yaml`; child `d1e9bc1` |
| October 5, 20:00–21:10 | Created owner-controlled development key, encrypted backup and same-Windows restore/signature proof | `20261005T200000_smc_windows_key_created_owner_backup_pending.yaml`; `20261005T211000_smc_windows_development_key_recovery_verified.yaml`; child `71e8d36` |
| October 5, 21:49–22:04 | Owner waived old-key activation rollback and deferred off-machine backup; new-key app/issuer/MSI built and checked | `20261005T214900_smc_new_key_forward_scope_decided.yaml`; `20261005T220400_smc_new_key_windows_builds_verified.yaml`; child `2d7c791` |
| October 6, 05:11–05:39 | EXE smoke, MSI installation, activation, simulator connection and synthetic load observed | October 6 launch/activation/installation/load events |
| October 6, 06:56 | Found Loaded-slot icon disagreeing with the open door; minimal UI fix, rebuild and candidate retest passed | `20261006T065600_smc_windows_gui_tests_and_door_indicator_fix.yaml`; child `23e7781` |
| October 6, 07:11–07:21 | Removed unused previous installation, preserved data, owner installed replacement; installed fix/restart/reconnect retests passed | `20261006T071115_smc_previous_windows_installation_removed.yaml`; `20261006T072156_smc_replacement_installed_fix_retested.yaml` |
| October 6, 08:02 | Owner authorized app credential entry; desktop was locked, so app input stopped | `20261006T080228_smc_owner_agent_pin_testing_authorized_desktop_locked.yaml` |
| October 6, through 08:45 | After owner unlock: refusals, pending-dispense restart, complete/clear, audit, CSV, manual backup and diagnostics passed | `20261006T084529_smc_installed_full_cycle_and_exports_verified.yaml`; HQ `42f1a1a` |

Event filenames above resolve under `memory/events/2026/10/05/` or
`memory/events/2026/10/06/`. Older slice evidence remains in its original events
and Git, rather than being copied into a second history.

## DoD reconciliation against approved revision 0.8

| Step | Actual evidence | Remaining boundary |
|---|---|---|
| 11.1 Issuer | CLI/menu validation, exclusive output, key matching, issue/inspect and Windows integration checks passed | Owner-only workflow; no team service/UI or production issuing system |
| 11.2 Key recovery | Encrypted backup, restrictive ACLs, restored public identity and two verified synthetic signatures | Same physical Windows machine; off-machine backup explicitly deferred |
| 11.3 Matching build | New public key in issuer/app, license rejection cases, release outputs/MSI and package inspection passed | Old-key activation rollback owner-waived and untested; development key only |
| 11.4 Installed simulator functionality | Load, dispense, clear, wrong PIN, unknown HN, loaded/pending restart, disconnect/reconnect, audit/CSV, automatic/manual backup and diagnostics have evidence; door-display bug fixed and retested installed | Owner-observed full-cycle criterion not fully met; app DPI 96 measured, intended OS scaling unconfirmed; physical scanner availability unknown and input untested |
| CIEL Windows Phase 2 | Existing Windows Wake/check observations are partial evidence only | Required independent clean-clone/fresh-session proof remains unperformed; its own workstream remains paused |
| 11.5 Final delivery | Owner chose revision-0.9 simulator checkpoint closure; this bundle and the receiving hardware plan preserve the actual evidence | Revision 0.8 did not pass in full; remote delivery/merge require their own final event and Git evidence |

## Problems, limitations and proven workarounds

| Finding | Outcome / workaround | Limit |
|---|---|---|
| Loaded door was physically open in simulator but Home showed a closed lock | Two-line UI change uses the observed door bit; open/closed and restart retested in replacement installation | Resolved for tested installed build; retain failed observation and old artifacts |
| Registered-app launch timeout / candidate path could select old registered app | Launch the exact observed EXE item in File Explorer, then verify returned process path | Tooling root cause and extra hidden process remain unknown; no blanket process killing |
| Running old EXE blocked a build with AccessDenied | Use separate explicit-target output and retained artifacts; close app normally for switching | Does not establish that original output path was repaired |
| Original build cache hit LNK1104 | Separate build target passed | Root cause deferred; no broad cache deletion |
| MSI payload hash differed from standalone EXE | Compare actual bytes and pinned Tauri source: exactly three bundle-marker bytes, UNK versus MSI; retain separate raw hashes | Files were not modified to force a match |
| Desktop locked while owner away | Stop input; owner unlocks Windows normally; refresh screenshot before resuming | App PIN authorization is not Windows unlock authority |
| Door remained open over 60 seconds during test | Expected audit warning recorded; close door normally and complete workflow | No automatic clearing; warning history retained |
| Diagnostics includes a full database copy | Store only in owner-controlled local proof folder; inspect inventory/integrity without credential columns | No redaction claim; archive was not transmitted or committed |
| Screenshots, backups, licenses, keys and binaries are local artifacts | Events point to actual paths, hashes and Git sources; preserve artifacts separately | Git clone reproduces tracked context, not private keys or all local proof files |
| Encrypted signing-key backup is on the same disk | Same-machine restore proof passed; keep passphrase with owner | No disk-loss protection or other-computer recovery proof; destination still unselected |
| Old-key activation rollback | Owner explicitly waived it; retain old source/artifacts | Do not report tested rollback; new-key build does not revoke licenses in old binaries |
| Physical scanner / CU12 / COM / RS485 / physical labels | Later no-patient bench proof with identified equipment | Untested; keyboard-entered synthetic HN and TCP do not prove these |
| Norton exclusions, five reported npm build-tool audit findings and historical gateway parallel-test port race | Continue bounded work using recorded successful paths | Not assessed/resolved; no automatic AV weakening or dependency upgrade |
| WiX decompiler UI-table warnings | Actual payload extraction and later owner-installed replacement supply separate evidence | Warnings' root cause remains unknown; decompilation alone never proved install behavior |
| Disposable encrypted-fixture deletion was rejected by automatic approval review | Leave restricted fixture outside repositories; no alternative deletion attempt | Cleanup remains unperformed; rejected action's stated reason was blocked by policy |
| Two historical event-status warnings in other workstreams | Wake validates current events; preserve immutable historical events | GA4 and BE-retirement closure semantics are unrelated deferred work |

## Retained operational locations

- Installed app: `D:\Smart Medication Cart\smc.exe`.
- Data/logs/backups: `C:\ProgramData\SMC`.
- Fixed EXE/MSI artifacts: `D:\dev\tools\artifacts\smc-v2\step11.4-door-indicator-20261006`.
- Previous new-key build retained: `D:\dev\tools\artifacts\smc-v2\step11.3-new-20261005T215700`.
- GUI/export evidence: `D:\smc-owner\testing\gui-20261006`.
- Issuing/recovery instructions: child `crates/license/README.md` and
  `scripts/license-menu.ps1`, `scripts/license-key-backup.ps1`.
- Owner signing key and encrypted backup stay outside Git under owner control.
  No credential contents, private-key hashes or passphrase are recorded here.

Installed EXE SHA-256:
`93653856B308914C4A6E405CF06E4AF08A937665F3CA2F1234587C500146D50E`.
Fixed MSI SHA-256:
`BDE72222A4028B9C5BE1CC116144E9AA5007169EBC183E88192510E5735C3377`.
Both were checked again locally while preparing this bundle. The standalone
candidate and installed EXE have different bundle markers as recorded above.

## Owner-approved closure scope

Revision 0.9 closes this workstream at the tested simulator evidence
checkpoint. Completion means delivery of that evidence and explicit stopping
of the unperformed acceptance requirements from revision 0.8, not a verdict that
revision 0.8 passed in full.

Slices 1–10 and their records remain unchanged. Slice 11 would finish with:

1. Link issuer/key/build/installed simulator proofs and distinguish owner from
   agent observations.
2. Retain failures, fix/retest evidence, known workarounds and untested limits.
3. Record CIEL Windows Phase 2, full live owner-cycle observation, intended DPI,
   scanner and hardware as unperformed. Phase 2 remains in its existing workstream;
   the combined hardware proof is `smc-v2-hardware-001`. Neither retroactively
   satisfies the original simulator owner's observation criterion.
4. Prepare ordinary owner-reviewed publication. A local final closeout is not
   evidence that a remote PR is pushed, reviewed or merged.
5. Preserve prior plan revision through Git and append-only decisions; no old
   event is amended or converted to a pass.

The owner explicitly selected this proposal after the unmet revision-0.8 gates
were explained: close the simulator checkpoint first and prioritize hardware,
combining proof that can be done together. No historical event was amended.

## Next executable actions

1. Complete final checkpoint delivery and ordinary publication/PR handling under
   the owner's end-of-workstream timing. Owner merge and repository synchronization
   remain separately evidenced steps.
2. Begin `smc-v2-hardware-001` slice 1 by obtaining the actual equipment inventory
   and verified connection configuration. Its one sequential lane combines real
   transport, door labels, owner-observed cycle, DPI/scanner and recovery testing.
3. Continue CIEL Windows Phase 2 separately when explicitly resumed: canonical
   clean clones, relative bindings, fresh-context reconstruction, Windows checks
   and CU12 TCP tests. Do not infer this proof from the current chat or simulator UI.
4. For real hardware, first obtain board/adapter model, driver, power specification,
   wiring/pinout and door numbering from owner-supplied equipment/manual evidence.
   A later bounded plan must define a no-patient bench test: read status first,
   unlock one identified door, observe physical opening/closing and compare audit,
   then test reconnect/restart. Stop on unknown wiring, wrong-door actuation,
   disagreement between physical and displayed state, or unsafe power behavior.
   Passing TCP simulator tests does not supply electrical or hardware evidence.

## Remaining priorities

| Priority | Work | Where / acceptance |
|---|---|---|
| P0 — before any hardware unlock | Actual CU12, adapter, power/wiring evidence, Windows driver/COM and read-only status | Hardware slice 1; exact configuration is known and stable status is observed |
| P1 — main line | One door first, then sequential physical labels/status for all twelve | Hardware slice 2; selected physical door and observed bit agree |
| P1 — same hardware session | Owner-observed load/dispense/clear, actual Windows scaling, scanner when present and matching audit | Hardware slice 3; complete real cycle witnessed, no patient data |
| P1 — after happy path | Pending restart, disconnect/reconnect and correct persistence | Hardware slice 4; no silent clearing or unintended opening |
| P2 — separate continuity proof | CIEL Windows Phase 2 | Existing paused workstream; fresh clone/session evidence, not a hardware prerequisite |
| P2 — before relying on recovery beyond this disk | Off-machine encrypted key backup | Owner chooses destination; verify a restore independently of original key/disk |
| Before first external release | Production key/issuance governance and distribution acceptance | Owner decision still needed; this development checkpoint is not release approval |
| P3 — only if useful or blocking | Launch/cache/tooling/security findings and rejected fixture cleanup | Existing limitations; keep safe workarounds, do not expand hardware scope into tooling repair |

Hardware execution, production release, off-machine key transfer and credential
changes do not follow merely from this document. Publication and owner merge
retain the normal separate evidence boundaries.
