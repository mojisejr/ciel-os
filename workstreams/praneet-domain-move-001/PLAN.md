# ปราณีต พันธุ์ไม้ — ย้ายทุกอย่างที่คนใช้มาอยู่ที่ www.ptplant.com

**Workstream:** `praneet-domain-move-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## เป้าหมายและข้อตกลงกับเจ้าของ

เมื่อ 2026-10-25 เจ้าของซื้อโดเมน `ptplant.com` และผูกกับ project praneet-web บน Vercel
หน้าร้าน ลิงก์แชร์ ภาพตัวอย่าง sitemap และ rich menu ย้ายไปที่ `www.ptplant.com` แล้ว
ส่วน `ptplant.com` พาไป www เอง
แต่หลังบ้านยังผูกอยู่กับ `praneet-web.vercel.app`: login จาก www.ptplant.com ได้ `INVALID_ORIGIN`
และหน้าร้านชุดเดียวกันยังเปิดได้จากทั้งสองที่อยู่

เจ้าของหยุดการแก้ทีละจุด และขอให้ research ให้ครบแล้วเปิด workstream นี้ก่อนลงมือ
("ผมคิดว่าคุน research ให้ครบแล้วรวบรวม ข้อมูล สร้างแผนแก้ไข แล้วเปิด workstream ใหม่ดีกว่ามั๊ยครับ ?
เพราะไม่งั้นน่าจะแก้ไปเรื่อยๆ เรามาจัดการเรื่อง domain กันก่อนละกัน")

**ผลที่ต้องการ:** ทุกอย่างที่เจ้าของและลูกค้าเปิด อยู่ที่ www.ptplant.com ที่อยู่เดียว
ลิงก์เก่าที่ส่งออกไปแล้ว (โพสต์ F1, หน้าลูกค้า `/me/...`, ลิงก์เชิญ) ยังพาคนมาถึงหน้าที่ถูกต้อง
และไม่ทำให้ตัวเลขโพสต์หรือรหัสแนะนำหาย

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `praneet-web` | env production, การ redirect ของ vercel.app | checkouts/praneet-web |
| `praneet-office` | ที่อยู่ตั้งต้นของ script และ runbook | checkouts/praneet-office |
| `ciel-os` | แผนนี้และ event | . |

## หลักฐานตอนเปิด (2026-10-25, praneet-web origin/main e37626b, praneet-office origin/main c76079e)

- **DNS และ HTTPS:** `ptplant.com` A → Vercel, `www` CNAME → Vercel ทั้งคู่มีใบรับรองแล้ว
  Vercel ตั้ง `ptplant.com` 308 ไป www ระบบจึงใช้ www เป็นที่อยู่หลัก
- **ที่ย้ายเองแล้วหลัง redeploy:** `publicOrigin()` ใน `lib/shop.ts` อ่าน `VERCEL_PROJECT_PRODUCTION_URL`
  และตอนนี้ได้ `www.ptplant.com` จึงใช้กับ og:image, ลิงก์ปุ่มแชร์, sitemap, robots
  และลิงก์หน้าลูกค้า `/me/<token>` (`lib/referrals.ts`) ที่ระบบสร้างหลังจากนี้
- **ที่ยังผูกกับ vercel.app:**
  - `BETTER_AUTH_URL` (env production) ใช้เป็น `baseURL` ของ better-auth และใน `sameOrigin()`
    ที่ตรวจทุกคำสั่งเขียนของ `/ops` login จาก www จึงได้ `INVALID_ORIGIN`
  - praneet-office: ที่อยู่ตั้งต้น `https://praneet-web.vercel.app` อยู่ใน
    `scripts/ops-session.ts`, `lots.ts`, `orders.ts`, `posts.ts`, `slips.ts`
    รวมทั้ง README และ runbook 01 (webhook, ลิงก์ privacy)
  - LINE webhook ชี้ที่ `praneet-web.vercel.app/api/line/webhook`
- **ไม่มีที่อยู่เก่าค้างในฐานข้อมูล:** อ่านด้วย role reader ครบ 89 คอลัมน์ข้อความ ไม่เจอ `vercel.app`
- **cookie ผูกกับที่อยู่:** `/p/<code>` ตั้ง `pn_post` และ `/r/<code>` ตั้ง `pn_ref` บนที่อยู่ที่คนเข้ามา
  แล้ว redirect แบบ relative ถ้าย้ายคนไปอีกที่อยู่หลังตั้ง cookie แล้ว รหัสจะหาย
  จึงต้องย้ายก่อนเข้า route นี้
- **ไม่ผูกกับที่อยู่:** ที่เก็บสลิป (Vercel OIDC + `SLIPS_STORE_ID`), รูป lot (Blob)
- **ตั้งเสร็จแล้วโดยเจ้าของหรือ agent:** Google Maps (เว็บไซต์), rich menu
  (`richmenu-514ca03ce6358b0385ca4875137b1b7e` บน branch office `richmenu-ptplant-domain` ยังไม่ push)

## ขอบเขต

- **ใช้ www.ptplant.com เป็นที่อยู่หลัก** ไม่กลับด้านเป็น ptplant.com เพราะลิงก์ทั้งหมดที่ระบบสร้างใช้ www แล้ว
- **LINE webhook อยู่ที่เดิม** ลูกค้าไม่เห็น และ `/api/*` บน vercel.app ไม่ถูก redirect จึงใช้ได้ต่อ
  การย้าย webhook ทำเมื่อมีเหตุ ไม่อยู่ในแผนนี้
- **ไม่ใส่ canonical:** เมื่อ vercel.app redirect หน้าทั้งหมดมาที่ www แล้ว Google เห็นชุดเดียวอยู่แล้ว
- **ไม่อยู่ในแผนนี้:** Google Search Console และ Google Business Profile API (workstream ถัดไป),
  อีเมลบนโดเมน, `BETTER_AUTH_URL` ของ preview
- **ฝั่งเจ้าของ ไม่ใช่ slice:** ช่องเว็บไซต์ในเพจ Facebook, โปรไฟล์และข้อความต้อนรับใน LINE OA
  ถ้ามีลิงก์ vercel.app (runbook 01 บันทึกว่าข้อความต้อนรับเคยมีลิงก์ privacy),
  QR หรือของที่พิมพ์ไว้
- คำสั่งที่เปลี่ยน production (env, redeploy) ทำตามคำของเจ้าของในแต่ละ slice
  agent ทำเองได้ ถ้า harness ปฏิเสธ ส่งให้เจ้าของกด

## Slices

- [1. หลังบ้านและ office ย้ายมา www.ptplant.com](slices/1.md)
- [2. vercel.app พาคนมา www.ptplant.com](slices/2.md)
