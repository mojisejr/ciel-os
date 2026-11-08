# MuMate — ขาย E-Book ผ่าน ManyChat โดยตรวจสลิปและส่งของเอง

**Workstream:** `mumate-manychat-ebook-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## เป้าหมายและข้อตกลงกับเจ้าของ (2026-11-08)

วันนี้ flow "Bazi E-Book 95" ใน ManyChat ขายเองได้จนลูกค้าส่งสลิป แต่หลังจากนั้นแอดมินทำเองทั้งหมด
คือดูเงินในบัญชีกสิกร แล้วส่งลิงก์ PDF และโค้ดแอปในแชทเอง ManyChat จึงไม่รู้ว่าใครจ่ายจริง
(บันทึกการอ่าน flow: `memory/events/2026/11/08/20261108T225510_mumate_manychat_ebook95_flow_reviewed.yaml`)

งานนี้ทำหลังบ้านที่ agent ช่วยเจ้าของดูแลได้ ดังนี้

- **ทาง A ตรวจสลิปอัตโนมัติ** (เจ้าของเลือก 2026-11-08) ลูกค้ายังโอนเข้าบัญชีบริษัทแล้วส่งสลิปเหมือนเดิม
  ไม่ใช้ payment gateway เพราะทีมไม่อยากรวมกับระบบจ่ายเงินของแอป และไม่อยากเสียค่าธรรมเนียม Beam
- **ระบบทำเองทั้งหมด** ได้สลิป → เก็บรูปไว้เอง → ตรวจกับบริการตรวจสลิป (ยอด บัญชีผู้รับ สลิปซ้ำ)
  → ผ่าน: ส่งลิงก์ PDF ที่หมดอายุเองและโค้ดแอปผ่าน ManyChat API แล้วติด tag paid
  → ไม่ผ่าน: บอกเหตุผลกับลูกค้า ติด tag เหตุผล และส่งให้แอดมิน
- **เก็บข้อมูลทั้งคนที่จ่ายและไม่จ่าย** ทุกขั้นของ flow เป็น event ต่อคน พร้อมเหตุผลที่คนไม่จ่าย
  ทีมจะได้เห็นว่ากำแพงอยู่ตรงไหน
- **ทดลองก่อนปล่อยแบบเดียวกับ fe และ bazi** merge แล้ว staging ตาม main เอง ทีมทดสอบบน staging
  ด้วย flow ทดสอบที่เปิดให้เฉพาะคนในทีม แล้วเจ้าของกด promote ขึ้น production
- **ฐานข้อมูลเดียวกับ MuMate** production ใช้ Supabase ตัวเดียวกับแอป โดยมีตารางของงานนี้เอง
  ที่เพิ่มอย่างเดียว staging ใช้ `pgstaging` บน mumate-2 ตาม runbook 05

## ข้อเสนอที่รอเจ้าของยืนยันใน decision ของ slice 1

- ทำเป็นแอปแยก มี repo ส่วนตัว (private) ใหม่ของตัวเอง เช่น `mumate-ebook-bot` ไม่ใส่ใน mootech-fe
  (ทีมไม่อยากรวม, mootech-fe เป็น repo สาธารณะ) mumate-infra เพิ่ม service ตัวที่สามข้าง fe และ bazi
- image tag = git SHA เหมือนแอปอื่น ทั้ง `release`, `promote-production`, `staging-follow`
  และ `rollback` ต้องรู้จักแอปตัวที่สาม
- ManyChat มี page เดียวและ API key เดียว ไม่มี sandbox ดังนั้น staging รับเฉพาะ subscriber ที่อยู่ใน
  allowlist ของทีม และ flow ทดสอบเข้าได้เฉพาะคนที่มี tag `tester`
- ยอดที่ตรวจตั้งค่าแยกตาม env เช่น staging 1 บาท ให้ทีมโอนจริงเข้าบัญชีบริษัทเพื่อทดสอบ
  production ใช้ราคาขายจริง
- บริการตรวจสลิป: SlipOK (ฟรี 100 สลิปต่อเดือน, ตรวจสลิปซ้ำและบัญชีผู้รับให้) เป็นตัวที่ agent เสนอ
  EasySlip เป็นตัวสำรอง

## สิ่งที่ต้องรู้ก่อน slice 1 จะเริ่ม

- ManyChat ใช้แผนไหน (API และ External Request ต้องใช้ Pro ขึ้นไป)
- PDF เก็บอยู่ที่ไหน และทุกวันนี้ออกโค้ดแอปฟรี 1 เดือนอย่างไร
- รายการข้อ 1–4 ที่ทีมคุยกันไว้ และถ้ามีคนเริ่มทำแล้ว ทำถึงไหน ใช้ account และ key ของใคร
- จะเก็บรูปสลิปไว้นานเท่าไร (PDPA: รูปมีชื่อและเลขบัญชีของลูกค้า)

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mumate-infra` | service ตัวที่สาม, Caddy, env, release และ promote | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | แผนนี้และ event | . |

repo ของแอปจะลงทะเบียนเป็น project หลังเจ้าของอนุมัติให้สร้าง (slice 1) ตอนนี้ยังไม่มี repo

## หลักฐานตอนเปิด (2026-11-08)

- flow ใน ManyChat: ทางเข้า 2 ทางคือคอมเมนต์ใต้โพสต์โฆษณา และ keyword ในแชท (228 ครั้ง)
  ข้อความแรกไปถึงลูกค้า 242 คน มีคนส่งสลิป 56 คน ข้อมูลที่ export ไว้อยู่ที่ `.assets/mumate/manychat/`
  ซึ่ง Git ไม่ติดตาม
- mumate-infra main 05c86b6: เครื่อง `mumate-prod-1` (production) และ `mumate-2` (staging)
  staging ตาม main เองทุก 3 นาที production ขึ้นด้วยปุ่ม `promote-production` ที่เจ้าของกด
- production gateway ของแอปคือ Beam (`reconcile-payment (Beam live)` ใน runbook 01) งานนี้ไม่ใช้
- ข้อจำกัดจาก research 2026-11-08 (ยังไม่ได้ลองจริง):
  - ManyChat External Request รอได้ราว 10 วินาที server จึงต้องตอบรับก่อน แล้วค่อยทำงานต่อ
  - Messenger ส่งข้อความอัตโนมัติได้เฉพาะภายใน 24 ชั่วโมงหลังลูกค้าทักล่าสุด
    และตั้งแต่ ก.พ. 2026 Meta เหลือ message tag แค่ `HUMAN_AGENT`
  - ลิงก์รูปสลิปใน ManyChat หมดอายุในไม่กี่สัปดาห์
  - ธนาคารบางแห่งส่งข้อมูลช้าหลายนาที ต้องมีการลองใหม่ ไม่ใช่ปัดตกทันที

## ขอบเขต

ไม่ทำในงานนี้:
- payment gateway ทุกตัว (Beam, Omise, QR แบบใหม่)
- แก้ระบบจ่ายเงินหรือตารางสมาชิกของแอป
- ส่ง event ให้ Meta Conversions API
- flow อื่นนอกจาก E-Book
- ข้อความหลัง 24 ชั่วโมง
- แก้โฆษณา

## Slices

- [1. โครงแอปและทางทดสอบบน staging](slices/1.md)
- [2. ตรวจสลิปและส่งของบน staging](slices/2.md)
- [3. ข้อมูลคนจ่ายและไม่จ่าย](slices/3.md)
- [4. ปล่อยจริงบน production](slices/4.md)
