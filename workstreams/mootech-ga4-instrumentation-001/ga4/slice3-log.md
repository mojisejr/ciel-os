# Slice 3 — บันทึกประจำ slice (agent's working log)

Survives session clears; the closeout is written from this file plus the owner's CSV.
Numbers only — no member identifiers ever go here.

| วันที่ | ใคร | อะไร |
|---|---|---|
| 2026-09-16 ~11:30 +07:00 | owner | ① `member_state` registered as user-scoped custom dimension `Member state` on G-EBZKXSF579; screenshot of คำจำกัดความที่กำหนดเอง shows ขอบเขต ผู้ใช้ · พร็อพเพอร์ตี้ผู้ใช้ member_state · เปลี่ยนแปลงล่าสุด 16 ก.ย. 2026. Google's 24-48 h window runs to 2026-09-17/18. |
| 2026-09-16 ~11:50 +07:00 | owner | Realtime → card "ผู้ใช้ที่ใช้งานอยู่ โดย พร็อพเพอร์ตี้ผู้ใช้" shows Member state = 1 (100%) — the owner's own session. Proves tag v4 → property → registered dimension end to end on day 0. Card label corrected in the runbook and LINE text from this screenshot. |


D1 (first day the Exploration shows a member row): _pending_ → day 7 = D1 + 6.

## Lessons to carry into the final record

- A parked checkpoint on the final declared slice with `status: recorded` triggers Wake's "would otherwise finish the workstream" warning (src/portfolio/read.ts:566-588) and it stays until the real closeout reaches a delivery state. Use `slice: none` on such checkpoints, as the lessons record did. Known warning carried in the round PR body by HQ.

## Candidates noticed during slice 3 (not started — for the closeout's "what next" list)

- **GTM v5: exclude `/ops` paths.** Realtime on 2026-09-16 showed page views for "Ops Dashboard" and "Ops · Analytics" — the tag fires on the ops screens because they live on bazichart.mumate.co. Admins carry no member_state, so the members-only numbers are unaffected, but total page views and "all users" are inflated by staff. One trigger exception on Page Path `^/ops` would remove it. Low priority; owner publishes.
- **Realtime illustration for the team:** the same screen read 4 active users (cookies) against 1 Member state — the gap the members-only design exists for. Reuse in the report.

## Runbook items gathered from the owner's questions on 2026-09-16 (fold into report-for-team.md)

- Realtime: once `Member state` is usable, the "เพิ่มการเปรียบเทียบ +" button at the top filters every Realtime card to members at once — the way to see which pages members are on, not only how many.
- Landing vs app: the `Hostname` (ชื่อโฮสต์) dimension separates `www.mumate.co` (WordPress marketing site, blog titles such as "5 สัญญาณ…") from `bazichart.mumate.co` (the app); no system change needed.
- v1 is tracked (page_view etc.) but carries no member_state / user_id / login / sign_up; v1 visitors sit in GA's all-users totals and never in the member DAU — consistent with the v2-only denominator.
- Explain in one line: `user_id` makes one person = 1 across devices; `member_state` selects members. Any GA number without the member_state filter is a visitor number, not a member number.
- Candidate for the app team (not this lane): v2 pages share generic titles ("Mumate", "MuMate · preview"); per-page titles would make the Realtime/report page cards readable per screen.
- Illustration for the report: Realtime 4 all-users vs 1 Member state on day 0.
