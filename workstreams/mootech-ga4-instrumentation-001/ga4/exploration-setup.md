# GA4 — ตั้งค่าให้รายงานนับ "สมาชิก" ได้ (slice 3 ขั้นเตรียม)

Property: `G-EBZKXSF579` (stream `12016428670`) · ทำครั้งเดียว · ใช้เวลา ~15 นาที
รวมเวลารอของ Google อีก 24–48 ชั่วโมงก่อนรายงานจะแสดงผล

ทำไมต้องทำ: แอปส่ง user property `member_state = member` มาตั้งแต่ GTM v4
(16 ก.ย.) และ DebugView เห็นแล้ว แต่ **รายงาน, Exploration และ Comparison
จะยังไม่มี filter นี้ให้เลือก** จนกว่าจะลงทะเบียนเป็น custom dimension
(ยืนยันจากเอกสาร Google: support.google.com/analytics/answer/14239618)

---

## ขั้นที่ 1 — ลงทะเบียน `member_state` เป็น custom dimension (2 นาที)

1. เปิด GA4 → ซ้ายล่าง **Admin** (ฟันเฟือง)
2. คอลัมน์ Property → หัวข้อ **Data display** → **Custom definitions**
3. แท็บ **Custom dimensions** — **ดูก่อนว่ามี `member_state` อยู่แล้วหรือยัง**
   ถ้ามีแล้ว (scope User) ข้ามไปขั้นที่ 2 ได้เลย และบอกผมว่าสร้างไว้เมื่อไหร่
4. ถ้ายังไม่มี กด **Create custom dimension** แล้วกรอก:
   - Dimension name: `Member state`
   - Scope: **User** ← สำคัญ ไม่ใช่ Event
   - Description: `member = signed-in v2 member (CIEL mootech-ga4-instrumentation-001)`
   - User property: `member_state` ← ต้องสะกดตรงกับที่แอปส่งเป๊ะ ตัวเล็กทั้งหมด มี underscore
5. กด **Save**
6. จดวันเวลาที่กด Save ไว้ — นี่คือจุดเริ่มนับของ slice 3

หลังจากนี้ Google ต้องใช้เวลา **24–48 ชั่วโมง** ก่อนที่ dimension จะโผล่ให้เลือก
ในรายงาน ทำขั้นที่ 2 ได้ทันทีก็จริง แต่ filter อาจยังหา `Member state` ไม่เจอ
จนกว่าจะพ้นช่วงรอ — ถ้าหาไม่เจอ ให้กลับมาทำขั้นที่ 2 ในวันถัดไป

## ขั้นที่ 2 — สร้าง Exploration (10 นาที, ทำครั้งเดียว ใช้ได้ตลอด)

1. เมนูซ้าย **Explore** → **Blank** (Free form)
2. ชื่อ Exploration (มุมซ้ายบน): `Members daily — DAU / login / sign_up`
3. คอลัมน์ **Variables** (ซ้ายสุด):
   - **Date range**: เลือก Custom ให้เริ่มที่วันที่ลงทะเบียน dimension ในขั้นที่ 1
     ถึงวันนี้ (ต่อไปเปิดทีไรค่อยเลื่อนวันสิ้นสุด)
   - **Dimensions** → กด **+** → ค้นหาและติ๊ก:
     - `Date`
     - `Member state` (อยู่ในแท็บ Custom — ถ้าไม่เจอ = ยังไม่พ้นช่วงรอ)
     - `Event name`
     → **Import**
   - **Metrics** → กด **+** → ค้นหาและติ๊ก:
     - `1-day active users`
     - `7-day active users`
     - `Event count`
     → **Import**
4. คอลัมน์ **Settings** (ถัดมา):
   - **Rows**: ลาก `Date` มาวาง
   - **Show rows**: 25 หรือมากกว่า
   - **Values**: ลาก `1-day active users` และ `7-day active users` มาวาง
   - **Filters** (ล่างสุดของ Settings): กด **Drop or select dimension or metric**
     → เลือก `Member state` → เงื่อนไข **exactly matches** → ค่า `member` → **Apply**
5. ตารางทางขวาควรแสดง 1 แถวต่อ 1 วัน โดยมี active users แบบ 1 วันและ 7 วัน
   ที่นับเฉพาะสมาชิก

### แท็บที่สอง — จำนวน login / sign_up

6. ด้านบนของพื้นที่ตาราง กดปุ่ม **+** ข้างชื่อแท็บ เพื่อเพิ่มแท็บใหม่ (Free form)
7. ชื่อแท็บ: `Events`
8. **Rows**: `Date` · **Columns**: `Event name` · **Values**: `Event count`
9. **Filters**: เพิ่ม 2 อัน
   - `Member state` exactly matches `member`
   - `Event name` matches regex `^(login|sign_up)$`
10. ผลคือ 1 แถวต่อวัน มี 2 คอลัมน์: `login` และ `sign_up`

Exploration บันทึกอัตโนมัติ เปิดกลับมาได้จากหน้า Explore

## ขั้นที่ 3 — ตรวจ 1 ครั้ง (ประมาณวันที่ 2 หลังลงทะเบียน)

เปิด Exploration ดูว่ามีแถวขึ้นไหม อย่างน้อยควรเห็น 1 คนในวันที่ฟีมเข้าแอปเอง
ถ้าว่างเปล่าทั้งที่พ้น 48 ชม.แล้ว ให้ส่ง screenshot ของแท็บแรก + หน้า Custom
definitions มาให้ผมดู

## ขั้นที่ 4 — Export 1 ครั้ง (วันที่ 7)

1. เปิด Exploration แล้วเลื่อน Date range ให้ครอบทั้ง 7 วัน
2. มุมขวาบน ไอคอน **Export** (ลูกศรลง) → **Download CSV** — ทำทั้ง 2 แท็บ
3. ส่งไฟล์ CSV 2 ไฟล์มาให้ผม (ไม่มีข้อมูลส่วนตัวใน CSV: มีแต่วันที่, จำนวน, ชื่อ event)

ตัวหาร (สมาชิก v2 ทั้งหมดในแต่ละวัน) ผมย้อนสร้างเองจาก `onboarded_at`
ด้วย query อ่านอย่างเดียว ฟีมไม่ต้องจด `/ops` รายวัน

---

## ถ้าอยากดูตัวเลขวันนี้เร็ว ๆ โดยไม่รอ Exploration

Reports → Realtime → การ์ด "Users by User property" — เลือก `member_state`
เห็นได้ทันทีว่ามีสมาชิกกี่คนใน 30 นาทีล่าสุด (ไม่ต้องลงทะเบียน dimension)
แต่เป็นแค่ 30 นาที ไม่ใช่รายวัน ใช้ตรวจว่า tag ทำงานเท่านั้น

## สิ่งที่ตัวเลขใน GA บอกไม่ได้ (ใส่ใน runbook ของพี่ปองด้วย)

- คนที่ใช้ ad blocker หรือปิด consent วิเคราะห์ จะไม่ถูกนับใน GA แต่ยังเป็น
  สมาชิกใน `/ops` → DAU ของ GA ต่ำกว่าจริงได้ slice 3 จะวัดว่าต่ำเท่าไหร่
- ตัวเลข "วันนี้" ของ GA ยังไม่นิ่ง ประมวลผลเสร็จใน 24–48 ชม. ดู "เมื่อวาน" เป็นหลัก
- "Total users" ของ GA = คนที่เข้าชมในช่วงวันที่ ไม่ใช่จำนวนบัญชี ตัวหารที่ถูกอยู่ที่ `/ops`
