# Praneet — reusable reference-to-collectible workflow

**Workstream:** `praneet-character-workflow-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Goal and confirmed scope

Create a repeatable, chat-driven Office workflow for the owner-selected
collectible style. Its two entry paths are (1) an idea/example image developed
into an approved reference with the current chat's built-in image-generation
capability, and (2) a supplied approved reference entering modelling directly.
Both finish with a reusable static character package, neutral multi-view proof
and a silent ten-second 360-degree turntable. Downstream maps, educational
episodes and animation consume that package in separate work.

Owner accepts Xiao Mu v04 as the style baseline and selects head-large,
plump human figures with costumes/hoods as the first family. Preserve reference
identity and balanced proportions around the whole figure: coherent head,
face and costume volumes, rounded shoulders/belly, short neck/limbs, plausible
fixed cartoon clothing and deliberate characteristic accessories. Symmetry,
closed topology and a good front view alone do not establish art quality.

Owner approves references and the final model/turntable. The agent develops,
inspects and iterates primary masses, silhouettes and other views internally;
ask during modelling only for material reference conflicts, ambiguous identity
or a necessary change to an approved design. Do not impose a routine extra
owner gate for every technical or parameter adjustment.

Height/scale, palette and supported proportion changes should become data
where practical. New shapes or accessories may need character-specific source.
This is a reusable workflow and toolset operated by an AI, not a promise that
every character can be generated from one fixed topology or without iteration.
More details do not automatically require more owner questions.

## Shared understanding and boundaries

- Use Office runbooks, prompt templates, small file formats and local scripts.
  No new web app, service, daemon, database, MCP, global skill or course product.
- Ref Generator means creating actual reference images in conversation, not
  only returning a prompt for the owner. Use the built-in capability when
  available; do not add Gemini image API, OpenAI API keys, paid CLI fallbacks,
  subscriptions or automatic paid retries. No new image call is authorized
  merely by this workstream-opening record.
- Prior Xiao Mu previews were code/3D renders, not evidence that the native
  raster-ref workflow has already passed. Native tool output handling,
  multi-view consistency and approval provenance need their own proof.
- Share the approved-ref/asset contracts, source and modelling/review commands
  between Codex and Claude. Host image-generation capability is not assumed
  identical across clients. A client without it can use the approved-ref entry;
  do not silently substitute a paid provider or claim untested parity.
- Retain the existing Gemini ceiling of 100 THB/month and the parent expense
  boundary. This character workflow is silent and adds no TTS. Record observed
  image-tool use, API receipts if ever explicitly authorized, retries, render
  time and unknown subscription/hardware allocation separately; unknown cost
  is not zero. Do not create a competing account-wide budget ledger.
- Preserve both production video styles and all Xiao Mu lab assets/history.
  CIEL stays on primary `hq/20261103`; only owned workstream/event paths are
  staged. Office implementation must preserve the unmerged lab work and pass
  the applicable Git start gate before new tracked product work.

## Package and acceptance intent

Each character carries an agreed design/reference, identity and proportion
notes, versioned source, reproducible build/review instructions, a Blender
working file, GLB, neutral colored/silhouette views, ten-second silent MP4,
provenance/checksums and a bounded cost/usage record. Define scale, front
direction and foot origin for downstream reuse without baking map coordinates
or episode text into the asset. Large/generated media and credentials follow
Office's existing local-storage boundary; do not commit secrets or chat locators.

The workflow is proved with the retained Xiao Mu baseline plus a second
meaningfully different figure in the selected family. Exercise both entry
paths and owner reference/final-art gates. Verify actual outputs and costs;
do not call a parameter-file refactor alone a general character generator.

## Starting evidence and unknowns

- Office baseline: `6a3201a4f2a5c3c593714dbc737f5d895d037e84`,
  `posts/video/labs/xiao-mu-map/PROOF-v04.json` and `design.py`.
  The current renderer/GLB proof is real; design geometry, titles and paths
  remain character-specific. A reusable generator and saved .blend package
  are intended outputs, not completed capabilities.
- Parent lab: [praneet-character-map-lab-001](../praneet-character-map-lab-001/PLAN.md).
  Style acceptance here does not merge its branch or adopt v04 on the map.
- Native image-generation quotas/billing, repeatable ref quality, second figure
  selection and actual Claude operation remain unproved. No unlimited/free
  image-generation or full client-portability claim.
- Existing reference inconsistencies, private billing, asset transfer across
  machines and parent audience-feedback unknowns remain separate from this
  workflow proof. No publication, virality or print/rig readiness is implied.

## Project links

| Project ID | Role |
| --- | --- |
| `ciel-os` | owner agreement, split plan and semantic checkpoints |
| `praneet-office` | reusable character instructions, asset source and proof tools |

## Slices

- [1. Preserve the chosen style and extract the reusable asset workflow](slices/1.md)
- [2. Prove conversational reference generation and reference approval](slices/2.md)
- [3. Prove a second character through the shared workflow](slices/3.md)
