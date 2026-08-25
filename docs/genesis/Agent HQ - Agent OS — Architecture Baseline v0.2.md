# Agent HQ / Agent OS
## Stateless, Evidence-Driven Operating Layer for AI Coding Agents

**Architecture Baseline:** v0.2  
**Initial Target:** Codex  
**Future Targets:** Claude Code และ external coding agents อื่น  
**Design stage:** MVP architecture / implementation handoff

---

# 0. Executive Summary

Agent HQ คือ repository กลางที่ทำหน้าที่เป็น **Office / Operating Layer สำหรับ AI Agents**

ผู้ใช้ไม่ได้เข้า project repository แล้วเริ่มคุยกับ Agent แบบไร้ continuity แต่เข้ามาที่ Agent HQ ก่อน

```text
Human
  ↓
Agent HQ
  ↓
Agent / Agent Team
  ↓
Project Repositories
```

Project repositories ยังคงเป็น **pure product codebases**

ส่วนสิ่งที่เกี่ยวกับ:

- Agent behavior
- Skills
- Memory
- Evals
- Evidence
- Lifecycle
- Context reconstruction
- Agent-system improvement

อยู่ที่ Agent HQ

ระบบออกแบบด้วยหลัก:

> **Agents are disposable. Sessions are disposable. Evidence persists. Context is reconstructed.**

และ:

> **Stateless by default. Stateful only where proven necessary.**

---

# 1. Problem

AI Coding Agents มี intelligence สูงขึ้นเรื่อย ๆ แต่การทำงานจริงใน project ใหญ่ยังมีปัญหาเรื่อง continuity

เช่น:

- context window เต็ม
- compaction
- lost-in-the-middle
- session ใหม่ไม่รู้ session เก่า
- Agent ลืม decision
- Agent เดาแทนการตรวจ evidence
- research ไม่สุด
- planning หลุด
- ทำงานซ้ำ
- handoff ไม่ครบ
- หลาย Agent ไม่รู้ shared context
- ไม่รู้ว่า Agent/Skill version ใหม่ดีขึ้นจริงหรือไม่
- memory โตขึ้นจนกลายเป็น context bloat
- เปลี่ยน Claude/Codex/Harness แล้ว knowledge หาย

ปัญหาหลักจึงไม่ใช่แค่:

> How do we make the model smarter?

แต่คือ:

> **How do we build a system around disposable agents that preserves continuity, evidence, knowledge, and learning?**

---

# 2. Product Vision

Agent HQ เป็น persistent operating environment ที่อยู่เหนือ external agents

```text
┌─────────────────────────────────────────┐
│                HUMAN                    │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│               AGENT HQ                  │
│                                         │
│ AGENTS.md                               │
│ Skills                                  │
│ Memory                                  │
│ Evals                                   │
│ Retrieval                               │
│ Context Reconstruction                  │
└──────────────────┬──────────────────────┘
                   ↓
        Claude / Codex / Harness
                   ↓
            Agent / Team
                   ↓
┌──────────────┬──────────────┬──────────────┐
│ Project A    │ Project B    │ Project C    │
│ pure code    │ pure code    │ pure code    │
└──────────────┴──────────────┴──────────────┘
```

---

# 3. Initial Target: Codex

MVP จะเริ่มจาก Codex

`AGENTS.md` ทำหน้าที่เป็น bootstrap contract / constitution ของ HQ

แต่ `AGENTS.md` ไม่ควรเป็น memory database

มันควรบอก Agent เพียง:

- คุณอยู่ที่ไหน
- operating principles คืออะไร
- lifecycle คืออะไร
- Skills อยู่ไหน
- project อยู่ไหน
- ก่อนทำงานต้อง Wake
- ก่อนจบต้อง Closeout
- evidence มาก่อน assumption

รายละเอียดอื่นถูก retrieve เมื่อจำเป็น

---

# 4. Core Architecture Principles

## 4.1 Stateless by Default

ไม่สร้าง long-running runtime ถ้ายังไม่มี evidence ว่าจำเป็น

ไม่จำเป็นต้องมี:

- memory daemon
- persistent agent process
- Redis
- distributed state manager
- heartbeat
- always-running coordinator

operation สามารถเป็น:

```text
request
 ↓
read persistent sources
 ↓
process
 ↓
write necessary result
 ↓
return
 ↓
process dies
```

---

## 4.2 Persist Facts and Evidence, Reconstruct Context

ไม่พยายาม persist working context ทั้งหมด

```text
Persistent Sources
      +
Current Environment
      +
Current Goal
      ↓
Context Reconstruction
      ↓
Shared Working Context
```

Working Context ทิ้งได้หลัง session จบ

---

## 4.3 Store Once, Project Many Ways

ข้อมูล canonical ไม่ควรมีทั้ง:

```text
agent-memory
human-memory
dashboard-memory
summary-memory
```

เก็บ source เดียว

แล้ว project เป็น views ต่าง ๆ

```text
Canonical Sources
       │
 ┌─────┼───────────┐
 ↓     ↓           ↓
Agent Human       Eval
View  View        View
```

views เหล่านี้ generate แบบ stateless ได้

---

## 4.4 Human-Auditable, Not Human-Optimized

Canonical memory ควร:

- structured
- concise
- semantic
- machine-friendly
- human-auditable

แต่ไม่ต้องเขียน prose ยาวเพื่อให้ Human อ่านสบายทุกครั้ง

Human-friendly explanation สามารถ generate on demand

---

## 4.5 Reference, Don't Duplicate

ถ้าข้อมูลมี authoritative source อยู่แล้ว:

> **เก็บ reference แทนการ copy**

เช่น Git รู้ว่าไฟล์อะไรเปลี่ยน

HQ Event ไม่จำเป็นต้อง copy diff

เก็บ:

```yaml
git:
  start: abc123
  end: def456
```

แล้ว reconstruct ด้วย Git เมื่อจำเป็น

---

## 4.6 Persist Only What Cannot Be Reliably Reconstructed

หลักสำคัญ:

> **Don't persist what can be deterministically reconstructed from an authoritative source.**

ตัวอย่าง:

Git diff → reconstruct ได้  
Commit list → reconstruct ได้  
Current branch → query ได้  
GitHub issue → query ได้

แต่:

“ทำไมเราเลือก architecture นี้?”

อาจ reconstruct จาก code อย่างน่าเชื่อถือไม่ได้

ดังนั้นต้อง persist เป็น semantic event/decision

---

# 5. Authoritative History Model

Memory ไม่ใช่ history ทั้งหมด

Agent HQ มี authoritative histories หลายตัว

```text
┌────────────────────────────────────────────┐
│          AUTHORITATIVE SOURCES             │
│                                            │
│ Project Git                                │
│ HQ Git                                     │
│ GitHub                                     │
│ HQ Event Store                             │
└────────────────────────────────────────────┘
```

แต่ละตัวตอบคำถามต่างกัน

| Source | ตอบอะไร |
|---|---|
| Project Git | Product/code เปลี่ยนอะไร |
| HQ Git | Agent system เปลี่ยนอะไร |
| GitHub | งาน/issue/PR มี lifecycle อย่างไร |
| HQ Events | ทำไม / เกิดอะไร / ตัดสินใจอะไร |
| Knowledge | ตอนนี้เราเชื่อว่าอะไรเป็น current truth |

ดังนั้น:

> **Memory is the semantic layer over authoritative histories.**

---

# 6. Git as First-Class Evidence

Git ไม่ได้เป็นเพียง version control

มันเป็น evidence source

Project Git:

```text
What changed in the product?
```

HQ Git:

```text
What changed in the Agent System?
```

ตัวอย่าง session:

```text
Wake
 ↓
Project HEAD = ABC123
 ↓
Execute
 ↓
Commit A
Commit B
Commit C
 ↓
Closeout
 ↓
Project HEAD = DEF789
```

Closeout ไม่จำเป็นต้อง copy change list

เก็บ:

```yaml
git:
  start: ABC123
  end: DEF789
```

แล้วภายหลัง:

```text
git log ABC123..DEF789
git diff ABC123..DEF789
```

สามารถ reconstruct implementation history ได้

---

# 7. Session ≠ Commit

ห้ามบังคับ:

```text
1 Session = 1 Commit
```

relationship ที่ถูกต้อง:

```text
Session
 ├── 0..N Project Commits
 └── 0..N HQ Commits
```

บาง session อาจเป็น research

บาง session อาจมีหลาย commits

บาง session อาจไม่มี code change เลย

---

# 8. Evidence Graph

ข้อมูลควร link กันด้วย identifiers

ไม่จำเป็นต้องมี graph database

conceptually:

```text
                 Session
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
 Project Git      Eval       Decision
        │           │           │
        ▼           │           ▼
      Diff          │        Knowledge
        │           │
        └───────────┼───────────┘
                    ▼
                  Issue
```

SQLite ธรรมดาสามารถ index relationship เหล่านี้ได้

---

# 9. Memory Architecture v0.2

Memory แบ่งเป็น:

```text
memory/
├── events/
├── knowledge/
└── index.sqlite
```

ไม่จำเป็นต้องมี:

```text
memory/retrospectives/
memory/decisions/
```

เพราะ retrospective และ decision เป็น **event types**

ไม่ใช่ storage architecture

---

# 10. Event Store

`memory/events/`

คือ semantic historical events ที่ Git/GitHub reconstruct ไม่ได้ดีพอ

properties:

- append-only
- immutable
- timestamped
- structured
- concise
- human-auditable

ตัวอย่าง:

```text
memory/events/
└── 2026/
    └── 08/
        └── 25/
            ├── ..._session_start.yaml
            ├── ..._decision.yaml
            ├── ..._eval.yaml
            └── ..._closeout.yaml
```

หนึ่ง Event = หนึ่งไฟล์

---

# 11. Event Naming

ใช้ timestamp sortable

```text
YYYYMMDDTHHMMSS_type.yaml
```

ตัวอย่าง:

```text
20260825T051501_session_start.yaml
20260825T052810_decision.yaml
20260825T054210_eval.yaml
20260825T054500_closeout.yaml
```

เวลาใน payload ใช้ ISO 8601 พร้อม timezone

```yaml
timestamp: 2026-08-25T05:45:00+07:00
```

---

# 12. Event Types v0.2

MVP ใช้เพียง:

```text
session_start
decision
checkpoint
eval
closeout
issue_observation
memory_promotion
```

ไม่ควรสร้าง event type จำนวนมากจนกว่าจะมี use case

---

# 13. Canonical Event Format

ตัวอย่าง Decision:

```yaml
id: evt_20260825_052810
type: decision

timestamp: 2026-08-25T05:28:10+07:00

project: agent-hq
session: sess_20260825_01

title: Treat Git as authoritative implementation history

decision: >
  Project and HQ Git histories are first-class evidence sources.
  Memory should reference Git boundaries instead of duplicating
  reconstructable implementation history.

rationale:
  - reduce duplicated memory
  - improve traceability
  - reduce context bloat

refs:
  - git:hq:abc123
  - session:sess_20260825_01

status: accepted
```

---

# 14. Knowledge Store

`memory/knowledge/`

ต่างจาก Event Store

Event:

> What happened?

Knowledge:

> What should we currently believe/use?

Knowledge เป็น living documents และแก้ไขได้

ตัวอย่าง:

```text
memory/knowledge/
├── agent-hq/
│   ├── architecture.md
│   ├── principles.md
│   └── glossary.md
│
└── projects/
    ├── takai/
    │   ├── overview.md
    │   ├── architecture.md
    │   └── decisions.md
    │
    └── ...
```

---

# 15. Knowledge Promotion

ไม่ใช่ทุก Event ต้องกลายเป็น Knowledge

pipeline:

```text
Experience
 ↓
Event
 ↓
Promotion Decision
 ↓
Knowledge
```

ตัวอย่าง:

One-off bug:

```text
Event only
```

Architecture decision:

```text
Event
 ↓
Promote
 ↓
architecture.md
```

Knowledge ต้อง reference กลับ event ต้นทางเมื่อเหมาะสม

---

# 16. Single Source, Multiple Projections

Canonical sources ไม่ควรเขียนซ้ำเพื่อ Human

Human View เป็น projection

ตัวอย่าง Human ถาม:

> เดือนนี้ Agent HQ เปลี่ยน architecture อะไรบ้าง?

ระบบทำ:

```text
HQ Git
+
Decision Events
+
Knowledge
 ↓
Stateless synthesis
 ↓
Human-readable report
```

report ไม่ต้อง persist โดย default

---

# 17. Agent Projection

Agent ไม่จำเป็นต้องโหลด memory ทั้งหมด

Wakeup ทำ:

```text
Current Goal
+
Project
+
Git
+
Relevant Events
+
Knowledge
+
Previous Eval
 ↓
Minimal Working Context
```

ดังนั้น memory ใหญ่ขึ้นไม่ได้แปลว่า context ต้องใหญ่ขึ้นตาม

---

# 18. Human Projection

Human สามารถถาม:

```text
What happened yesterday?
Why was this decision made?
What changed this week?
Why does this code exist?
What problems keep recurring?
Did Agent performance improve?
```

ระบบ retrieve source แล้วสร้าง explanation on demand

ไม่มี human-memory database อีกชุด

---

# 19. Retrieval Layer

MVP แรกอาจอ่าน filesystem + Git โดยตรง

ต่อมาจึงเพิ่ม:

```text
memory/index.sqlite
```

SQLite ทำหน้าที่เป็น **index**

ไม่ใช่ source of truth

ตัวอย่าง metadata:

```text
event_id
type
project
session
timestamp
title
tags
importance
file_path
git_refs
issue_refs
```

ถ้า SQLite เสีย:

> rebuild จาก canonical sources ได้

นี่เป็น property สำคัญ

---

# 20. Future HQ MCP

MCP เป็น nervous system / capability boundary

```text
Agent / Skills
      │
      ▼
    HQ MCP
      │
 ┌────┼─────────────┐
 ↓    ↓             ↓
Git  Memory       GitHub
     Events
     Knowledge
```

MCP เองยัง stateless-first

---

# 21. MCP Capability Philosophy

Skills บอก:

> ต้องทำอะไร

MCP บอก:

> ระบบทำ operation อะไรได้

ตัวอย่าง:

```text
memory.search
memory.get
memory.write_event

git.history
git.diff
git.status

eval.record
eval.query

issue.search
issue.create
```

แต่ MVP ยังไม่จำเป็นต้องสร้างทั้งหมด

---

# 22. Lifecycle

Canonical lifecycle:

```text
WAKE
 ↓
ALIGN
 ↓
PLAN
 ↓
EXECUTE
 ↓
CLOSEOUT
 ↓
session dies
```

---

# 23. Wake

Wake = Context Reconstruction

ไม่ใช่เพียงอ่าน retrospective

Wake ตรวจโลกจริงด้วย

```text
Identify Project
 ↓
Inspect Current Git
 ↓
Read Last Closeout
 ↓
Compare Git Boundary
 ↓
Retrieve Relevant Events
 ↓
Retrieve Current Knowledge
 ↓
Inspect Previous Eval
 ↓
Inspect Relevant Issues
 ↓
Construct Shared Context
```

ดังนั้น Agent ไม่เชื่อ memory แบบ blind

มัน reconcile:

> remembered state vs actual state

---

# 24. Shared Context Alignment

หลัง Wake Human + Agent align:

```text
Where are we?
What changed?
What evidence exists?
What remains unresolved?
What are we trying to achieve?
What will we NOT do?
What is done?
```

จากนั้นจึง Plan

---

# 25. Planning

Planning เน้น vertical slices

และ:

> Evidence before assumption.

ถ้า Agent สามารถตรวจ code / Git / issue / test ได้ ต้องตรวจก่อนเสนอ architecture จากการเดา

---

# 26. Execute

Agent ใช้:

- Codex
- Skills
- Project repository
- Git
- tools
- sub-agents
- external Harness

โดย Agent HQ ไม่จำเป็นต้องถือ mutable runtime state กลาง

---

# 27. Closeout

Closeout:

> Experience → Evidence

สร้าง semantic artifacts เฉพาะสิ่งที่ reconstruct ไม่ได้

ตัวอย่าง Closeout:

```yaml
type: closeout

session: sess_20260825_01
project: takai

goal: implement wage flow
outcome: partial

git:
  start: abc123
  end: def456

completed:
  - wage entry flow

unresolved:
  - export verification

human_corrections:
  - agent initially misunderstood existing API behavior

lessons:
  - inspect existing API before proposing replacement

next:
  - verify export behavior
```

ไม่ต้องเขียน:

```text
files_changed
full diff
commit details
```

เพราะ Git reconstruct ได้

---

# 28. Metrics vs Evals

Metrics:

> What happened?

เช่น:

```text
duration
replans
human corrections
verification failures
context recoveries
```

Eval:

> How well did it happen?

เช่น:

```text
planning_quality
evidence_quality
continuity_quality
```

ต้องแยกสองอย่างนี้

---

# 29. Eval as Event

Eval ไม่จำเป็นต้องมี `/evals` directory

มันเป็น Event Type:

```yaml
type: eval

session: sess_20260825_01

metrics:
  replans: 2
  human_corrections: 1

evaluation:
  planning:
    rating: needs_improvement
    evidence:
      - session:sess_20260825_01
      - git:abc123..def456
```

---

# 30. Self-Evaluation Is Not Truth

Agent self-evaluation เป็น evidence หนึ่งชิ้น

Leader/System Eval ต้อง corroborate กับ:

```text
Git
Tests
Build
Tool outputs
Human correction
Task outcome
```

---

# 31. Two Evaluation Loops

## Session Loop

```text
Execute
 ↓
Closeout
 ↓
Eval
 ↓
Evidence
 ↓
next Wake
```

## System Loop

```text
Many Sessions
 ↓
Aggregate
 ↓
Pattern
 ↓
Issue
 ↓
Improve Skill/System
 ↓
HQ Git Change
 ↓
Future Sessions
 ↓
Compare Eval
```

---

# 32. Behavioral Version Control

นี่คือจุดที่ HQ Git สำคัญมาก

Git ตอบ:

```text
What changed?
```

Eval ตอบ:

```text
Did behavior improve?
```

ทุก session ควรบันทึกอย่างน้อย:

```yaml
environment:
  hq_commit: c241a09

project_git:
  start: 82ade1f
  end: f11a208
```

ดังนั้นเราสามารถ correlate:

```text
HQ commit
 ↓
Skill changed
 ↓
Future sessions
 ↓
Project outcomes
 ↓
Eval trends
```

---

# 33. Agent-System Evolution vs Product Evolution

เรามี Git history สองเส้น

```text
HQ Git
│
└── Agent System Evolution

Project Git
│
└── Product Evolution
```

Evals เชื่อมสองโลกเข้าด้วยกัน

ตัวอย่าง:

```text
HQ commit:
planning skill 0.8 → 0.9

        ↓

10 future project sessions

        ↓

human corrections -35%
replans -20%
verification +15%
```

นี่คือ evidence ว่า Agent System ดีขึ้นจริงหรือไม่

---

# 34. Issue Gate

อย่าเปิด GitHub Issue จาก Agent self-criticism โดยตรง

ใช้:

```text
Observation
 ↓
Evidence
 ↓
Repeated Pattern?
 ↓
Severity?
 ↓
Already Known?
 ↓
Issue Gate
 ↓
Issue
```

MVP แรกควรเสนอ candidate issue ให้ Human approve ก่อน

automation ค่อยตามมา

---

# 35. Nothing-to-Delete Principle

อย่า overwrite historical evidence

```text
Event
 ↓
Index
 ↓
Knowledge
 ↓
Projection
```

Derived summary สามารถสร้างใหม่ได้

Canonical evidence ไม่ควรถูกลบเพียงเพราะมี summary ใหม่

---

# 36. Proposed Repository Structure — MVP

```text
agent-hq/
│
├── AGENTS.md
│
├── README.md
│
├── VERSION
│
│
├── skills/
│   ├── wakeup/
│   │   └── SKILL.md
│   └── closeout/
│       └── SKILL.md
│
├── memory/
│   ├── events/
│   │   └── YYYY/MM/DD/
│   │
│   ├── knowledge/
│   │   ├── agent-hq/
│   │   └── projects/
│   │
│   └── index.sqlite       # add later / rebuildable
│
├── projects/
│   ├── project-a/
│   └── project-b/
│
└── scripts/
    └── future stateless utilities
```

`projects/` สามารถเป็น:

- ignored clones
- symlinks
- worktrees
- external paths via configuration

implementation นี้ยังไม่ต้องเคาะตอน MVP แรก

---

# 37. What We Deliberately Removed

จาก architecture รุ่นก่อน เราไม่จำเป็นต้องมี persistent folders เช่น:

```text
retrospectives/
decisions/
evals/
human-memory/
agent-memory/
reports/
```

เพราะ:

```text
Retrospective → closeout event
Decision      → decision event
Eval          → eval event
Human report  → projection
Agent context → projection
```

ทำให้ storage model เล็กลงมาก

---

# 38. MVP v0.1 — Prove Continuity

เป้าหมายเดียว:

> **Session B สามารถทำงานต่อจาก Session A ได้อย่างถูกต้อง โดย Human ไม่ต้องเล่าประวัติ Session A ใหม่**

สร้างเพียง:

```text
AGENTS.md
Wakeup Skill
Closeout Skill
Event schema
Knowledge directory
Git-aware context reconstruction
```

ยังไม่ต้อง MCP

ยังไม่ต้อง vector DB

ยังไม่ต้อง complex SQLite

ยังไม่ต้อง daemon

---

# 39. MVP Experiment

เลือก project จริง 1 project

ทำ 5–10 sessions

แต่ละ session:

```text
Wake
 ↓
Align
 ↓
Plan
 ↓
Execute
 ↓
Closeout
```

เก็บ:

```text
session event
closeout
eval
Git boundaries
important decisions
```

จากนั้นสังเกตว่า:

- Wake retrieve อะไรบ่อย?
- อะไรไม่เคยใช้?
- อะไรถูก duplicate?
- Human ต้องแก้ context บ่อยไหม?
- Agent โหลดข้อมูลมากเกินไหม?
- Git ช่วย reconstruct ได้แค่ไหน?
- อะไรควร promote เป็น Knowledge?

ใช้ evidence เหล่านี้ออกแบบ v0.2 implementation

---

# 40. MVP Success Metrics

### Continuity

Human ต้องเล่าของเดิมซ้ำน้อยลงหรือไม่

### Context Accuracy

Wake reconstruct current state ถูกหรือไม่

### Retrieval Precision

ข้อมูลที่ retrieve มามีประโยชน์จริงกี่ส่วน

### Human Correction

Human ต้องแก้ความเข้าใจ Agent กี่ครั้ง

### Evidence Discipline

Agent ตรวจ Git/code/test ก่อนสรุปหรือไม่

### Context Cost

Wakeup context มีขนาดเท่าไร และมี noise เท่าไร

### Closeout Quality

Session ต่อไปสามารถใช้ Closeout ได้จริงหรือไม่

---

# 41. MVP v0.2

หลัง usage ให้ evidence แล้วค่อยเพิ่ม:

```text
SQLite Index
Issue Candidate Detection
Basic Query CLI
```

เช่น:

```text
hq memory search
hq history project
hq session show
hq eval recent
```

ทั้งหมด stateless

---

# 42. MVP v0.3 — HQ MCP

เมื่อ CLI/interface เริ่ม stable:

```text
Skills
  ↓
HQ MCP
  ↓
Git / Events / Knowledge / GitHub
```

MCP เป็น abstraction boundary

ไม่ใช่ memory database

ไม่ใช่ Agent brain

ไม่ใช่ persistent runtime

---

# 43. Future Human Interface

เมื่อ canonical architecture stable แล้ว Human UI สามารถสร้างได้โดยไม่เปลี่ยน source

```text
Canonical Sources
 ↓
Retrieval
 ↓
Dashboard
```

เช่น:

```text
Today
3 sessions
2 decisions
1 unresolved issue

Agent Health
Planning       ↑
Evidence       ↑
Rework         ↓

Projects
TAKAI
Harness
Orchard AI
```

Dashboard เป็น projection เท่านั้น

---

# 44. Future Vendor Independence

วันนี้:

```text
Agent HQ
 ↓
Codex
```

อนาคต:

```text
Agent HQ
 ├── Codex
 ├── Claude Code
 └── Future Agent
```

สิ่งที่ควร survive การเปลี่ยน vendor:

```text
Skills
Events
Knowledge
Evals
Git History
Lifecycle
Evidence relationships
```

---

# 45. Architecture Layers

หลังจากการตกผลึกรอบนี้ Architecture สามารถมองเป็น 6 Layers:

```text
┌────────────────────────────────────────┐
│ 6. HUMAN / AGENT PROJECTIONS           │
│ Context / Reports / Dashboard          │
├────────────────────────────────────────┤
│ 5. LIFECYCLE + SKILLS                  │
│ Wake / Align / Plan / Execute / Close  │
├────────────────────────────────────────┤
│ 4. RETRIEVAL / MCP                     │
│ Search / Link / Reconstruct            │
├────────────────────────────────────────┤
│ 3. SEMANTIC MEMORY                     │
│ Events + Curated Knowledge             │
├────────────────────────────────────────┤
│ 2. AUTHORITATIVE HISTORY               │
│ Project Git / HQ Git / GitHub          │
├────────────────────────────────────────┤
│ 1. EXTERNAL AGENT INFRASTRUCTURE       │
│ Codex / Claude / Harness               │
└────────────────────────────────────────┘
```

แต่ Layers 4–6 สามารถ stateless ได้เกือบทั้งหมด

---

# 46. Core Data Flow

ระบบทั้งหมดขมวดได้เป็น:

```text
              EXPERIENCE
                   │
       ┌───────────┴────────────┐
       │                        │
       ▼                        ▼
Physical Change           Semantic Meaning
       │                        │
       ▼                        ▼
      Git                    Event
       │                        │
       └──────────┬─────────────┘
                  │
               Retrieval
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
     Knowledge             Eval
        │                   │
        └─────────┬─────────┘
                  │
             Next Wake
                  │
            Shared Context
                  │
                Work
```

---

# 47. Memory Pipeline

Semantic memory lifecycle:

```text
Experience
 ↓
Event
 ↓
Promotion
 ↓
Knowledge
 ↓
Retrieval
 ↓
Context
```

Git lifecycle:

```text
Code Change
 ↓
Commit
 ↓
Git History
 ↓
Retrieval
 ↓
Context
```

ทั้งสองมาบรรจบกันตอน Wake

---

# 48. Learning Loop

Agent ไม่ได้เรียนรู้โดยเปลี่ยน model weights

**System เรียนรู้**

```text
Experience
 ↓
Evidence
 ↓
Eval
 ↓
Pattern
 ↓
Issue
 ↓
System Change
 ↓
HQ Commit
 ↓
Future Experience
 ↓
Compare
```

Human/Git/Issue workflow ยังคงเป็น governance

---

# 49. Things We Explicitly Do NOT Build Yet

ยังไม่สร้าง:

- local LLM
- vector database
- graph database
- distributed runtime
- Redis
- event bus
- persistent memory daemon
- autonomous self-modification
- custom Git replacement
- custom GitHub replacement
- giant AGENTS.md
- duplicate Human/Agent memory stores
- huge retrospective documents
- complex agent orchestration

Complexity ต้องพิสูจน์ความจำเป็นก่อน

---

# 50. Core Rules v0.2

## Rule 1
**Stateless by default.**

## Rule 2
**Evidence before assumption.**

## Rule 3
**Persist facts and evidence; reconstruct context.**

## Rule 4
**Store once, project many ways.**

## Rule 5
**Human-auditable, not human-optimized.**

## Rule 6
**Reference, don't duplicate.**

## Rule 7
**Do not persist what authoritative sources can reliably reconstruct.**

## Rule 8
**Git versions code; Evals version behavior.**

## Rule 9
**Self-evaluation is evidence, not truth.**

## Rule 10
**Promote patterns into knowledge, not every event.**

## Rule 11
**Sessions are disposable.**

## Rule 12
**Indexes are disposable and rebuildable.**

## Rule 13
**External Harness is infrastructure, not our product.**

## Rule 14
**Complexity must be earned by evidence.**

---

# 51. Updated Mental Model

จำ Agent HQ ทั้งระบบได้ด้วย:

```text
        AUTHORITATIVE REALITY
                 │
      ┌──────────┼──────────┐
      │          │          │
 Project Git   HQ Git     GitHub
      │          │          │
      └──────────┼──────────┘
                 │
             HQ Events
                 │
                 ▼
        Retrieval / Linking
                 │
          ┌──────┴──────┐
          │             │
      Knowledge        Evals
          │             │
          └──────┬──────┘
                 │
              WAKEUP
                 │
       Reconstruct Context
                 │
               ALIGN
                 │
                PLAN
                 │
              EXECUTE
                 │
              CLOSEOUT
                 │
       Events + Git Evidence
                 │
           session dies
                 │
                 └──────────→ next WAKE
```

---

# 52. North-Star Architecture Statement

> **Agent HQ is a stateless-first, evidence-driven operating layer that sits above disposable AI agents and reconstructs reliable working context from authoritative histories, semantic memory, and behavioral evidence.**

Memory definition:

> **Memory is not the entire history. Memory is the semantic layer over authoritative histories.**

Storage philosophy:

> **Persist once. Reference authoritative sources. Reconstruct what can be reconstructed. Project different views on demand.**

Lifecycle philosophy:

> **Closeout turns experience into evidence.  
> Git preserves physical change.  
> Events preserve semantic meaning.  
> Promotion turns durable meaning into knowledge.  
> Wakeup reconstructs them into working context.  
> Evals tell us whether the system is actually improving.**

และประโยคที่ยังเป็นแก่นของระบบ:

> **Agents forget. The system doesn't.**

---

# 53. Current Decision Baseline

ณ Architecture Baseline v0.2 เราตกลงที่จะเริ่ม implementation ด้วย:

```text
Codex
+
AGENTS.md
+
Wakeup Skill
+
Closeout Skill
+
Git-aware Context Reconstruction
+
Append-only YAML Events
+
Minimal Markdown Knowledge
```

**ยังไม่มี MCP ใน iteration แรก**

**ยังไม่มี SQLite จนกว่า retrieval usage จะเริ่มชัด**

**ยังไม่มี duplicate Human/Agent memory**

**ยังไม่มี persistent runtime**

**ยังไม่มี automatic Issue creation**

เป้าหมายแรกไม่ใช่สร้าง Agent OS ที่สมบูรณ์

เป้าหมายแรกคือพิสูจน์ว่า:

> **เราเปิด Codex session ใหม่บน Agent HQ แล้ว Agent สามารถ reconstruct ได้อย่างถูกต้องว่าเราอยู่ตรงไหน ทำอะไรมา ทำไมถึงทำ และควรทำอะไรต่อ โดย Human ไม่ต้องเล่าเรื่องเดิมใหม่**

เมื่อสิ่งนี้ทำงานได้ เราจึงมี foundation ที่ควรค่าแก่การสร้าง MCP, indexing, multi-agent coordination และ automated improvement เพิ่มบนมัน