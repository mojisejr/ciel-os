# เคลียร์กัน — รายจ่ายของเราและชื่อแสดงผล

**Workstream:** `clear-together-expenses-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** idle
**Parallelism:** none

## Goal and owner agreement

สองคนเห็นรายการรายจ่ายร่วมกัน รู้ว่าเงินออกไปเท่าไรและกับอะไร ช่วยกันคุมการใช้เงิน
โดยจดได้เร็ว ไม่ต้องเรียนรู้ระบบ agent และไม่เพิ่มช่องบังคับเกินยอดเงินกับรายละเอียด
ต่อยอดในแอปเคลียร์กันเดิม เป็นฟีเจอร์แยกจากการส่งบิลเบิกคืน

เจ้าของยืนยันหลัง syncup:

- ทั้งสองคนอ่านรายการรายจ่ายเดียวกันได้ รวมรายการงาน ส่วนตัว และไม่ระบุประเภท
- กรอกบังคับสองช่อง: จำนวนเงินบาท และรายละเอียดว่าจ่ายอะไร/ให้ใคร
- ประเภทงาน/ส่วนตัวเป็นตัวเลือก ไม่เลือกได้ และไม่บังคับรูปหรือสลิป
- วันที่ใช้วันนี้อัตโนมัติ เปลี่ยนย้อนหลังได้เมื่อจำเป็น
- ระบุคนจดตาม session เสมอ และเลือก “จดแทน [ชื่ออีกคน]” ได้โดยไม่เพิ่มช่องบังคับ
- คนจดกับผู้ที่จดแทนเป็นคนละข้อมูล ไม่ตีความว่าทั้งสองเป็นผู้จ่ายเงินจริง
  ถ้าต้องการระบุคนจ่ายจริงให้เขียนในรายละเอียด ยอดสรุปเป็นรายจ่ายร่วมกัน
- เฉพาะคนจดแก้/ยกเลิกรายการของตัวเอง ทั้งคู่ดูประวัติการเปลี่ยนแปลงได้
- ตั้งชื่อแสดงผลของตัวเองได้ ใช้ ID/password เดิม เปลี่ยนชื่อแล้วบัญชีและประวัติยังเป็นคนเดิม
- ดูยอดวันนี้/เดือนนี้ กรองงาน/ส่วนตัว/ไม่ระบุ และค้นรายละเอียดพร้อมยอดรวมของผลค้น
- ยืนยันรูปแบบจดแทนในรอบสุดท้ายด้วยคำตอบ “เอาตามนี้”

คำยืนยันนี้อนุญาตเปิด workstream และเตรียมแผน ไม่ถือเป็นคำสั่งเริ่ม implementation
หรืออนุญาต migration/deployment กับข้อมูลจริงโดยอัตโนมัติ

## Project links

| Project | Role | Local binding |
|---|---|---|
| `ciel-os` | แผน decision และ closeout | . |
| `clear-together` | private PWA ที่เจ้าของใช้อยู่ | checkouts/clear-together |

- งานเดิม `clear-together-pwa-001` completed revision 0.5; ไม่เปิดหรือแก้แผนเก่านั้น
- Child main clean และตรง fetched origin/main ที่ `1858cc41fe9f69ea7a799972086b5262a3a3a54a`
- `migrations/000_auth.sql` มี user.name แล้ว; `scripts/accounts.ts` เปลี่ยนชื่อผ่าน admin script
- `components/app.tsx` แสดงชื่อ session/member; `lib/ledger.ts` อ่านชื่อจาก user ตาม ID
- Better Auth ที่ติดตั้งมี /update-user ซึ่งเลือกผู้ใช้จาก session และอัปเดต session cookie
  พบใน node_modules/better-auth/dist/api/routes/update-user.mjs; ยังไม่ใช่ผลทดสอบ UI ตั้งชื่อ
- `migrations/001_ledger.sql` และ `lib/ledger.ts` แยก claims/payments และบังคับหลักฐานภาพ
  ข้อมูลรายจ่ายใหม่จึงต้องเป็นตาราง/route แยก ไม่ใช้ claim ที่ทำให้เกิดยอดค้าง
- `scripts/migrate.ts` ใช้ migration checksum และ transaction; ห้ามแก้ migration เดิม
- `scripts/backup.ts` และ `scripts/restore.ts` มี allowlist ตารางระบบบิลเดิม
  ต้องขยายให้รวมรายจ่าย/ประวัติและยังรับ backup รุ่นเดิมได้
- `playwright.config.ts` และ `tests/setup.ts` ล็อกการทดสอบไว้ที่ Postgres local :55439
- `DESIGN.md`, `components/ui.tsx`, `app/globals.css` เป็น design contract ฟ้า/มิ้นต์/พีชเดิม

## Scope, invariants and constraints

- UI แยก “บิลระหว่างเรา” กับ “รายจ่ายของเรา”; รายจ่ายไม่สร้าง claim/payment หรือเปลี่ยนยอดเบิกคืน
- ใช้สองบัญชีเดิม ไม่มีสมัครสมาชิกหรือเปลี่ยน credentials ผ่านฟีเจอร์ชื่อแสดงผล
  ชื่อใหม่แสดงร่วมทั้งแอป รวมหน้าบิล แต่ user ID ยอดเงิน และเจ้าของรายการไม่เปลี่ยน
- ค่าเริ่มต้นของฟอร์ม: วันไทยปัจจุบัน, ประเภทไม่ระบุ, ไม่จดแทน
  ตัวเลือกวันที่/ประเภท/จดแทนต้องไม่ขัดจังหวะการกรอกสองช่องและบันทึก
- จดแทนเลือกได้เฉพาะอีกบัญชีในคู่; server กำหนด recorded_by จาก session ไม่รับ actor จาก client
- วันรายจ่ายเป็น date ที่ผู้ใช้เลือก แยกจาก timestamp ที่บันทึก/แก้; ยอดรายวันและเดือนใช้วันรายจ่าย
  วันนี้/เดือนนี้อิง Asia/Bangkok; ย้อนหลังได้ ไม่ใช้วันอนาคตสำหรับรายการที่จ่ายแล้ว
- ยอดเก็บสตางค์เป็นจำนวนเต็มบวก ไม่ใช้ float; ยอดรวมคำนวณจากข้อมูลที่ตรง filter ทั้งหมด
  ไม่คำนวณแค่รายการที่โหลดในหน้าปัจจุบัน และไม่รวมรายการยกเลิก
- ค้นข้อความในรายละเอียด ไม่จัดประเภทอาหาร/ค่าแรงเองจากข้อความหรืออ้างผลวิเคราะห์ที่ไม่มีข้อมูล
- การแก้/ยกเลิกเก็บผู้ทำ เวลา before/after; ไม่ลบข้อมูลถาวรและไม่แก้ประวัติทับ
  ต้องตรวจ version เพื่อไม่ให้การแก้จากสองหน้าที่เปิดค้างทับกันเงียบๆ
- Refresh/reload ต้องอ่านข้อมูลจาก server; ไม่ทำ realtime polling หรือ background cron
- server ตรวจสมาชิก/สิทธิ์และ Origin; response ส่วนตัว no-store และ service worker ไม่ cache รายจ่าย/profile
- ใช้ Neon Free project เดิม หนึ่ง branch และ Vercel Pro scope เดิม; ไม่เพิ่มบริการ แพ็กเกจ หรือ billing
  ไม่ทดสอบ/reset ข้อมูลบน production และไม่สร้าง Neon preview branch
- ทดสอบ migration/flow/restore ใน local Postgres; preview ไม่เชื่อม DB ข้อมูลจริง
- ก่อน deploy ตรวจ plan/branch count/provider scope อีกครั้งและ backup จริงก่อน additive migration
  Vercel Pro มี metered usage ร่วมทีม; เพดานในแอปไม่รับประกันค่าเพิ่มศูนย์
- เจ้าของ review/merge PR เอง; ใช้ draft PR จน closeout อยู่บน head และพิสูจน์แล้ว
- deploy ใช้ clean Git export และ .vercelignore เดิม ไม่ส่ง .local/env/credentials/backup

## Execution and review

ทำตามลำดับด้วย executor หนึ่ง lane; ไม่ dispatch หรือสร้าง worktree/branch ในขั้นวางแผน
ก่อน implementation ผ่าน child clean-main gate แล้วใช้ topic branch `codex/shared-expenses`
HQ ใช้ standing branch ปัจจุบันและ stage เฉพาะ paths ของ workstream นี้

ตารางเวลาคือประมาณเวลางาน ไม่ใช่ราคาบริการหรือเวลาส่งมอบที่รับประกัน

| Slice / review | ผลที่พิสูจน์ได้ | ผู้ทำ | ที่ไหน | ต้องรอ | เวลาประมาณ |
|---|---|---|---|---|---|
| 1 | ขอบเขตที่ยืนยันและแผนอ่านต่อได้จาก CIEL | Codex ผู้เตรียมแผน | HQ standing branch | syncup จบ | 0.5 ชม. |
| 2 | ทั้งคู่ตั้งชื่อเองและเห็นชื่อถูกหลัง refresh | executor เดียว | child topic branch | owner อนุญาตลงมือ | 1–2 ชม. |
| R2 หนัก | ตรวจ auth/self-only update, session และผลต่อบิลเดิม | ผู้ตรวจ implementation + owner review | diff/local E2E | slice 2 | 0.5 ชม. |
| 3 | จด/จดแทน/ย้อนหลัง แก้และยกเลิกได้ โดยยอดบิลไม่เปลี่ยน | executor เดิม | child topic branch | slice 2 review | 2–4 ชม. |
| R3 หนัก | ตรวจ schema, เงิน, permissions, history และ retries | ผู้ตรวจ implementation + owner review | diff/local E2E | slice 3 | 0.5–1 ชม. |
| 4 | ดูยอดวันนี้/เดือนนี้ กรองและค้นแล้วได้ยอดครบ | executor เดิม | child topic branch | slice 3 review | 1–2 ชม. |
| R4 หนัก | ตรวจยอด filtered ทั้งชุดและขอบเขตวัน/เดือน | ผู้ตรวจ implementation + owner review | diff/local E2E | slice 4 | 0.5 ชม. |
| 5 | backup/restore ครบและส่ง PR/วิธีใช้งานที่ตรวจได้ | executor เดิม | child PR + HQ | slice 4 review | 1–2 ชม. |
| R5 หนัก | owner merge และอนุญาต rollout; ตรวจ migration/production read | owner + executor ตรวจหลัง merge | PR/deployment | slice 5 proof | 0.5–1 ชม. |

ผู้ตรวจในตารางเป็นหน้าที่ตรวจ ไม่ใช่ทีม/บัญชีอื่นที่ถูกสร้างหรือ dispatch แล้ว
อาจส่งงานทั้งชุดผ่านหนึ่ง PR ตามลำดับ slices โดยตรวจแต่ละ checkpoint ก่อนขยายต่อ

## Execution slices and acceptance criteria

### 1. Open the workstream and preserve the confirmed scope

**Value:** กลับมาอ่าน CIEL แล้วรู้ว่าเราจะทำอะไร แยกจากงานส่งบิลอย่างไร และรอคำอนุญาตตรงไหน

**Paths:** workstreams/clear-together-expenses-001/PLAN.md; opening decision และ closeout ใต้ memory/events/

**Proof:** Wake เห็น workstream ใหม่ ไม่มี validation error; แผนเดิมและ child code ไม่เปลี่ยน
บันทึกคำตอบวันที่/จดแทน/สิทธิ์แก้และขอบเขตที่ยืนยันครบ; owner ตรวจแผนก่อนเริ่ม slice 2

### 2. Set and display each member's own name

**Value:** ตั้งชื่อในแอปได้ ทั้งคู่เห็นว่าใครเป็นใครโดยใช้บัญชีเดิม

**Candidate paths:** components/app.tsx, components/profile.tsx (ใหม่), lib/client.ts, lib/auth.ts,
app/api/profile/route.ts (ถ้าต้องใช้ wrapper สำหรับ validation), app/globals.css, tests/profile.spec.ts (ใหม่)

**DoD / proof:**

- คนแรกและคนที่สองเปลี่ยนชื่อของตัวเองได้ ผ่าน supported auth update path ที่ตรวจสมาชิกและ server validation
- หลัง refresh/reload ชื่อถูกใน session/member/header และหน้าบิลเดิม; ไม่ต้องตั้งรหัสใหม่
- ปฏิเสธชื่อว่าง/ยาวเกิน; คำขอ anonymous/ต่าง Origin/พยายามเปลี่ยนชื่ออีกคนไม่ผ่าน
- user ID, username, credential, claims/payments และยอดเดิมไม่เปลี่ยน
- local E2E สอง session ตรวจผลจริงหลัง reload และ privacy; typecheck/build ผ่าน

**Review:** หนัก เพราะแตะ auth กับชื่อที่มาจาก session และ query หลายจุด

### 3. Record and correct shared expenses end to end

**Value:** จดสองช่องแล้วทั้งคู่เห็นรายการ วันที่ คนจด และจดแทน; แก้ผิดได้พร้อมประวัติ

**Candidate paths:** migrations/003_shared_expenses.sql (ใหม่), lib/expenses.ts (ใหม่),
app/api/expenses/[...path]/route.ts (ใหม่), components/expenses.tsx (ใหม่), components/app.tsx,
app/globals.css, lib/security.ts (reuse; แก้เฉพาะจำเป็น), tests/expenses.spec.ts (ใหม่), tests/setup.ts

**DoD / proof:**

- มีรายละเอียด/จำนวนเงินเป็นสองช่องบังคับ โดยไม่แนบรูปก็ส่งได้; วันไทยวันนี้เป็นค่าเริ่มต้น
- ไม่เลือกประเภทบันทึกได้; เลือกงาน/ส่วนตัว, วันที่ย้อนหลัง และจดแทนอีกคนได้จริงหลัง reload
- server ติดคนจดจาก session; รายการ “จดโดย A · จดแทน B” ไม่ทำให้ B ได้สิทธิ์แก้รายการของ A
- สอง session จด/อ่านได้; เฉพาะผู้จดแก้หรือยกเลิก และทั้งคู่ดู history ได้
- retry ของการสร้างไม่ทำรายการซ้ำ; version conflict ไม่ทับข้อมูล; รายการยกเลิกไม่รวมในยอด
- ตรวจคำขอ actor ปลอม, บุคคลนอกคู่, amount/วันที่ผิด, anonymous และ cross-origin
- ก่อน/หลังทุก flow claim/payment และยอดเบิกคืนเดิมเท่ากัน; ไม่มีการเปลี่ยน receipt/slip เดิม
- local E2E และ targeted money/date validation tests ผ่าน; ใช้ synthetic data เท่านั้น

**Review:** หนัก เพราะเพิ่ม schema/write path และ aggregate เงิน; ไม่ใช้ production เป็น test environment

### 4. Understand today's and this month's spending

**Value:** เปิดรายจ่ายร่วมกันแล้วเห็นเงินออกไปกับอะไร กรอง/ค้นได้พร้อมยอดรวมที่เชื่อถือได้

**Candidate paths:** lib/expenses.ts, components/expenses.tsx, app/api/expenses/[...path]/route.ts,
app/globals.css, tests/expenses.spec.ts, tests/expense-totals.spec.ts (ถ้าจำเป็น)

**DoD / proof:**

- วันนี้/เดือนนี้สรุปตามวันรายจ่าย Asia/Bangkok รวมของสองคน ไม่เรียกยอดของคนจดว่าเป็นยอดที่คนนั้นจ่าย
- กรองงาน/ส่วนตัว/ไม่ระบุ และค้น “ค่าข้าว”/“พี่สุด” แล้วรายการกับยอดตรงเงื่อนไขเดียวกัน
- pagination ไม่ทำยอดรวมตกหล่น; แก้/ยกเลิก/เปลี่ยนวันแล้วรายการและยอด refresh ถูก
- ทดสอบก่อน/หลังเที่ยงคืนไทย ข้ามเดือน รายการย้อนหลัง และข้อมูลมากกว่าหน้าแรก
- UI ภาษาไทยสีเดิม 320/390/736px อ่านได้ กดได้ และสถานะ loading/error/empty ไม่ทำให้เข้าใจว่ายอดเก่าคือยอดล่าสุด
- no-store และ service-worker cache privacy ยังผ่าน ทั้งรายจ่ายและระบบบิลเดิม

**Review:** หนัก เพราะ correctness ของยอดขึ้นกับ query/date/filter ไม่ใช่แค่ข้อความ UI

### 5. Deliver and roll out without losing existing records

**Value:** เจ้าของตรวจ PR และเริ่มใช้รายจ่ายได้ พร้อมวิธีดูแลและกู้คืนทั้งรายจ่ายกับบิล

**Candidate paths:** scripts/backup.ts, scripts/restore.ts, tests/expenses.spec.ts,
tests/ledger.spec.ts (regression/reset isolation เมื่อจำเป็น), docs/OPERATIONS.md, README.md,
DESIGN.md, docs/delivery/*, HQ workstream closeout

**DoD / proof:**

- backup/restore รวม expenses/history และบิล/ภาพเดิม; checksum และ IDs/ชื่อ/ประวัติครบหลัง restore ที่ local empty target
- restore backup รุ่นเดิมยังทำได้โดยไม่สมมติว่ามีตารางใหม่ใน snapshot; เป้าหมายที่มีข้อมูลยังถูกปฏิเสธ
- local E2E ใหม่และระบบบิลเดิม, build, typecheck, design/accessibility/privacy ผ่านตามความเสี่ยงที่เปลี่ยน
- draft PR มี scoped diff, ผลทดสอบ, migration/backup/rollback steps และ closeout ที่ commit/push แล้ว verified บน head
- owner review/merge เอง; ก่อน migration/deploy จริงต้องมีคำอนุญาต rollout ที่ชัดเจน
- หลัง backup ใช้ additive migration ไม่เปลี่ยน migration checksum เก่า; ลง schema ก่อน code ที่ใช้ตารางใหม่
  หากต้อง rollback ให้ย้อน code โดยเก็บข้อมูลใหม่ไว้ ไม่ drop ตาราง/ลบหลักฐานเพื่อให้กลับไปได้
- ไม่ auto-test mutations บน DB ที่เจ้าของใช้อยู่; production smoke เป็น read-only และใช้ owner session ที่อนุญาต
- ตรวจ Neon Free หนึ่ง branch, Vercel scope เดิม, sensitive env และ clean deployment packaging ก่อน rollout
- คู่มือสั้น: ตั้งชื่อ จด/จดแทน ลงย้อนหลัง กรอง/ค้น แก้/ยกเลิก และ backup; physical-phone acceptance ตาม owner ทดลองจริง
- event สุดท้ายบันทึก merge/deployment/acceptance ที่พิสูจน์จริง แยก unknowns ไม่ปิด workstream จาก URL อย่างเดียว

## Unresolved and next action

- แผนนี้ยังไม่อนุญาต implementation slice 2–5 หรือ production migration/deploy; owner ต้องตรวจแล้วสั่งเริ่ม
- live provider plan/branch count, credentials และ deployment currentness ยังไม่ได้ตรวจรอบใหม่; ตรวจเมื่อ rollout
- เจ้าของรายงานว่าได้ลองแอปเดิมแล้วตอบโจทย์; ไม่อนุมานว่า phone install/real-pilot criteria เก่าครบทุกข้อ
- Retired private Blob store/token และ provider source-retention จาก closeout เดิมยังไม่ยืนยันว่าถูกจัดการแล้ว
  ฟีเจอร์นี้ไม่เพิ่มรูปหรือ store; ไม่ใช้การเปิดงานใหม่เป็นเหตุลบ store หรือรายงานว่าปัญหาเก่าปิด
- ไม่เพิ่มเงินเข้า งบ/แจ้งเตือน ใช้ AI แยกประเภท หรือเชื่อมธนาคารในรอบนี้; รายจ่ายร่วมกันขึ้นกับข้อมูลที่ทั้งคู่จด
- ไม่แก้ OWNER.md/AGENTS.md หรือสร้าง global skill/agent infrastructure จากการวางแผนนี้

**Next action:** owner ตรวจแผน slice 2–5 แล้วอนุญาตเริ่ม implementation; เริ่มตั้งชื่อก่อนจดรายจ่าย
