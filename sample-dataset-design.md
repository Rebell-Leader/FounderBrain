# Sample Dataset Design & Generation Instructions
**Goal:** a demo class so realistic and well-planted that (a) the heatmap reliably finds dramatic, teachable patterns on camera, and (b) judges loading it cold immediately "get it."

---

## 1. The assignment (fixed, do not randomize)

- **Subject/level:** 8th-grade Algebra — *Solving two-step equations*
  - Why this choice: universally recognizable, answers are short (fast to grade on camera), errors are crisply classifiable, and handwriting photos of math are visually convincing.
- **Assignment prompt (4 problems, shown to students):**
  1. `3x + 7 = 22`
  2. `5x − 4 = 21`
  3. `−2x + 9 = 1`
  4. `x/4 − 3 = 2`
  Instructions to student: *"Solve for x. Show every step."*
  (Answers: 5, 5, 4, 20)
- **Rubric (per problem, 4 criteria × keep it simple):**
  1. Correct first move (isolate the variable term) — 2 pts
  2. Correct inverse operations with signs — 2 pts
  3. Arithmetic accuracy — 1 pt
  4. Work shown clearly — 1 pt

## 2. Class composition — 25 students, engineered distribution

Plant exactly **three misconceptions** with dramatic, unequal counts so the heatmap has an obvious headline:

| Group | Count | Misconception (planted) | How it appears in work |
|---|---|---|---|
| A | 6 | **None — fully correct** | Clean solutions, varied but valid step orders |
| B | **12** | **Sign flip when moving a term** (the headline) | e.g., `3x + 7 = 22` → `3x = 22 + 7` → `x = 29/3`. Consistent across their problems 1–3 |
| C | 4 | **Divides before subtracting** (order of operations) | e.g., `3x + 7 = 22` → `x + 7 = 22/3` |
| D | 3 | **Arithmetic slips only** (concept fine) | Correct method, one wrong subtraction, e.g., `22 − 7 = 14` |

Rules that make it feel real (important — judges smell synthetic data):
- Group B students should NOT be identical: vary which problems they get wrong (most miss 1–3, a couple also miss 4), vary notation, and give 2 of them partially correct problem 4.
- Group A includes one student who solves an unconventional but valid way (e.g., divides both sides first correctly) — tests that grading doesn't punish valid alternatives, and is a nice moment if a judge clicks around.
- 2–3 students across groups write terse work (skip a step) → exercises the "work shown" rubric criterion.
- Names: 25 realistic, diverse first names + last initials (e.g., "Maya R.", "Jonas K."). No real people, no famous names.

## 3. Formats (mirror real classroom mess)

- **19 typed submissions** → one CSV: `student_name,answer` where `answer` is the multi-line worked solution (quote/escape newlines properly).
- **3 pasted-text submissions** → plain .txt files (slightly messier formatting, e.g., `x=29/3 ??`).
- **3 handwritten photo submissions** → JPGs. Assign these to: one Group A (correct), one Group B (sign-flip — this is the money shot for the video: handwriting in → appears in the headline cluster), one Group D.
  - **Generation:** hand-write these yourself on lined paper with a pencil/pen, photograph with a phone at a slight angle with normal room lighting. 10 minutes of work, infinitely more convincing than any synthetic handwriting. Include one crossed-out step in one photo.
  - Keep images ≤ 1500px wide (fast upload on camera).

## 4. Generation instructions (give this to Codex / GPT-5.6)

Write a script `scripts/generate-dataset.ts` that produces `/sample-data/` deterministically (seeded), so regeneration after prompt changes is reproducible. But generate the *content* with GPT-5.6 once, then freeze it — hand-review before freezing.

**Prompt for generating the typed submissions (one call, structured output):**

```
You are generating synthetic 8th-grade student work for a demo dataset.
Assignment: [4 problems above]. Produce work for the following 22 students
(19 CSV + 3 txt), following this spec exactly:

[paste the group table + realism rules from sections 2–3]

For each student output: { name, group, per_problem_work: string[4] }.
Requirements:
- Show steps line by line the way a real 8th grader writes them,
  including their errors carried through consistently to a wrong final answer.
- Group B students must make the sign-flip error in a way that is
  visible in their written steps (the flipped sign must appear on paper).
- Vary voice: some write "x = 5 ✓", some skip the check, one writes a
  hesitant note like "not sure about #3".
- Do NOT label or hint at the misconception anywhere in the student work.
Return JSON only.
```

**Hand-review checklist before freezing (do not skip):**
- [ ] Every Group B student's error is actually a sign flip (models sometimes drift into other error types)
- [ ] Wrong final answers are arithmetically consistent with the planted error (judges may check!)
- [ ] No two students' work is copy-paste identical
- [ ] The 6 correct students are genuinely fully correct
- [ ] CSV parses cleanly; newlines escaped

## 5. Expected outputs (this doubles as your acceptance test)

After running the full pipeline on this dataset, the Class Insights screen should show:

1. **"Sign flips when isolating the variable"** — ~12 students, severity high ← the headline
2. **"Divides before isolating the variable term"** — ~4 students
3. **"Arithmetic slips (concept intact)"** — ~3 students

Golden test assertion: top cluster contains ≥10 of the 12 Group B students, and no Group A student appears in any misconception cluster. If prompt changes break this, fix prompts, not data.

The reteach brief for misconception #1 should produce 3 new two-step equations where the trap is specifically a sign flip (e.g., negatives on both sides). Sanity-check the generated answers by hand once.

## 6. Directory layout

```
/sample-data
  assignment.json          # prompt + rubric
  submissions.csv          # 19 typed students
  txt/                     # 3 pasted-text students
  images/                  # 3 handwriting photos (real photos, committed)
  manifest.json            # maps every student → group, for the golden test
  README.md                # one paragraph: what's planted, expected heatmap
```
`manifest.json` never ships to the model — it's test-only ground truth.
