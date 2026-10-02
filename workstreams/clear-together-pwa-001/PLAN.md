# เคลียร์กัน — ระบบบิลระหว่างสองฝ่าย (ชื่อชั่วคราว)

**Workstream:** `clear-together-pwa-001`
**State:** completed
**Execution lane:** single
**Plan revision:** 0.5
**Execution phase:** 4
**Execution state:** idle
**Parallelism:** none

## Objective and owner agreement

ทำ PWA ภาษาไทยสำหรับคนสองฝ่าย เพื่อเก็บบิลกับหลักฐานการโอนไว้ด้วยกัน
เห็นชัดว่ารายการไหนรอจ่าย รายการไหนจ่ายแล้ว และมียอดค้างที่ตรวจสอบได้
ผู้ใช้เริ่มต้นคือเจ้าของกับแฟนสองคน ใช้เบิกจ่ายระหว่างกันเป็นส่วนตัว
ไม่ใช่ระบบกงสีหรือบริการเปิดให้บุคคลทั่วไปสมัคร

สิ่งที่เจ้าของระบุและยอมรับในการคุยก่อนเปิด workstream:

- คนเบิกแนบรูปบิล ใส่ยอดและ note แล้วส่งรายการ
- คนจ่ายแนบสลิปโอน ใส่ note และ mark จ่าย ถือว่าปิดรายการ
- ต้องการ login ด้วย ID/password สำหรับสองคน
- สนใจแนวทาง Neon + Vercel storage + Better Auth แทน Sheets/Drive
- ยอมรับภาพรวมหน้าจอและสี mockup ฟ้าพาสเทล พร้อมเปิด workstream

เจ้าของยืนยันเพิ่มเติมให้ใช้ private repository ไม่มีหน้าสมัครสมาชิก
จัดการบัญชีเอง รองรับจ่ายรวมหลายบิลถ้า UI ยังง่าย และใช้วิธีแก้รายการผิดตามข้อเสนอ
ข้อจำกัดเดิมคือฟรีเท่านั้นและห้ามสร้าง Neon branch เพิ่ม; เจ้าของยืนยันล่าสุด
ให้ใช้ Vercel Pro เดิมเฉพาะทรัพยากรที่จำเป็นต่อ deployment และใช้ Neon แยก
จาก marketplace installation ที่เป็น Launch โดยคง Neon Free หนึ่ง branch
คำยืนยันนี้เกิดหลังแจ้งว่า Pro มี metered usage และไม่รับประกันค่าเพิ่มศูนย์
ห้ามสมัครแพ็กเกจ/add-on ใหม่ เปลี่ยน billing ทีม หรือใช้ Neon paid/trial
เจ้าของจะ review และ merge PR เอง
เจ้าของสั่งให้ลุยต่อครบงานหลัง syncup: อนุญาต implementation และทรัพยากรที่ตรวจ
ยืนยันว่า Neon เป็น Free และ Vercel เป็น Hobby หรือ Pro เดิมตามคำยืนยันล่าสุด;
owner review ยังจำเป็นก่อน merge
และข้อมูลบิลจริงต้องมาจากเจ้าของเมื่อเริ่ม pilot

## Owner closure boundary — revision 0.5

หลังเจ้าของ merge PR #1 เจ้าของยืนยันให้ “ปิดงานส่งมอบ เลื่อนการลองใช้งานจริงไว้ภายหลัง”
บันทึกคำยืนยันใน `memory/events/2026/10/02/20261002T211316_clear_together_delivery_only_closure_authorized.yaml`
ขอบเขตปิดรอบนี้คือแอปที่ merge/deploy แล้ว พร้อมบัญชีทดลอง เอกสารดูแล และหลักฐานทดสอบ
ปรับ slice 4 เป็นการตรวจหลัง merge และส่งมอบ ไม่ถือว่าการติดตั้งบนมือถือจริงหรือ pilot
ด้วยบิลจริงผ่านแล้ว เกณฑ์เหล่านั้นเลื่อนไปหลังส่งมอบตามคำยืนยันของเจ้าของ
ไม่มีการแก้โค้ดแอปหรือเพิ่มทรัพยากรจากการปรับขอบเขตนี้

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | แผน การตัดสินใจ และหลักฐานการเปิด workstream | `.` |
| `clear-together` | private application repository | `checkouts/clear-together` |

child repository ใช้ private canonical remote `github.com/mojisejr/clear-together`
และ local binding ตาม `checkouts/README.md`
งานใน HQ ใช้ standing branch ปัจจุบันและ commit เฉพาะไฟล์ของ workstream นี้
งานใน child repository จะใช้ topic branch ตามสัญญาของโครงการนั้น

## Starting evidence at workstream opening

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

- หนึ่งคู่ส่วนตัว สองบัญชีที่เจ้าของสร้าง/รีเซ็ตเองด้วยขั้นตอนที่ถูกต้องของ auth
  ไม่มีหน้า register และปิด public signup บน server
- เจ้าของยืนยันให้ทั้งสองคนส่งบิลหากันได้ บทบาทขึ้นกับแต่ละบิล:
  คนสร้างเป็นคนเบิก อีกคนเป็นคนจ่าย แสดงยอดที่ต้องคืนกันแยกตามผู้จ่าย
  ไม่หักกลบยอดระหว่างคนโดยอัตโนมัติ
- หนึ่งรายการมีรูปบิล ยอดเงินบาท และ note; note ไม่บังคับ
- เลือกบิลรอจ่ายหนึ่งหรือหลายรายการของผู้จ่าย/ผู้รับคู่เดียวกัน แล้วแนบสลิปครั้งเดียว
  จ่ายเต็มยอดรวมที่เลือก ไม่รองรับจ่ายบางส่วน; แสดงยอดรวมก่อนยืนยัน
  flow บิลเดียวใช้ได้โดยไม่ต้องเรียนรู้ขั้นตอนเพิ่ม
- มีสถานะ `pending`, `paid` และ `cancelled`; ไม่มีขั้นอนุมัติหรือยืนยันรับเงินเพิ่ม
  cancelled ไม่รวมในยอดค้างหรือยอดจ่าย
- ยอดเก็บเป็นจำนวนเต็มหน่วยสตางค์ ไม่ใช้ floating point เป็นยอดบัญชี
- คนจ่ายเท่านั้นเปลี่ยนสถานะเป็น paid และต้องมีสลิปที่บันทึกสำเร็จ
  การกดซ้ำต้องไม่เกิดหลักฐานจ่ายซ้ำหรือยอดรวมผิด
- ทั้งสองฝ่ายอ่านรายการและหลักฐานของคู่ตนได้; server ตรวจสิทธิ์ทุก read/write
- เก็บผู้สร้าง ผู้จ่าย เวลา และ note ประกอบเพื่อย้อนตรวจสอบได้
  คนสร้างแก้ไข/ยกเลิกบิล pending ได้; paid ไม่แก้ยอดหรือทับหลักฐานเดิม
- ผู้จ่ายย้อนการจ่ายพร้อมเหตุผลได้ โดยคงสลิปและประวัติเดิมไว้
  ขอบเขตย้อนเป็น payment ทั้งชุด เพื่อไม่ให้สลิปของหลายบิลเหลือยอดคลุมเครือ
  บิลในชุดกลับเป็น pending ใน transaction เดียวก่อนสร้างการจ่ายใหม่
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
- บีบอัดภาพบนอุปกรณ์ก่อนอัปโหลด โดยรักษายอด วันที่ และรายละเอียดให้อ่านได้
  มี preview ให้ตรวจ; ถ้าบีบแล้วอ่านไม่ได้ให้ปรับ/ถ่ายใหม่ ไม่ส่งภาพที่เสียความอ่านได้
  ตรวจชนิด/ขนาดฝั่ง server และใช้ authenticated client upload
  เก็บฉบับที่บีบแล้วเป็นหลัก ไม่เก็บไฟล์ต้นฉบับซ้ำโดยอัตโนมัติ
- การ mark paid บันทึก payment, payment-to-claim links และสถานะของทุกบิล
  ที่เลือกใน transaction; failure/retry ของภาพ
  ไม่ทิ้งสถานะ paid ที่ไม่มีหลักฐาน และมีการจัดการไฟล์ที่อัปโหลดแต่ไม่ได้ผูกกับรายการ

แนวทางอ้างอิงที่ตรวจแล้วในการคุยก่อนเปิดแผน:
[Better Auth username](https://better-auth.com/docs/plugins/username),
[auth options](https://better-auth.com/docs/reference/options),
[private Blob](https://vercel.com/docs/vercel-blob/private-storage),
[client uploads](https://vercel.com/docs/vercel-blob/client-upload),
[Blob quotas](https://vercel.com/docs/vercel-blob/usage-and-pricing),
[Vercel Hobby](https://vercel.com/docs/plans/hobby),
[Neon plans announcement](https://neon.com/blog/neon-backend-is-ga).
ตรวจแผนบริการและข้อจำกัดจริงอีกครั้งก่อนสร้างทรัพยากร; Neon ต้องเป็น Free
ห้าม trial หรือ paid upgrade ใหม่ Vercel Pro เดิมเป็นข้อยกเว้นที่เจ้าของยืนยัน
และยังมีความเสี่ยง usage เกินรวมกับงานอื่นในทีม

## Mandatory provider and cost boundary (revision 0.4)

- Vercel ใช้ Pro เดิมของเจ้าของใน scope `nons-projects-2ee1d9ee` ได้ตามคำยืนยันล่าสุด
  สำหรับ hosting/functions และ private storage ที่จำเป็น; ไม่เปลี่ยนแพ็กเกจ
  spend limit ทีม หรือเพิ่ม add-on/payment method
- Neon ต้องเป็น standalone Free ที่ตรวจยืนยันจากบัญชีจริงก่อนสร้าง project
  ห้ามใช้ marketplace Launch installation เดิม ห้าม downgrade งานอื่น
  และห้ามสมัคร Launch/Scale หรือ trial
- ใช้ Neon project ใหม่ของแอปนี้เพียงหนึ่ง branch หลัก หนึ่ง compute ขนาดเล็กสุด
  ที่แผนรองรับ พร้อม scale-to-zero; ไม่สร้าง preview branch/read replica
  ไม่เปิด automatic Neon branching integration และไม่ใช้ cron/polling ปลุก DB
- ทดสอบ transaction/migration บน Postgres ชั่วคราวในเครื่อง; ไม่แตก Neon branch
  ไม่ให้ preview หรือ automated tests แตะข้อมูลจริงหลังเริ่ม pilot
- ใช้ private repository และ URL ฟรีของ Vercel; ไม่ซื้อ domain หรือบริการส่งอีเมล
  การจัดการบัญชีและ recovery ใช้ขั้นตอนที่เจ้าของควบคุมเอง
- บีบอัดภาพก่อนส่ง ตรวจขนาดทั้ง client/server และกำหนดเพดาน storage ในแอป
  ต่ำกว่า quota พร้อมแสดงการใช้งาน/คำเตือน; ต้องคำนึงถึง quota ที่ใช้ร่วมกับ resource
  อื่นในบัญชีด้วย ไม่ใช้ตัวนับของแอปเป็นหลักฐานว่าบัญชีทั้งหมดยังไม่เต็ม
- เมื่อถึงเพดานให้ปฏิเสธ upload หรือแจ้งบริการพัก ห้ามอัปเกรดอัตโนมัติ
  ไม่ลบหลักฐานเก่าอัตโนมัติเพื่อให้โควตาว่าง; เจ้าของต้อง export/backup ก่อน cleanup
- ตรวจแผนและ limits จริงอีกครั้งใน slice 3; การตั้งค่าแอปไม่ใช่ spending cap
  ของ paid account และไม่รับประกันว่านโยบายบริการจะไม่เปลี่ยนในอนาคต

หลักฐาน provider ที่ตรวจ 2026-10-02: [Vercel Blob Hobby](https://vercel.com/docs/vercel-blob/usage-and-pricing) ระบุว่าไม่คิด additional usage
แต่ปิด access เมื่อเกิน quota; [Neon Free FAQ ใน source ทางการ](https://github.com/neondatabase/website/blob/main/content/faqs/free-plan-limits-and-quotas.md)
ระบุว่าไม่คิด overage และ suspend compute/ปฏิเสธ write เมื่อถึง limits
FAQ อัปเดต 2026-10-01 ระบุ 100 CU-hours/project/month และ Postgres 1 GB/project
ตัวเลขนี้แทนข้อมูล quota เก่าที่เคยอ้าง; ต้องตรวจว่า provisioning ผ่าน marketplace
ได้ Free แบบเดียวกันจริง ถ้าไม่ได้ให้เชื่อมบัญชี Neon Free โดยตรง

## Execution slices and acceptance criteria

### 1. Open the workstream and preserve the approved mockup

**Result:** กลับมาอ่านจาก repo แล้วรู้เป้าหมาย หน้าตา ขอบเขตเริ่มต้น และเรื่องที่ยังไม่ตัดสินใจ

**Scope:** แผนเปิด 0.1 และการปรับขอบเขต 0.2, mockup เดิม, design brief, decision และ closeout
ใน HQ เท่านั้น ไม่มี child app หรือทรัพยากรภายนอกใน slice นี้

**DoD / proof:**

- Wake อ่าน workstream พร้อม project link และ opening decision slice 1 ได้
- mockup เก็บเป็น source โดยไม่มี session locator หรือข้อมูลลับ
- `git diff --check` และ Wake ไม่มี validation error ใหม่
- closeout มี Git checkpoint และระบุขั้นถัดไปพร้อม unknowns ที่เหลือ

**Review:** ขอบเขต v0.2 ผ่าน syncup; คำสั่งลุยต่ออนุญาตเริ่มตามแผนปัจจุบัน

### 2. Build one complete local flow with two accounts

**Result:** login คนเบิก → ส่งรูปบิลจริง → login คนจ่าย → แนบสลิปจริง →
จ่ายแล้ว พร้อมยอดค้างและประวัติที่ตรงกัน

**Dependency:** เจ้าของอนุญาตเริ่มสร้างแอปและยืนยันขอบเขต v1; ถ้าต้องใช้ remote
DB/Blob ในการพัฒนา ต้องได้รับอนุญาตสร้างทรัพยากรและเลือกแผนบริการก่อน

**Scope:** สร้าง child repository และ project registration; ทำ design contract
จาก brief; auth, schema/migration, private attachments และ UI หนึ่ง flow ครบวงจร
ใช้ Postgres ชั่วคราวในเครื่องและไฟล์สังเคราะห์ในการพิสูจน์
repository ภายนอกต้องเป็น private ตามคำขอเจ้าของ

**DoD / proof:**

- มี migration และวิธีสร้างสองบัญชีอย่างปลอดภัยโดยปิด public signup
- E2E ด้วยสอง session แยกกันพิสูจน์ยอดเงิน รูปจริง note และ paid history หลัง reload
- จ่ายบิลเดียว/หลายบิลด้วยหนึ่งสลิป ยอดรวมตรง; กดซ้ำหรือเลือกบิลที่จ่ายแล้วไม่ทำยอดซ้ำ
- แก้/ยกเลิกบิล pending และย้อน payment พร้อมเหตุผลได้ ประวัติเดิมยังอยู่
- ตรวจภาพสังเคราะห์หลังบีบอัดบน viewport มือถือ; file limit และ quota guard ปฏิเสธไฟล์ได้
  การอ่านบิลจริงบนโทรศัพท์จริงเลื่อนไปหลังส่งมอบตาม revision 0.5
- ผู้ไม่ login/ผู้ไม่มีสิทธิ์เปิดรูปและแก้รายการไม่ได้; ผู้สร้าง mark paid บิลของตนเองไม่ได้
- error ระหว่าง upload/commit และการกดจ่ายซ้ำไม่สร้างรายการ paid ที่ไม่มีสลิป
  หรือยอดรวมผิด; ทดสอบ transaction/retry ที่มีผลต่อข้อมูลจริง
- มือถือใช้งานได้และสี/องค์ประกอบตรง design contract; build ผ่าน
- review auth, สิทธิ์, การเก็บภาพ และ transaction พร้อม diff ที่เจ้าของตรวจได้

**Location / review:** child repo ใช้ topic branch; HQ เก็บ decision/closeout
ทดสอบ UI และ flow ก่อน deployment ภายใต้ provider boundary revision 0.4
นำผลให้เจ้าของตรวจเมื่อครบ

### 3. Deploy and verify a private hosted trial

**Result:** มี HTTPS URL และทดลอง flow ด้วยข้อมูลสังเคราะห์ผ่านสอง session ได้

**Dependency:** เจ้าของอนุญาต deploy บน Pro เดิมและใช้ standalone Neon;
ยืนยันบัญชี/scope/แผนบริการและทรัพยากรใหม่
ใช้ CLI ที่รองรับ private Blob และตรวจ permission จากการสร้างจริง
ไม่ใช้ resource ของแอปอื่นที่มีอยู่แล้ว

**DoD / proof:**

- ใช้ DB บน Neon Free หนึ่ง branch และ private Blob บน Vercel scope ที่เจ้าของอนุญาต
  ทดสอบด้วยข้อมูลสังเคราะห์ก่อน pilot; หลังเริ่มใช้จริง preview ไม่เชื่อม DB จริง
  ไม่มี automatic branching และ server secrets ไม่เข้าประวัติ Git
- ตรวจและบันทึก plan IDs/limits/การหยุดเมื่อเต็มจาก provider จริง
  ไม่ถือว่า spending alert บน paid plan เป็นการรับประกันค่าใช้จ่ายศูนย์
- HTTPS/login/private reads ผ่านบน deployment; service worker ไม่ cache ข้อมูลส่วนตัว
- ทดสอบ flow ผ่าน HTTPS บน viewport มือถือ รวม reload, logout และกลับเข้าใช้
  การติดตั้ง PWA บนโทรศัพท์จริงเลื่อนไปหลังส่งมอบตาม revision 0.5
- ข้อจำกัด quota และการกู้คืนข้อมูล/ภาพมีวิธีที่เจ้าของตรวจและปฏิบัติได้

**Review:** ส่ง preview และผลทดสอบให้เจ้าของยอมรับก่อนใช้บิลจริง

### 4. Verify owner merge and close the application delivery

**Result:** เจ้าของได้รับแอปที่ merge แล้ว URL ที่ใช้ได้ และวิธีดูแล โดยแยกงานที่ยังไม่พิสูจน์

**Dependency:** เจ้าของ merge PR และยืนยันปิดขอบเขตส่งมอบ เลื่อนการลองใช้งานจริงไว้ภายหลัง

**DoD / proof:**

- ตรวจ PR merge commit และ closeout copy ใน child main; local main clean และตรง fetched origin/main
- ตรวจ production deployment จาก merge revision เป็น READY และ smoke HTTPS/login/read/logout ผ่าน
- เอกสารบัญชี ภาพ backup/restore และ quota อยู่ใน merged PR; credentials อยู่เฉพาะที่เจ้าของควบคุม
- บันทึก final closeout ใน HQ พร้อม Git checkpoint และหลักฐาน owner closure scope
- คงรายการ unresolved ของ store ทดลองเก่า การเก็บ source ของ provider ค่า usage และการลองใช้งานจริง
  ไม่รายงานสิ่งที่เลื่อนว่าเป็นผลทดสอบผ่าน

**Review:** merge และคำยืนยันปิดงานส่งมอบมาจากเจ้าของ; HQ record รอ integration ของ standing branch
ตามจังหวะของเจ้าของ ไม่เปิด app PR ใหม่เพื่อทำซ้ำการ merge ที่เสร็จแล้ว

## Deferred after delivery

- การติดตั้ง PWA/reload/logout บนโทรศัพท์จริง และอ่านภาพบิลจริงหลังบีบอัด
- การเปลี่ยนชื่อ/ID/รหัสบัญชีจากชุดทดลอง การใช้บิลนำร่องจริง และตรวจยอดกับหลักฐานจริง
- ลบ Blob store ทดลองเดิมหลังตรวจแอปชุดใหม่: Vercel CLI บังคับให้เจ้าของยืนยันการลบถาวรเอง
- นโยบาย retention ของเจ้าของ และ retention ของ source deployment ที่ลบจาก provider ยังไม่พิสูจน์
- Neon ต้องคง Free หนึ่ง branch; Vercel Pro เดิมมี metered usage ร่วมกับแอปอื่น ไม่รับประกันค่าเพิ่มศูนย์

**Next action:** ส่ง closeout การส่งมอบให้เจ้าของ; ไม่มีงาน implement เพิ่มในรอบนี้
เจ้าของลองใช้งานจริงภายหลังและควบคุมการลบ store เก่า/ตั้งบัญชีจริงตาม OPERATIONS
