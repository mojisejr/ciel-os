# MuMate — bdash v2: who uses what, who pays, and what chat asks, in five menus

**Workstream:** `mumate-bdash-v2-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.4
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

The business team (Kittipon, 2026-10-21) asked for two things on bdash:

- a column of **people per feature**: "จำนวนคนที่เข้าในแต่ละ feature";
- a **date range for the whole dashboard**: 7, 30 or 90 days, or a custom
  range ("และเลือก custom ได้").

The team also wants to know **who paid and how often they buy again**, and
**what people ask the chat about**.

The owner decided the following on 2026-10-21, after three rounds of samples
rendered on the real page:

- Count **people who actually used** a feature, not page opens: "เราบอกว่าเรา
  จะทำในสิ่งที่ GA4 ให้ไม่ได้".
- **Record who used what, with the member id**, as long as it does not affect
  members and is safe; a migration, if any, must be safe.
- **Read live per chosen range**, with guards against slowing the app.
- **Card C**: one row per feature, with a chart of movement; the owner prefers
  charts to bars for movement.
- **Payer list on bdash, names only**, cut short to fit a phone.
- **Chat topics, not keywords**: no question or answer text is stored.
- **Five menus**, a bottom menu bar on phones and top tabs on desktop. Future
  data goes into the menu whose question it answers.

The owner confirmed the whole plan: "ผม confirm แผนนี้ละครับ".

On 2026-10-22 the business team saw the empty chat card and asked to keep the
questions themselves ("อันนี้ให้เก็บคำถามเลยได้ไหมครับ"). The team's own
change then went to production: a separate, optional `ai_training` consent,
and the table `ai_question_log`, which keeps consenting members' chat
questions without answers, scrubbed, under a one-way subject, with `/ops` to
review, label and export them. In a syncup the same day the owner decided
(plan 0.4):

- **bdash still stores no question text.** It reads `ai_question_log`
  read-only, and only for questions recorded under consent wording that covers
  analysing questions to improve the service.
- **The consent wording widens in this workstream, done by us**, with the team
  reviewing it ("เราทำกันเลยครับ"): policy 3.1 and the consent line say the
  questions are also analysed to improve the service, the consent version
  rises, members who answered the old version are asked again, and bazi keeps
  questions only from members who accepted the new version.
- **The topics card goes up now**, not after two or three weeks.
- Labelling, deleting and exporting stay on `/ops`.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `bazi-sft-dataset` | usage logging, `/bdash` pages and live reads | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `mootech-fe` | chat proxy forwards the member id to bazi; the `ai_training` consent wording, version and re-ask | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `ciel-os` | this plan and its events | `.` |

`mumate-infra` needs no change: Caddy's bdash host and bazi's bdash door both
already allow `/bdash/*`.

## Starting evidence (2026-10-21)

Counts only, on the staging copy of production (backup of about 2026-10-15),
read-only:

- **No AI usage row records who made the call.** Chat has 0 of 2,646 rows;
  every other usage table also has 0.
  - Cause for chat: the fe proxy (`pages/api/chat/bazi.ts`) does not forward
    the member id, so bazi logs `anon_id` as null and skips `mate_ai_chat_meta`
    entirely.
  - Oracle and divine card routes hold `anonId` for the QI gate but do not pass
    it to the usage log.
  - The narrate route (เซียมซี, ทำนายเบอร์, ปฏิทิน) and `/api/reading/topic`
    never receive it.
- **Free daily use has no history.** `bazi_feature_quota` is deleted daily by
  `/api/cron/qi-quota-reset`. Per-person use exists only in `bazi_ledger_txn`
  `qi:spend:<kind>`.
- **Payments.**
  - `v2_payment` holds every payment since 2026-08-25: 53 payers, 70 approved
    payments.
  - 49 of the 53 paid once; 48 of the 70 payments are PRO yearly.
  - Two members bought PLUS yearly and PRO yearly on the same day; the team
    should check whether these were upgrades or double payments.
- **No migration is needed.**
  - `anon_id` exists and is nullable on every `*_usage` table.
  - `mate_ai_chat_meta` exists with an `(anon_id, created_at)` index.
  - The bazi schema is unchanged since 2026-10-14.
  - The largest table is `user` with 5,470 rows.
- **No double QI charge.** `QI_GATE_OPENWEBUI` is unset on mumate-prod-1 and
  mumate-2, checked in the env file and in the running bazi. Forwarding the
  member id therefore does not make bazi charge QI on top of fe.

## Current agreement

- **Five menus**, each answering one question. Each menu is a real route, and
  the chosen range travels in the link.

  | Menu | Route | Question | Cards |
  |---|---|---|---|
  | ภาพรวม | `/bdash` | How is the business today, and what changed? | summary sentence, four KPIs that link to their menu, a link to each other menu with one signal |
  | อยู่ต่อไหม | `/bdash/stay` | Do sign-ups come back, and do they pay? | retention table, free→paid chart |
  | เงินเข้า | `/bdash/money` | Where do payments fail, who paid, and do they buy again? | payment outcomes, payer list |
  | ฟีเจอร์และ AI | `/bdash/features` | Which features are used, are they worth the AI cost, is QI given too freely? | card C, QI card |
  | แชตถามอะไร | `/bdash/chat` | What do people ask about? | topics card |

- **Adding data later.**
  - A new card goes into the menu whose question it answers.
  - A new menu only when no menu answers that question.
  - The phone bar holds five slots comfortably. A sixth menu goes under "เพิ่มเติม"
    or the menus are regrouped; the slots never shrink.
- **Range.**
  - 7, 30 or 90 days, or custom; the same range on every menu.
  - Charts are daily up to 30 days and weekly beyond.
  - Signup-week cards filter which signup weeks they show.
- **Live reads with guards.**
  - Read-only transaction with a statement timeout of about 3 seconds; a page
    that hits it says the range is too long.
  - Results cached per range for about 10 minutes.
  - Every query's duration is logged. A query that grows slow moves to the
    nightly job.
- **Look and words.**
  - Kept from `mumate-business-metrics-001` and the approved mock: plain Thai,
    each heading is the question, each figure says which direction is good.
  - Readability fixes from the samples:
    - chart text at least 11px at any width;
    - payment table 10 → 5 columns, a list on phones;
    - retention table newest first, capped at 12 weeks;
    - no empty gap under charts;
    - on phones each list shows 5 rows and then "ดูทั้งหมด".
- **Privacy.**
  - bdash shows member names only on the payer list. No email, phone or id
    anywhere on bdash.
  - Usage and chat-topic rows carry the member id in the database, but bdash
    shows them only as totals.
  - bdash stores no question or answer text. Its question card reads the
    team's consent-based `ai_question_log`, shows no subject, and has no
    label, delete or export.
- **Samples.** The approved samples are on a private claude.ai page, kept out
  of this public repository.

## Slices

- [1. Record who used what](slices/1.md)
- [2. Five menus, the range bar and card C](slices/2.md)
- [3. Who paid, do they buy again, and the mascot in the header](slices/3.md)
- [4. What chat is asked about](slices/4.md)

## Boundaries

- Each slice needs its own owner decision, topic branch and pull request.
- Child pull requests go to bazi `pdf-dev` and fe `main`. The team or the owner
  merges, and the owner presses promote-production.
- No change to `/ops` or its write paths. Members see no change, apart from
  chat card draws becoming seeded per member once bazi knows who asks; that is
  the behaviour the code already intends.
- Production database, env and DNS changes only on the owner's word. Any
  migration that turns up is additive and run by the owner.
- Out of scope:
  - acquisition source;
  - login history;
  - payment settle and refund times;
  - GA4 import;
  - bdash storing question text or keywords of its own;
  - changing the team's PII scrub in `ai_question_log` (reported to the team
    through the owner);
  - removing the nightly snapshot job and table (a later owner decision).
