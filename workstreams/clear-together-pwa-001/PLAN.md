# เคลียร์กัน — ระบบบิลระหว่างสองฝ่าย (ชื่อชั่วคราว)

**Workstream:** `clear-together-pwa-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

ทำ PWA ภาษาไทยสำหรับคนสองฝ่าย เพื่อเก็บบิลกับหลักฐานการโอนไว้ด้วยกัน
เห็นชัดว่ารายการไหนรอจ่าย รายการไหนจ่ายแล้ว และมียอดค้างที่ตรวจสอบได้
จุดเริ่มต้นคือผู้เบิกกับกงสี แต่แนวคิดใช้กับคนสองฝ่ายทั่วไปได้ในอนาคต

สิ่งที่เจ้าของระบุและยอมรับในการคุยก่อนเปิด workstream:

- คนเบิกแนบรูปบิล ใส่ยอดและ note แล้วส่งรายการ
- คนจ่ายแนบสลิปโอน ใส่ note และ mark จ่าย ถือว่าปิดรายการ
- ต้องการ login ด้วย ID/password สำหรับสองคน
- สนใจแนวทาง Neon + Vercel storage + Better Auth แทน Sheets/Drive
- ยอมรับภาพรวมหน้าจอและสี mockup ฟ้าพาสเทล พร้อมเปิด workstream

คำขอปัจจุบันอนุญาตให้เปิดแผนและเก็บ mockup เป็นหลักฐานถาวร (slice 1)
การลงมือสร้างแอปและการสร้างทรัพยากรภายนอกเป็นขั้นถัดไปตามขอบเขตที่เจ้าของอนุญาต

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | แผน การตัดสินใจ และหลักฐานการเปิด workstream | `.` |

ยังไม่มี child repository ของแอป การสร้างและลงทะเบียนโครงการจะอยู่ใน slice 2
ตาม `checkouts/README.md`; ไม่ลงทะเบียน repository ที่ยังไม่มีอยู่จริง
งานใน HQ ใช้ standing branch ปัจจุบันและ commit เฉพาะไฟล์ของ workstream นี้
งานใน child repository จะใช้ topic branch ตามสัญญาของโครงการนั้น

## Starting evidence

- [mockup ที่เก็บไว้](design/mockup.html) เป็น HTML fragment ของหน้าจอที่เจ้าของยอมรับ
  มีสองรูปแบบ “สมุดบิล” และ “กล่องบิล” พร้อมข้อมูลตัวอย่าง
- [Design brief](design/BRIEF.md) ระบุสี องค์ประกอบ และข้อจำกัดของ prototype
- การตรวจ prototype ก่อนเปิด workstream ผ่าน flow ส่งบิล จ่ายบิล และรักษาค่าในฟอร์ม
  เมื่อแนบรูปตัวอย่าง; ไม่พบ JS error หรือแนวนอนล้นที่ความกว้างทดสอบ 736/390/352 px
  นี่เป็นหลักฐานเฉพาะ mockup ไม่ใช่หลักฐานของระบบจริงหรือการอัปโหลดจริง
- การตรวจเครื่องมือก่อนเปิด workstream พบ Vercel CLI 48.1.6 และ GitHub CLI
  ที่ยืนยันตัวตนแล้ว; Vercel CLI อ่าน marketplace integration ของ Neon ได้
  ยังไม่มี dedicated Vercel/Neon tool ที่เรียกได้ใน session ที่ตรวจ
  ข้อสังเกตนี้เป็นความสามารถของเครื่อง ไม่ใช่ CIEL Wake fact หรือสิทธิ์สร้างบริการที่พิสูจน์แล้ว
- ยังไม่มีแอป ฐานข้อมูล Blob store บัญชีผู้ใช้จริง หรือ deployment ของผลิตภัณฑ์นี้

## Proposed v1 boundary

ข้อเหล่านี้เป็นขอบเขตเริ่มต้นของแผน ไม่ใช่คำตอบของเจ้าของต่อทุก edge case:

- หนึ่งคู่ส่วนตัว สองบัญชีที่เตรียมไว้ล่วงหน้า มีคนเบิกและคนจ่ายคนละบทบาท
- หนึ่งรายการมีรูปบิล ยอดเงินบาท และ note; note ไม่บังคับ
- หนึ่งรายการจ่ายเต็มยอดในครั้งเดียวด้วยหนึ่งสลิป; ยังไม่รองรับจ่ายบางส่วน
  หรือสลิปเดียวเคลียร์หลายรายการ
- มีสถานะ `pending` และ `paid`; ไม่มีขั้นอนุมัติหรือยืนยันรับเงินเพิ่ม
- ยอดเก็บเป็นจำนวนเต็มหน่วยสตางค์ ไม่ใช้ floating point เป็นยอดบัญชี
- คนจ่ายเท่านั้นเปลี่ยนสถานะเป็น paid และต้องมีสลิปที่บันทึกสำเร็จ
  การกดซ้ำต้องไม่เกิดหลักฐานจ่ายซ้ำหรือยอดรวมผิด
- ทั้งสองฝ่ายอ่านรายการและหลักฐานของคู่ตนได้; server ตรวจสิทธิ์ทุก read/write
- เก็บผู้สร้าง ผู้จ่าย เวลา และ note ประกอบเพื่อย้อนตรวจสอบได้
  รายการ paid ไม่เปิดแก้ยอดหรือเปลี่ยนหลักฐานผ่าน flow ปกติ
- PWA ติดตั้งลงหน้าจอหลักได้; การบันทึกบิล/จ่ายเงินต้องออนไลน์
  ไม่ cache รูปบิล สลิป หรือ response ส่วนตัวไว้ใน service worker

## Proposed implementation

- Next.js บน Vercel ทำ UI และ server routes
- Neon Postgres เก็บ claim/payment metadata และข้อมูล auth/session
- Private Vercel Blob เก็บภาพบิลและสลิป; อ่านผ่าน route ที่ตรวจ session/สิทธิ์
- Better Auth email/password และ username plugin สำหรับ ID/password
  บัญชีภายในยังต้องมี email; ปิด public signup ฝั่ง server
- รหัสผ่านใช้ password hash ของ auth library; `.env` เก็บ server secrets
  และไม่ commit ข้อมูลลับหรือรหัสผู้ใช้จริง
- ย่อภาพโดยรักษาความอ่านได้ ตรวจชนิด/ขนาดบน server และใช้ authenticated
  client upload เพื่อไม่ชนเพดาน payload ของ server function
- การ mark paid บันทึก payment และสถานะใน transaction; failure/retry ของภาพ
  ไม่ทิ้งสถานะ paid ที่ไม่มีหลักฐาน และมีการจัดการไฟล์ที่อัปโหลดแต่ไม่ได้ผูกกับรายการ

แนวทางอ้างอิงที่ตรวจแล้วในการคุยก่อนเปิดแผน:
[Better Auth username](https://better-auth.com/docs/plugins/username),
[auth options](https://better-auth.com/docs/reference/options),
[private Blob](https://vercel.com/docs/vercel-blob/private-storage),
[client uploads](https://vercel.com/docs/vercel-blob/client-upload),
[Blob quotas](https://vercel.com/docs/vercel-blob/usage-and-pricing),
[Vercel Hobby](https://vercel.com/docs/plans/hobby),
[Neon plans announcement](https://neon.com/blog/neon-backend-is-ga).
ตรวจแผนบริการและข้อจำกัดจริงอีกครั้งก่อนสร้างทรัพยากร ไม่ถือว่า free รองรับทุกการใช้งาน

## Execution slices and acceptance criteria

### 1. Open the workstream and preserve the approved mockup

**Result:** กลับมาอ่านจาก repo แล้วรู้เป้าหมาย หน้าตา ขอบเขตเริ่มต้น และเรื่องที่ยังไม่ตัดสินใจ

**Scope:** แผน 0.1, mockup เดิม, design brief, opening decision และ closeout
ใน HQ เท่านั้น ไม่มี child app หรือทรัพยากรภายนอกใน slice นี้

**DoD / proof:**

- Wake อ่าน workstream พร้อม project link และ opening decision slice 1 ได้
- mockup เก็บเป็น source โดยไม่มี session locator หรือข้อมูลลับ
- `git diff --check` และ Wake ไม่มี validation error ใหม่
- closeout มี Git checkpoint และระบุขั้นถัดไปพร้อม unknowns ที่เหลือ

**Review:** เจ้าของอ่านแผนและ design brief ก่อนเริ่ม slice 2

### 2. Build one complete local flow with two accounts

**Result:** login คนเบิก → ส่งรูปบิลจริง → login คนจ่าย → แนบสลิปจริง →
จ่ายแล้ว พร้อมยอดค้างและประวัติที่ตรงกัน

**Dependency:** เจ้าของอนุญาตเริ่มสร้างแอปและยืนยันขอบเขต v1; ถ้าต้องใช้ remote
DB/Blob ในการพัฒนา ต้องได้รับอนุญาตสร้างทรัพยากรและเลือกแผนบริการก่อน

**Scope:** สร้าง child repository และ project registration; ทำ design contract
จาก brief; auth, schema/migration, private attachments และ UI หนึ่ง flow ครบวงจร
ใช้ isolated test database และไฟล์สังเคราะห์ในการพิสูจน์

**DoD / proof:**

- มี migration และวิธีสร้างสองบัญชีอย่างปลอดภัยโดยปิด public signup
- E2E ด้วยสอง session แยกกันพิสูจน์ยอดเงิน รูปจริง note และ paid history หลัง reload
- ผู้ไม่ login/ผู้ไม่มีสิทธิ์เปิดรูปและแก้รายการไม่ได้; คนเบิก mark paid ไม่ได้
- error ระหว่าง upload/commit และการกดจ่ายซ้ำไม่สร้างรายการ paid ที่ไม่มีสลิป
  หรือยอดรวมผิด; ทดสอบ transaction/retry ที่มีผลต่อข้อมูลจริง
- มือถือใช้งานได้และสี/องค์ประกอบตรง design contract; build ผ่าน
- review auth, สิทธิ์, การเก็บภาพ และ transaction พร้อม diff ที่เจ้าของตรวจได้

**Location / review:** child repo ใช้ topic branch; HQ เก็บ decision/closeout
เจ้าของตรวจ UI และหลักฐาน flow ก่อนอนุญาต preview deployment

### 3. Deploy a private preview and verify installed use

**Result:** เปิดบนโทรศัพท์จริง ติดตั้ง PWA และทดลอง flow ด้วยข้อมูลสังเคราะห์ได้

**Dependency:** อนุญาต external writes; ยืนยันบัญชี/scope/แผนบริการและทรัพยากรใหม่
ใช้ CLI ที่รองรับ private Blob และตรวจ permission จากการสร้างจริง
ไม่ใช้ resource ของแอปอื่นที่มีอยู่แล้ว

**DoD / proof:**

- preview ใช้ DB/Blob แยกและ server secrets ถูกตั้งโดยไม่เข้าประวัติ Git
- HTTPS/login/private reads ผ่านบน deployment; service worker ไม่ cache ข้อมูลส่วนตัว
- ทดสอบ flow บนมือถือจริง รวม reload, logout, กลับเข้าใช้ และติดตั้ง PWA
- ข้อจำกัด quota และการกู้คืนข้อมูล/ภาพมีวิธีที่เจ้าของตรวจและปฏิบัติได้

**Review:** ส่ง preview และผลทดสอบให้เจ้าของยอมรับก่อนใช้บิลจริง

### 4. Deliver the first private pilot

**Result:** สองคนใช้งานจริงได้ตาม flow ที่ยอมรับ และรู้วิธีดูยอด/หลักฐานย้อนหลัง

**Dependency:** เจ้าของยอมรับ preview และอนุญาตเปิดใช้งานจริง

**DoD / proof:**

- มีสองบัญชีจริงโดยไม่เผย credentials ใน repo/event/response
- ใช้รายการนำร่องที่เจ้าของเลือก ตรวจยอดค้างและ paid history กับหลักฐานจริง
- มีขั้นตอน backup/restore ของ metadata และภาพที่ทดสอบด้วยข้อมูลสังเคราะห์
  พร้อมวิธีดูแล quota และจัดการกรณีทำรายการผิดที่เจ้าของยอมรับ
- ส่งวิธีใช้งานสั้น ๆ และข้อจำกัด v1; เจ้าของตรวจรับ
- child project PR/merge และ HQ closeout ตามสัญญาโครงการ พร้อม checkpoint

**Review:** owner review ก่อน merge และยืนยันการส่งมอบ ไม่ถือว่า deploy เท่ากับตรวจรับ

## Unresolved and next action

- ชื่อ “เคลียร์กัน”, child repo ID และ domain ยังเป็นข้อเสนอ ไม่ใช่แบรนด์สุดท้าย
- ยังไม่ตัดสินใจใช้ “สมุดบิล” หรือ “กล่องบิล” เป็น layout หลัก; แนะนำกล่องบิลสำหรับมือถือ
- ต้องยืนยันขอบเขตจ่ายเต็มหนึ่งบิล/หนึ่งสลิปก่อน implementation รวมวิธีแก้รายการผิด
- email ของสองบัญชี วิธีส่งมอบรหัสและ recovery ยังไม่ได้กำหนด
- การใช้งานกงสีเป็นส่วนตัวหรือเกี่ยวกับธุรกิจยังไม่ชัด; ต้องตรวจสิทธิ์ใช้ Hobby
  แผนบริการ ค่าใช้จ่ายที่ยอมรับ และ permission การสร้าง resource ก่อน provisioning
- quota/retention/backup ของรูปยังต้องตกลง; free เป็นเป้าหมาย ไม่ใช่คำรับรอง
- Wake ไม่ยืนยัน human approval/review หรือ external rules นอก repository record;
  อำนาจใน opening decision ครอบคลุม slice 1 เท่านั้น

**Next action:** เจ้าของตรวจแผน 0.1; เมื่ออนุญาตเริ่ม slice 2 ให้ยืนยันขอบเขต v1
และสร้าง child repository ก่อนลงมือ flow แรก การเปิด workstream นี้ยังไม่เริ่ม implementation
