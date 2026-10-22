# MuMate — members accept the updated privacy policy once, with the AI item as its own choice

**Workstream:** `mumate-pdpa-reconsent-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
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

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mootech-fe` | policy file and page, version gate, re-consent screen, pre-push warning | `/Users/non/ghq/github.com/mojisejr/mootech-fe` |
| `bazi-sft-dataset` | the PDPA help chapter seed text | `/Users/non/ghq/github.com/mojisejr/bazi-sft-dataset` |
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
- No migration, no new env, no change to first-run for new members, the
  settings switches, `/ops`, or bazi's question log.
- Out of scope: making the system meet the team's three claims; gating pages
  other than home and chat; merging the two consent stores.

## Slices

- [1. Re-consent on a policy change](slices/1.md)
