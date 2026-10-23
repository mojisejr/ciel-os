# MuMate — members read the updated privacy policy to the end and accept it once; the AI item is switched off in settings

**Workstream:** `mumate-pdpa-reconsent-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.3
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

The business team (Kittipon, 2026-10-22 18:55) sent a formal draft of the AI
item (Phuwasit) and asked: "เวลาคนเข้าแอปใหม่ให้เด้งหน้า consent รวมอีกรอบหนึ่ง
แล้วให้ติ๊กยินยอมอีกทีดีกว่าครับ และเพิ่มข้อด้านบนเข้าไป ไม่อยากเจาะจงเฉพาะข้อนี้".
Em had removed the chat popup that asked existing members (fe PR 926), so
today existing members are never asked again when the policy changes.

The owner decided in a four-round syncup on 2026-10-22:

- **One combined consent screen, AI as its own optional box.** "เอาปลอดภัย":
  the AI item sits on the same screen but is never part of the required tick
  (PDPA section 19: separate, not a condition of service).
- **The team's wording goes in as written for now.** The agent wrote the owner
  a note for the team naming three claims the system does not yet meet (names
  removed, not identifiable, automatic two-year deletion); the team decides
  whether to change the words or the system.
- **One home for the long text.** The full policy lives in one file that the
  policy page renders; the short AI label stays in `aiTraining.ts`; the help
  chapter shrinks to a short summary with a link to the policy.
- **Who sees the screen.** Every onboarded member whose latest accepted
  policy version differs from the current one, once, at home and at chat:
  "ไม่รบกวน แต่ไม่ปล่อยผ่าน". Other pages are not gated.
- **AI box state.** Ticked when the member already accepted the current
  `ai_training` version; otherwise empty, and leaving it empty records nothing.
- **Gentle words, specific box.** The heading and line are neutral
  ("นโยบายความเป็นส่วนตัวฉบับปรับปรุง" and a short line), and the AI box keeps
  its specific, positive label. Nothing is pre-ticked for a member who never
  accepted it.
- **Policy updates stay in code, with a warning, not a block.** No `/ops`
  editor. A pre-push line warns when the policy text changed but its version
  did not; it never stops the push.

### Revision 0.2 (2026-10-23)

After checking staging, the business team asked for a read-to-the-end screen
with one tick and no AI box, and confirmed that an opt-out like ChatGPT's is
acceptable to them. The agent advised that health details in questions make
opt-out risky under PDPA section 26 and recommended an off-by-default switch in
settings. The owner decided to follow the team: "ผมตัดสินใจ ตามทีม เค้าบอกผมว่า
ทำได้แบบ opt-out ของ chatgpt ครับ ดังนั้น เราคงต้องทำตามแบบนั้นครับ". This
replaces the "One combined consent screen", "AI box state" and "Gentle words,
specific box" bullets above:

- **Scrollwrap.** The updated-policy screen shows the full policy, not the
  cards, the summary or a link. The single tick "ฉันอ่านและยอมรับ
  นโยบายความเป็นส่วนตัว" unlocks only when the member has scrolled to the end;
  tapping it earlier shows a message asking them to read to the end.
- **AI by acceptance, off in settings.** Accepting turns the `ai_training`
  item on, then a one-time notice says so and points to ตั้งค่า ›
  จัดการความยินยอม. Switching it off there works as today and deletes the
  stored questions.
- **Slice 1 is revised, not followed by a new slice.** Production still runs
  `v1`, so one release asks members once.

### Revision 0.3 (2026-10-23)

The owner picked sample A and asked whether questions are cleaned of names and
personal details before they are kept. They are only partly cleaned: links,
emails, phone numbers and long digit runs are removed, but names, dates,
places and workplaces are kept, the hash key `AI_QUESTION_SALT` is unset, and
nothing deletes questions after two years on a schedule. The owner decided:

- **Layout A, plain text.** The full policy reads as ordinary text, with no
  box or highlight on 3.1.
- **Sign-up follows.** New members get the same single tick and opt-out; the
  optional AI box leaves first-run.
- **3.1 matches everywhere.** The policy, the short AI text, the settings
  switch and the help chapter say what the system does.
- **Rewrite before keeping.** A question is cleaned by the rules, rewritten
  by the model to keep its meaning without names, dates, places or other
  details that point to a person, and cleaned by the rules again. If the
  rewrite fails, nothing is kept.
- **Clean start with a salt.** `AI_QUESTION_SALT` is set on staging and
  production, and the questions kept so far are deleted: "ลบทิ้งเลยแล้ว
  เริ่มเก็บใหม่อย่างถูกต้อง". The hash stays, so a withdrawal still deletes
  that member's questions.
- **Two-year deletion on a schedule:** "ตั้งงานเลย". A daily job deletes
  questions older than two years.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | policy file and page, version gate, re-consent and sign-up screens, pre-push warning | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `bazi-sft-dataset` | question rewrite, scheduled two-year deletion route, the PDPA help chapter seed text | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
| `mumate-infra` | the daily deletion timer, `AI_QUESTION_SALT` in the host env | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (2026-10-22, fe f2bd444, bazi f3c9558)

- Two consent stores, not connected:
  - `consent` (fe, `lib/v2/consent-store.ts`): one appended row per first-run
    with `policy_version = PDPA_POLICY_VERSION = 'v1'`, indexed by `user_id`.
    Nothing reads `policy_version`.
  - `bazi_consent` (bazi `/api/account/consent`): per-purpose switches with
    their own versions (`2026-09`; `ai_training` `2026-10.2`).
- The only gate is `needsFirstRun` (`onboarded_at` empty) in `useV2Home`.
- The policy page is hand-written JSX; its footer prints the current year,
  not an effective date.
- The AI text lives in five places in three versions: policy 3.1 (long),
  `aiTraining.ts` (short, used by sign-up and settings; the chat popup is now
  unused), and the bazi help seed (another long version).
- No migration is needed.
- Staging runs production builds: the `dev` login is off and member login
  needs LINE or Google, which automation cannot pass. The member flow is
  therefore proven locally with `next dev` and the `dev` login; staging proves
  the deploy and the public policy page.

## Boundaries

- One pull request per repository, with checkpoint commits. The agent merges
  after its own checks on the owner's word for this workstream; production is
  promoted only on the owner's word.
- No migration and no change to the settings switches or `/ops`. Revision
  0.3 changes first-run (sign-up), bazi's question log (rewrite before
  keeping) and adds one cron job; `AI_QUESTION_SALT` is already read by the
  code and only gets a value.
- Production writes are on the owner's word: setting the salt, deleting the
  questions kept so far (given in revision 0.3), turning the timer on, the
  help seed, and the promotion. The salt's value lives in the host env files,
  never in a repository, event or response.
- Out of scope: gating pages other than home and chat; merging the two
  consent stores.

## Slices

- [1. Re-consent on a policy change](slices/1.md)
