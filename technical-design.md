# Technical Design Doc — Reteach Tomorrow
**Audience: OpenAI Codex.** This doc is written to be pasted (in sections) into Codex sessions as the source of truth. Build in the order listed; each milestone must be demoable before starting the next.

---

## 0. Product in one paragraph

Teacher creates an assignment (prompt + rubric), uploads a class of student submissions (pasted text, CSV, or photos of handwritten work). System produces: (1) per-student rubric scores + Socratic feedback, (2) a class-level misconception analysis with counts and evidence, (3) a generated "reteach brief" (mini-lesson + 3 practice problems) targeting the top misconception. Optimize for a flawless demo with 25 sample submissions and for judges testing via a hosted URL with one-click sample data.

## 1. Stack (do not deviate without reason)

- **Next.js 14+ (App Router, TypeScript)** — single deployable, API routes colocated
- **SQLite via better-sqlite3** (dev + demo) — zero-setup for judges; schema simple enough to swap later
- **OpenAI SDK**, model `gpt-5.6` for all calls (chat + vision + structured outputs)
- **Zod** for every LLM response schema; **Tailwind** for UI
- Deploy: Vercel (or Fly if SQLite write persistence is an issue — decide at Milestone 4; if Vercel, use libSQL/Turso free tier instead of local SQLite)

## 2. Data model

```sql
assignments(id, title, prompt_text, rubric_json, subject, grade_level, created_at)
submissions(id, assignment_id, student_name, raw_input_type,  -- 'text'|'csv'|'image'
            raw_text, image_path, transcribed_text, created_at)
gradings(id, submission_id, rubric_scores_json, feedback_md,
         error_tags_json,      -- ["sign_flip_isolation", ...] free-form at this stage
         confidence, model, created_at)
class_analyses(id, assignment_id, misconceptions_json, generated_at)
reteach_briefs(id, class_analysis_id, misconception_id, brief_md, problems_json, created_at)
```

`rubric_json`: `[{criterion: string, max_points: number, description: string}]`

## 3. LLM contracts (the heart of the system)

All prompts live in `/prompts/*.md` and are imported at build time. Never inline prompts in code. Every call uses structured outputs (JSON schema) validated with Zod; on validation failure, retry once with the validation error appended ("repair retry"), then fail gracefully with a per-submission error state that does NOT block the rest of the class.

### 3.1 `transcribe` (vision)
- **In:** image of handwritten work + assignment prompt for context
- **Out schema:** `{ steps: string[], final_answer: string, legibility: 'clear'|'partial'|'poor', illegible_fragments: string[] }`
- Must preserve the student's *actual work line by line*, including mistakes. Explicitly instruct: "Transcribe what is written, even if mathematically wrong. Do not correct."

### 3.2 `grade` (per student)
- **In:** assignment prompt, rubric, student work (text or transcription)
- **Out schema:**
```ts
{
  rubric_scores: { criterion: string, points: number, justification: string }[],
  first_broken_step: string | null,     // quote of where reasoning first fails
  error_tags: string[],                  // short snake_case labels, 1-3 tags
  feedback_md: string,                   // Socratic, 60-120 words, NEVER contains the answer
  confidence: 'high'|'medium'|'low'
}
```
- **Socratic constraint (critical, test this):** feedback must contain at least one question and must not state the correct final answer or the corrected step. Include 3 few-shot examples in the prompt demonstrating good vs. bad feedback. Add a cheap post-check: if `feedback_md` contains the known correct answer string, regenerate once.
- **Concurrency:** grade the class with a pool of 5 concurrent requests. Per-submission failures render as a retry chip in UI, never a blank screen.

### 3.3 `aggregate` (class-level clustering)
- **In:** all gradings' `error_tags` + `first_broken_step` quotes + rubric
- **Out schema:**
```ts
{
  misconceptions: {
    id: string,
    label: string,               // teacher-readable, e.g. "Sign flips when isolating the variable"
    explanation: string,          // why students make this error
    student_names: string[],
    evidence_quotes: string[],    // 2-3 verbatim quotes from student work
    severity: 'high'|'medium'|'low'
  }[]
}
```
- **Known failure mode (handle explicitly):** near-duplicate labels fragmenting counts ("sign error" vs "flipped sign"). Instruct the model to merge synonymous misconceptions and cap output at 5 misconceptions, ranked by student count.

### 3.4 `reteach`
- **In:** one misconception object + assignment context + grade level
- **Out schema:** `{ mini_lesson_md: string /* ≤250 words, warm-up format */, practice_problems: { problem: string, answer: string, why_it_targets: string }[] /* exactly 3 */ }`
- Problems must be NEW (not from the assignment) and each must specifically trigger the misconception if the student still holds it.

## 4. API routes

```
POST /api/assignments               create assignment
POST /api/assignments/:id/submissions   accepts text, CSV (student_name,answer), or images (multipart)
POST /api/assignments/:id/grade     grades all ungraded submissions (pool of 5); SSE progress stream
POST /api/assignments/:id/aggregate runs clustering; caches in class_analyses
POST /api/reteach                   { misconception_id } → brief
POST /api/sample                    loads /sample-data into DB (the judge one-click button)
```

## 5. UI (four screens, no more)

1. **New assignment:** title, prompt, rubric editor (add-criterion rows), "Load sample class" button prominent.
2. **Class roster:** submission list with status chips (pending/graded/error), bulk upload dropzone (drag CSV or images), "Grade class" button with live progress bar (SSE).
3. **Student detail:** left = student work (photo shown alongside transcription if image), right = rubric scores + Socratic feedback. This is a video-demo screen — make it beautiful.
4. **Class insights:** misconception list as horizontal bar heatmap (count of students, color by severity), click to expand evidence quotes + affected students, "Generate reteach brief" button → rendered brief with print/copy button. **This is THE screen. Spend disproportionate polish here.**

Design notes: clean, calm, teacher-professional. One accent color. Real loading states everywhere (judges on slow networks). Empty states with guidance.

## 6. Build order (milestones — each must run end-to-end before the next)

- **M1 (Day 1):** Schema + `grade` contract + hardcoded 5 submissions → per-student feedback rendering. CLI or ugly page is fine.
- **M2 (Day 2):** Bulk ingest (paste/CSV/images), `transcribe` pipeline, concurrency pool, SSE progress.
- **M3 (Day 3):** `aggregate` + `reteach` + Class insights screen.
- **M4 (Day 4):** Polish pass, deploy, `/api/sample` one-click loader.
- **M5 (Day 5):** Sample dataset finalization (see dataset doc), README, prompt tuning against the dataset's known misconceptions (the heatmap MUST find the 3 planted misconceptions reliably — this is your acceptance test).
- **M6 (Day 6):** Freeze features. Film video. Fix only demo-blocking bugs.
- **M7 (Day 7):** Buffer + submit by noon PT.

## 7. Testing (minimal but real)

- Unit: Zod schemas, CSV parser, aggregation merge logic.
- **Golden test:** run the full pipeline on `/sample-data`; assert the top misconception cluster contains ≥10 of the 12 planted sign-flip students. Run this after every prompt change.
- Socratic guard test: assert no `feedback_md` in the sample run contains the correct final answers.

## 8. Explicit non-goals (say no to these all week)

Student logins, LMS integration, essay grading, multi-assignment analytics, mobile app, auth (a single shared demo password gate is enough), payments, i18n.

## 9. Codex working agreement (for the humans)

- Do all core work in ONE primary Codex session where possible → cleaner /feedback session ID story.
- After each milestone, ask Codex to write/update tests and run them in-session.
- Keep a running `DECISIONS.md` — one line per key decision Codex helped make. This becomes README's "heavy lifting" section for judges.
