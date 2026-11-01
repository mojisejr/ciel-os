# Praneet — turn a conversation and knowledge into videos, then learn from the posts

**Workstream:** `praneet-video-posts-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.5
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Goal and owner agreement

On 2026-10-31 the owner approved opening this workstream after agreeing the
workflow below, capped Gemini at **100 baht per month**, and explicitly allowed
parallel work when needed. The first authorized slice is 1. Opening the plan
does not approve any episode's story or claim that production has been proved.

The agent and owner work through the existing chat and `praneet-office`.
The owner supplies a topic or document, or asks what would be interesting.
The agent researches references, develops the creative treatment, checks facts,
writes motion code, and delivers a video and post copy. The owner publishes.

- Page: <https://www.facebook.com/ptPlant/>.
- Identity: a grower who explains interesting things, with durian seedlings
  as the core business. Related general knowledge is welcome; the link to the
  page's identity must be explainable rather than assumed.
- Growth proof: **more than 10,000 total Page followers** and **more than
  2,000,000 cumulative views on the clips produced in this workstream**.
  Organic distribution first, no advertising spend, no deadline, review results
  together every two weeks. These are observed outcome targets, not promises.
- Each proposal starts with accessible recent references and a reason to try
  their hook, pacing or visual treatment with Praneet's own content. Dates and
  visible performance are evidence; a claim that a style is trending is an
  inference to label. A copied clip is not our deliverable.
- All visual production is code: HTML/CSS, SVG, Canvas or Three.js as useful.
  The agent is both creative and motion coder. Cartoon presenters and lip-sync
  are optional techniques, not requirements or the default product.
- HyperFrames running locally is the initial renderer candidate. Verify the
  selected version's license, dependencies and actual output before relying on
  it. Remotion was considered but is not a requirement or an authorized fee.
- Paid services are limited to the owner's existing Codex access and Gemini
  API within the ceiling below. No paid render host, media subscription,
  additional AI provider or lip-sync service is authorized.

## Workflow and approvals

On 2026-10-31 the owner selected the first proposed topic, **"ดินยังเปียก…ทำไมต้นทุเรียนกลับเหี่ยว?"**,
and authorized starting slice 1's tool preparation. Retain the other researched
topic candidates in office's `posts/video/EPISODES.md` backlog. Research current public
creator/course workflows and use their demonstrated practices to improve
quality; a vendor's marketing claim is not performance evidence. Prove an
actual local visual/render sample and inspect it before calling the tools ready.
The topic selection does not approve the narration, storyboard, visual direction
or paid audio generation. Those gates and the existing monthly ceiling remain.

On 2026-11-01, after seeing proposal 001-r01, the owner explicitly requested a
full-length video preview without sound. This authorizes local motion coding
and a silent render of that proposal for review before final episode approval.
It does not approve a voice, paid audio request, publication or external draft
write. Preserve the factual scope and identify the silent file as a visual
preview; its timing is provisional until narration is measured.

On 2026-11-01 the owner requested one full silent cartoon trial after the
original "หนวดพาดู" mascot direction was proposed. Keep episode 001's factual
scope, use an original code-native character and situational storytelling,
and inspect the actual encoded clip. The owner also authorized deleting the
superseded episode's generated videos/render previews to save disk space;
retain reconstructable source, runbooks and unrelated post assets. This is
preview production permission, not final story, voice or publication approval.

On 2026-11-01, after comparing four educational references, the owner selected
the simple drawn 2D cause-and-effect direction and requested a trial. This
authorizes another complete local silent preview of episode 001, using original
drawn plant/soil graphics without a presenter mascot. Retain the existing
factual boundaries and no-paid-call limit. This approves making the preview,
not final story/voice acceptance or publication.

1. Read the page brief, relevant owner material, earlier episodes and feedback.
   Propose a small set of topics with a recommendation and references. Verify
   seasonal claims for the relevant place and tree stage rather than treating
   all durian orchards as synchronized.
2. Prepare the full narration, scene-by-scene storyboard, rough timing, code
   keyframes, visual/voice direction, sources for material claims, and any
   unresolved factual questions. Distinguish illustration from observed evidence.
3. The owner confirms the topic, factual story and visual treatment **before
   full production**. Keep the approved revision and a concise approval record;
   never use a chat/session locator as authority or persist the chat transcript.
4. On that approval, create the episode code, narration and timed animation,
   inspect the actual rendered MP4, fix routine defects, and prepare post copy.
   A material change of meaning or new substantive claim returns for review.
5. Deliver preview and MP4 locally/in chat, cover and post text, and prepare the
   text/short link in the existing `/ops/posts` on the owner's authorization.
   Each delivery names its final revision; make transfer to the owner's posting
   device part of the proof. Existing images may be used when relevant and approved.
6. The owner posts by hand and gives the published URL and available Insights
   in chat. The agent may inspect accessible public clips and reactions, records
   the owner's feedback, and associates it with the episode and F-code.
7. Feed that evidence into the next proposal and the two-week review. Suggested
   changes remain hypotheses until tested; a single successful clip does not
   prove why it succeeded.

No Facebook API, automated publishing, background collector or automatic
reminder is in this plan. Reviews happen as part of owner-agent work, not a
claim that something runs while the chat is closed. The owner cannot provide
business-verification or tax documents now; do not make them a prerequisite.

## Gemini budget boundary

- Maximum **100 THB per calendar month, Asia/Bangkok** for Gemini use under
  this workflow, including regeneration/retries that are charged. Never treat
  a billing alert as an enforced spending cap.
- Before paid use, establish the available monthly balance and a conservative
  reservation per request using current model pricing and output limits, with
  room for conversion, tax and fees. Track settled and outstanding reservations;
  stop new requests before the ceiling could be exceeded. Unknown cost or an
  unbounded request is a reason to prepare locally and defer the API call.
- Other use of the same Gemini billing account/key may consume the allowance.
  Establish how that use is reconciled; do not claim our local counter caps the
  whole account. A provider-side hard limit must be proved if relied on.
- Prefer reuse of unchanged audio and a smaller preview over repeated generation.
  Report estimates as estimates and reconcile with actual usage/billing evidence.
- Keys and billing material stay in an owner-controlled, git-ignored location.
  Do not ask for keys in chat or put values into output, source or events.
- Local rendering and files first. Extra storage/bandwidth on the existing web
  host is not assumed free or approved; check capacity before uploading video.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `praneet-office` | page brief, runbook, episode sources and code, renderer, cost control, feedback and review | checkouts/praneet-office |
| `praneet-web` | existing `/ops/posts`, F-links and sales counters; optional changes only within a later approved slice and cost boundary | checkouts/praneet-web |
| `ciel-os` | this plan, slice acceptance and semantic events | . |

## Starting evidence and boundaries

- Local office main `9fa4d4a` has `scripts/posts.ts`: `card`, `new`, `list`.
  `runbooks/05-posts.md` already has the owner publish manually. Web `52f0311`
  has `lib/posts.ts`, image-only post upload and daily aggregate link/LINE counts;
  orders are associated by the owner's post-code entry. No video workflow or
  Facebook analytics integration was proved in this research session.
- Office branch `posts-text-style`, commit `6d84f2a`, carries an unmerged owner
  text-style rule. Inspect it before writing copy/runbook changes; do not silently
  discard it or merge it as an unrelated change.
- A public Page inspection on 2026-10-31 displayed 613 followers. This is a
  dated observation, not a live counter or an Insights baseline. The owner will
  establish the reporting baseline and source with the first published episode.
- Style references from the owner: <https://www.facebook.com/historyinmaps>
  and <https://github.com/yihui-dev/awesome-opus5-5-videos>. They are inspiration,
  not evidence of Praneet performance or proof of this account's capabilities.
- Separate facts, owner experiences, source claims and illustrative models.
  Check consequential agricultural instructions against appropriate primary
  sources; owner approval alone is not external validation of a technical claim.
- Use the existing posts area and runbooks in office. Code and durable episode
  metadata have a reconstructable home; bulky renders, caches and owner source
  documents stay in designated ignored storage. Do not create a new dashboard,
  global CIEL skill, autonomous agent service or platform for other shops.

## Parallel work

The owner permits independent tasks/subagents within authorized scope and
overlap with the existing nursery, Maps and orchard workstreams. This is not
blanket permission to edit shared files concurrently. HQ work stays confined to
this workstream and its events on the standing branch. Child changes pass their
own clean-main gate and topic-branch workflow; coordinate the posts script,
runbook, package manifest and any web posts files before concurrent edits.
Keep one integrator per shared path, stage only owned paths, and preserve other
lanes. No persistent agent team or new coordination infrastructure is authorized.

## Slices

- [1. One approved story becomes a postable video through office](slices/1.md)
- [2. Repeat the workflow and use the first two-week feedback review](slices/2.md)
- [3. Iterate until the organic follower and cumulative-view targets are proved](slices/3.md)

## Acceptance and closure

Slice 1 is the first vertical proof, slice 2 proves repeat use and the feedback
loop, and slice 3 is the growth outcome. Passing technical checks or producing
one clip does not deliver the final slice. Each later slice needs its own owner
decision. Plans hold intent; closeouts and Git hold what actually happened.
The owner reviews remote merges under README's normal procedure.

Still to establish: Gemini key/billing readiness and a safe 100-THB control,
the approved episode source material/storyboard, voice and visual samples, real render
quality/time, device handoff, and the exact source/definition of views. Metrics
from a public page may be incomplete; unavailable data stays unknown.
