# MuMate — record the moment a member decides to pay or not, so the team can answer "ทำยังไงให้ลูกค้าจ่ายเงิน" with evidence

**Workstream:** `mumate-pay-signals-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

The business owner (พี่พล, relayed by the owner on 2026-10-30) says the
product is nearly complete and the one open question is "ทำยังไงให้ลูกค้าจ่ายเงิน".
The owner's answer to that is back-end work only: the system must record the
moments that decide a purchase, bdash must show them as plain-Thai cards the
team can act on week by week, and the agent proposes the levers (price, codes,
free limits, packages) with evidence while the team presses them.

Agreed in a syncup on 2026-10-30 and 2026-10-31 (guess hit rate 11/14 over
three rounds):

- "จ่าย" means the yearly membership first (Mumate + / Pro); QI packs second.
  The owner: "คนที่จ่ายรายปีคือคนที่ชอบระบบจริงๆ".
- Levers that live in the database or engine (package prices, monthly plans,
  free limits, discount codes, QI grants) are ours to propose and, once the team
  approves, to apply. We never change them on our own.
- Collection order: walls and the checkout path first, then daily membership
  state and renewals, then acquisition source, then free-use history.
- Collect per member; the team sees totals only. The owner: "เก็บได้ทุกอย่าง
  แต่ถ้ากระทบกฎหมายตรงไหน รายงานมา".
- No new cost for the team; no member-facing change except one late exception
  (the expiry card); nothing that slows the app. A finished slice goes to
  production with the owner's next promote.
- Pro granted by the team is kept apart from Pro that was bought, in every number.
- The owner reads a private report first (a claude.ai page, outside this public
  repository); the team's version comes after he approves it.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `bazi-sft-dataset` | the engine's walls (free quota, QI), the signal table, `/bdash` cards | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `mootech-fe` | checkout path (`/api/v2/payment/preview`, charge), calendar and compatibility walls, signup source | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `ciel-os` | this plan and its events | `.` |

`mumate-infra` needs no change unless a slice adds a timer; that is said in the slice.

## Starting evidence (2026-10-31, production, read-only counts through `bin/prod-sql.sh`, rolled back)

- 5,529 accounts, of which 555 finished v2 onboarding and 575 hold a QI
  wallet. 356 people did the daily reading in the last 30 days; 136 checked
  in; on average 14 people a day used an AI feature since 2026-10-21.
  Sign-ups by month: Jul 372, Aug 253, Sep 386, Oct 242.
- Money since 2026-08-25: 73 approved payments, 25 rejected, 15 pending.
  Pro yearly 49 payments by 48 people for ฿14,866 in total, an average of
  ฿303 against the ฿1,590 list price; Plus yearly 5 at full price; QI packs
  13 payments by 5 people, all the ฿35 pack; 48 of the 73 approved payments
  used a discount code. The owner confirms the codes are real campaigns.
- 98 Pro and 13 Plus subscriptions are active; about half of the Pro rows have
  no v2 payment behind them (granted through `/ops` or a course). 50 active
  subscriptions expire within 90 days. 63 legacy v1 memberships are still valid.
- Walls today: free = 1 card draw a day (cards, เซียมซี, phone number together),
  1 chat question a day, calendar summary 7 days ahead, 2 compatibility matches
  a month; past free, a card costs 10 QI and a chat question 30 QI. In 30 days
  39 people paid QI for chat, 35 for cards, 37 for phone readings. Since
  2026-10-21, 34 people chatted beyond the free question on some day. Wallet
  median 65 QI; 32 wallets hold under 30 QI.
- What is not recorded anywhere, and cannot be reconstructed: a wall being hit
  (the engine answers 402/409 and keeps nothing; the calendar lock and
  compatibility quota refuse in fe without a row); the path before a charge
  (the first row is the PENDING charge); acquisition source (no UTM, incoming
  `refer_code` dropped at signup, `login_at` overwritten); free-use history
  (`bazi_feature_quota` is wiped daily); settle and refund times; renewals.
- Privacy policy 2026-10.1 (`constants/privacy-policy.ts`) already lists
  "ข้อมูลการใช้งาน: การเข้าหน้าเว็บ การใช้งานฟีเจอร์ วัน-เวลา" under what is
  collected and "ปรับปรุงประสบการณ์ใช้งานเว็บไซต์และพัฒนาบริการ" under purposes, so
  per-member usage signals need no version bump. Promotions require opt-in, so
  an expiry notice must read as service information, not an offer.
- Channels that already exist and cost nothing: web push (VAPID, used for
  ยามมงคล reminders; reaches only members who installed the PWA and allowed
  notifications). LINE push exists in bazi but counts against the OA plan, so
  it is out.
- The query files are in `.assets/mumate/mumate-pay-signals/q/` (gitignored);
  five of them (monthly totals, discount by code, expiries by paid/granted,
  free QI spenders, push reach) were refused to the agent and wait for the owner.

## Current agreement

- One additive signal table, written by both apps, holding the member id, the
  kind of moment (a wall, a checkout step), the feature or package, the tier and
  QI balance at that moment, and the time. No text, no name. bdash reads it as
  totals only, in the menu whose question it answers.
- Every slice: additive migration run by the owner; app response time measured
  before and after, as bdash did; the team or owner merges; the owner presses
  promote-production.
- The weekly loop the cards serve: the team sees "ชนกำแพงแล้วซื้อกี่ %" per
  wall, changes one lever, adds a rule-change marker (the mechanism exists in
  `src/lib/bdash/features.ts`), and reads the same card the next week.
- The owner's private report is written from today's counts and updated when
  the five refused counts arrive; it is not a slice.

## Slices

- [1. Walls and the checkout path](slices/1.md)
- [2. Daily membership state and renewals](slices/2.md)
- [3. Acquisition source at signup](slices/3.md)
- [4. Free-use history](slices/4.md)
- [5. Expiry notice: one card before, one at expiry](slices/5.md)

## Boundaries

- Each slice needs its own owner decision, topic branch and pull request.
- Child pull requests go to bazi `pdf-dev` and fe `main`.
- No change to `/ops` or its write paths; no front-end change except slice 5;
  no LINE push or any channel with a cost; no stored chat text; no GA4 work;
  no price or rule change by the agent.
- Production database, env and DNS changes only on the owner's word.
