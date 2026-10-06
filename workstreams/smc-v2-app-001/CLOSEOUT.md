# SMC Windows simulator checkpoint — evidence and closure proposal

Prepared on 2026-10-06 from repository records and local Git.
Current approved plan: revision 0.8. This document does not amend that plan.

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
| 11.5 Final delivery | This evidence bundle and proposed next hardware test are prepared | Revision 0.8 cannot be reported fully passed; closure scope requires owner decision; publication/PR/merge are not yet completed |

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

## Closure proposal for owner decision

Proposed revision 0.9 would close this workstream at the tested simulator evidence
checkpoint. Completion would mean delivery of that evidence and explicit stopping
of the unperformed acceptance requirements from revision 0.8, not a verdict that
revision 0.8 passed in full.

Slices 1–10 and their records remain unchanged. Slice 11 would finish with:

1. Link issuer/key/build/installed simulator proofs and distinguish owner from
   agent observations.
2. Retain failures, fix/retest evidence, known workarounds and untested limits.
3. Record CIEL Windows Phase 2, full live owner-cycle observation, intended DPI,
   scanner and hardware as unperformed; Phase 2 remains in its existing workstream,
   rather than blocking SMC simulator checkpoint closure under the new revision.
4. Prepare ordinary owner-reviewed publication. A local final closeout is not
   evidence that a remote PR is pushed, reviewed or merged.
5. Preserve prior plan revision through Git and append-only decisions; no old
   event is amended or converted to a pass.

This proposal needs owner confirmation because approved revision 0.8 explicitly
makes Phase 2 a final-delivery gate. The request to close prompted the proposal;
it is not recorded here as confirmation that the owner knowingly removed that gate.

## Next executable actions

1. Decide between checkpoint closure (revision 0.9 proposal above) and completing
   all remaining revision-0.8 gates before final closeout.
2. If checkpoint closure is chosen, record the exact decision and final delivery;
   finish ordinary publication/PR handling at the owner's chosen timing. Owner
   merge and repository synchronization remain separately evidenced steps.
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

No hardware execution, production release, off-machine key transfer, credential
change, publication or remote merge is performed by preparing this document.
