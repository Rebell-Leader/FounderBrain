# Demo Video Script — "Reteach Tomorrow"
**Target length: 2:45 (hard ceiling 3:00). One take per section, edit together. Screen recording + voiceover; talking head optional for open/close only.**

> Judging requirement reminder: audio MUST explicitly cover (a) how you used **Codex** to build it and (b) how **GPT-5.6** powers it. Both by name, out loud.

---

## 0:00–0:20 — The Problem (hook)

**Visual:** Photo/stock shot of a stack of paper homework, then a clock showing Sunday evening. Cut to a spreadsheet of 150 rows.

**VO:**
> "It's Sunday night. Ms. Rivera has 148 algebra worksheets to grade before Monday. She'll spend five hours writing the same three comments over and over — and she still won't know *which* mistake half the class is making. Teachers don't have a grading problem. They have a *visibility* problem."

**On-screen text:** `Teachers spend 5+ hrs/week grading. Class-wide patterns stay invisible.`

---

## 0:20–0:35 — The Promise

**Visual:** App landing screen, clean single sentence tagline.

**VO:**
> "Reteach Tomorrow gives every student a tutor, and gives every teacher back their Sunday. Built in seven days with OpenAI Codex, powered at runtime by GPT-5.6."

*(Note: both names dropped early, insurance in case a judge stops watching.)*

---

## 0:35–1:40 — Live Demo (the core; rehearse until it's smooth)

**Beat 1 (0:35–0:55) — Setup + bulk upload.**
**Visual:** Teacher pastes an assignment ("Solving two-step equations") and a 4-point rubric. Then drags in a folder of 25 submissions — including **3 photos of actual handwritten work**.

**VO:**
> "A teacher pastes the assignment and rubric, then uploads the whole class at once — typed answers, CSV exports, even photos of handwritten work. GPT-5.6's vision reads the handwriting directly."

**Beat 2 (0:55–1:15) — Per-student feedback.**
**Visual:** Click one student. Show Socratic feedback: it does NOT give the answer, it asks "What happens to the −7 when you move it across the equals sign?"

**VO:**
> "Every student gets instant, rubric-aligned feedback in seconds. Notice it never hands over the answer — GPT-5.6 is prompted to coach Socratically, pointing at the exact step where the reasoning broke."

**Beat 3 (1:15–1:40) — THE WOW MOMENT: class heatmap + reteach brief.**
**Visual:** Zoom out to the class dashboard. A misconception heatmap lights up: "14 of 25 students flipped the sign when isolating x." Click "Generate reteach brief" → a one-page mini-lesson + 3 targeted practice problems appears.

**VO:**
> "And here's what no gradebook can do: GPT-5.6 aggregates every submission and surfaces the *class-wide* misconceptions. Fourteen students made the same sign error. One click, and the teacher has tomorrow's warm-up: a mini-lesson and three fresh practice problems targeting exactly that mistake. Five hours of grading became ninety seconds — and the teacher walks in Monday knowing precisely what to reteach."

---

## 1:40–2:30 — How Codex + GPT-5.6 Built and Power It (required section)

**Visual:** Screen recording of a REAL Codex session (scroll through actual turns). Then a simple architecture slide.

**VO:**
> "We built this almost entirely inside Codex. Codex scaffolded the app, then iterated the misconception-aggregation pipeline with us across more than a dozen turns — we described the clustering behavior we wanted, Codex wrote it, ran the tests, and fixed its own failures. When handwriting extraction returned inconsistent JSON, Codex diagnosed the schema drift and added validation with retries. Our feedback session ID is in the submission."
>
> "At runtime, GPT-5.6 does three jobs: vision transcription of handwritten work, rubric-based Socratic feedback per student, and cross-class misconception clustering with structured outputs. The reteach brief is GPT-5.6 generating a lesson conditioned on the actual error patterns it just found."

**On-screen text (while VO runs):**
- `Codex: scaffolding, aggregation pipeline (14+ turns), test-driven fixes`
- `GPT-5.6: vision OCR • Socratic feedback • misconception clustering • reteach generation`

---

## 2:30–2:50 — Impact + Close

**Visual:** Back to the heatmap. End card with repo URL + live demo URL.

**VO:**
> "One teacher, 150 students, every misconception visible by Monday morning. Try it yourself — the live demo and sample class are one click away in the repo. Reteach Tomorrow: every student gets a tutor, every teacher gets their Sunday back."

**End card:** Project name, track (Education), live URL, repo URL.

---

## Production checklist
- [ ] Record demo at 1920×1080, hide bookmarks bar, use a clean browser profile
- [ ] Pre-load the sample class so uploads are instant on camera (no waiting on API calls — record a real run, cut dead air)
- [ ] Handwritten photos: use genuinely messy handwriting (this is the credibility moment; too-neat handwriting looks faked)
- [ ] Say "Codex" and "GPT-5.6" out loud at least twice each
- [ ] Watch final cut on a phone, muted, to verify on-screen text carries the story alone
- [ ] Upload as PUBLIC YouTube video; verify in incognito before submitting
