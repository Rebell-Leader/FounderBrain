# Reteach Tomorrow

**Every student gets a tutor. Every teacher gets their Sunday back.**

A teacher pastes an assignment and rubric, uploads a whole class of submissions (typed, CSV, or **photos of handwritten work**), and gets back: instant Socratic feedback for every student, a class-wide misconception heatmap, and a one-click "reteach brief" — a mini-lesson plus fresh practice problems targeting exactly what the class got wrong.

🎥 **Demo video:** [YouTube link]
🚀 **Live demo (no setup needed):** [deployed URL] — click **"Load sample class"** to judge it in 60 seconds
🏆 **Track:** Education

---

## The problem

Teachers spend 5+ hours a week grading, writing the same handful of comments over and over. Worse: grading one paper at a time means class-wide patterns stay invisible. If 14 of 25 students flip a sign when isolating x, no gradebook will ever tell the teacher that. Reteach Tomorrow makes the invisible pattern the headline.

## What it does

1. **Ingest anything.** Paste text, upload a CSV export, or drag in photos of handwritten worksheets (GPT-5.6 vision transcribes them).
2. **Per-student Socratic feedback.** Rubric-aligned coaching that points at the broken reasoning step without giving away the answer.
3. **Class misconception heatmap.** GPT-5.6 clusters errors across all submissions into named misconceptions with student counts and evidence quotes.
4. **Reteach brief.** One click generates tomorrow's warm-up: a mini-lesson addressing the top misconception plus 3 targeted practice problems.

## Quick start for judges

**Fastest path — hosted demo (recommended):**
1. Open [deployed URL]
2. Click **"Load sample class"** (loads a realistic 8th-grade algebra assignment with 25 varied submissions, including handwritten photos)
3. Click **"Grade class"** → explore per-student feedback → open the **Class Insights** tab → click **"Generate reteach brief"**

**Run locally:**
```bash
git clone [repo]
cd reteach-tomorrow
cp .env.example .env        # add your OPENAI_API_KEY
npm install
npm run dev                  # app on http://localhost:3000
```
Sample data lives in `/sample-data` (see its README). The "Load sample class" button works locally too.

**Test with your own class:** upload any CSV with columns `student_name,answer`, or drop in JPG/PNG photos of written work.

## How Codex and GPT-5.6 did the heavy lifting

*(This section is deliberately specific — it's part of how judges evaluate technical implementation.)*

### Codex (build time)
- **Scaffolding & iteration:** The entire app was built inside Codex. Session ID for core functionality: `[/feedback session ID — also in submission form]`
- **The misconception-aggregation pipeline** (`/lib/aggregate.ts`) was developed across 14+ Codex turns: we described desired clustering behavior in plain language, Codex implemented it, wrote tests, ran them, and fixed its own failures — including a subtle bug where near-duplicate misconception labels ("sign error" vs "flipped sign") fragmented the heatmap. Codex proposed and implemented the canonical-label merging step.
- **Schema-drift hardening:** GPT-5.6 vision occasionally returned transcriptions that broke our JSON schema. Codex diagnosed the failure from logs and added Zod validation with automatic retry-with-repair (`/lib/llm.ts`).
- **Key decisions made with Codex:** batching strategy for 25+ concurrent gradings (Codex benchmarked sequential vs. batched and implemented a concurrency pool), and the structured-output schema design for misconceptions.

### GPT-5.6 (runtime)
- **Vision:** transcribes photos of handwritten student work, preserving the student's actual steps (not just the final answer) so feedback can target the reasoning.
- **Socratic feedback:** rubric-conditioned prompting with few-shot examples enforcing "question, don't answer" coaching (`/prompts/feedback.md`).
- **Misconception clustering:** structured outputs (JSON schema) turn 25 free-form gradings into named misconceptions with counts and evidence.
- **Reteach generation:** the brief is conditioned on the actual top misconceptions found, so practice problems attack the specific error, not the general topic.

## Architecture

```
Next.js (App Router) ── /api/grade ──► GPT-5.6 (per-student, concurrency pool)
        │                                   │ structured JSON (rubric scores, feedback, error tags)
        │                                   ▼
        ├─── /api/aggregate ──► GPT-5.6 (misconception clustering, structured outputs)
        ├─── /api/reteach ────► GPT-5.6 (brief + practice problems)
        └─── /api/transcribe ─► GPT-5.6 vision (handwritten photos → steps)
Storage: SQLite (dev) — one file, zero setup for judges
```

## Repo map

```
/app            UI (upload, per-student view, class insights, reteach brief)
/lib            LLM client, schemas, aggregation pipeline, concurrency pool
/prompts        All prompts as versioned markdown (feedback, clustering, reteach, vision)
/sample-data    Ready-made class: assignment, rubric, 25 submissions, 3 handwriting photos
/scripts        Dataset generator (see sample-data/README)
```

## Limitations & what's next
- Feedback quality is tuned for math/short-answer science; long-form essays are v2.
- No student accounts yet — teacher-facing by design for the hackathon scope.
- Next: LMS import (Google Classroom), longitudinal misconception tracking per student.

## License
MIT
