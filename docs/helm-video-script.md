# Demo Video Script — "Helm" (OpenAI Build Week, Work & Productivity track)
**Target 2:45, hard ceiling 3:00. Use this only after the filmed flow exists;
audio must explicitly cover how Codex was used and how GPT-5.6 powers it.**

---

## 0:00–0:25 — The Problem (personal, real)

**Visual:** Rapid-fire screen montage: Gmail with 40 unread, a Stripe failed-payment email, a Notion page of call notes, 6 Reddit tabs, a competitor's launch tweet. Then a face-to-camera beat (optional) or a single line on black.

**VO:**
> "I'm a solo founder in Europe. Every morning I juggle five silos: cold outreach, customer emails, call notes I half-remember, Stripe alerts, and whatever my competitors shipped overnight. Last month I lost a customer because her failed payment sat in one tab while her 'we're consolidating tools' email sat in another — and I never connected them. Founders don't need another dashboard. We need to know **what matters today, and to act on it in one click**."

**On-screen text:** `5 silos. 1 founder. The signals never meet.`

---

## 0:25–0:40 — The Promise

**Visual:** Helm's Today screen, headline visible.

**VO:**
> "This is Helm — an evidence-backed founder morning brief. I built the app and its guardrails with OpenAI Codex, and GPT-5.6 powers an optional structured copy refresh behind those gates. This public demo uses a fictional, deterministic corpus shaped like email, Stripe, and call notes, so anyone can inspect the whole flow without connecting an account."

---

## 0:40–1:50 — Live Demo (sandbox startup "LingoLoop")

**Beat 1 (0:40–1:05) — THE HEADLINER card.**
**Visual:** Today screen. Card #1: "Datawise is a churn risk on two fronts." Expand it: shows the Stripe failed payment AND the quiet email thread AND a quote from a call note three weeks ago.

**VO:**
> "Look at the top card. Marta's card failed in Stripe two days ago, her last email hinted that Datawise might consolidate tools, and a call note records procurement pressure. Helm's deterministic merge gate verifies that all three signals belong to the same customer before combining them, then shows every source behind the rank-one story."

**Beat 2 (1:05–1:25) — Act in one click.**
**Visual:** The pre-drafted email inside the card: it references the procurement comment, gracefully handles the card issue, answers the consolidation question. Click **Edit** (change one word), click **Approve** → "Simulated approval ✓".

**VO:**
> "And here's the difference from a dashboard: the action is already drafted — quoting what she actually said on our call. I tweak one line and approve it. This sandbox simulates that action; the product's safety boundary is that nothing ever auto-sends."

**Beat 3 (1:25–1:50) — Breadth in 25 seconds.**
**Visual:** Fast scroll through remaining cards: quiet lead follow-up ("your 40-seat pilot"), competitor free-tier launch with a positioning post draft, an r/SaaS thread to answer, an unanswered inbound. Flash the "…and 6 lower-priority signals" line.

**VO:**
> "The rest of the brief: a hot lead gone quiet — the follow-up already references his forty-seat pilot. A competitor launched a free tier overnight — here's my positioning post. A Reddit thread full of my exact customers. The point is prioritization with evidence, not another dashboard."

---

## 1:50–2:35 — Codex + GPT-5.6 (required, specific)

**Visual:** Real Codex session scrolling; then the Agent Activity page showing the completed fixture trace, followed by `src/lib/llm/openai.ts`.

**VO:**
> "How it was built: I used Codex in a test-first loop to build the Next.js app, the fixture pipeline, the deterministic gates, and the golden tests. The key decision was to make the judge route deterministic: it keeps the evidence, merge legality, ranking, drafts, recipients, and approval boundary reliable and inspectable. Our feedback session ID is in the submission."
>
> "GPT-5.6 is integrated through the OpenAI Responses API with structured Zod output. In the optional private refresh, it can improve only the headline and narrative copy from the supplied evidence. Deterministic number and promise gates validate that copy and fall back safely if it fails. I leave that endpoint disabled for judges, so this public flow has no credentials, model cost, or network failure mode."

**On-screen text:** `Codex: app + fixtures + gates + golden tests` · `GPT-5.6: structured, copy-only refresh behind deterministic gates`

---

## 2:35–2:55 — Close

**Visual:** Today screen once more. End card: live URL (sandbox, no signup) and repo.

**VO:**
> "Judges: the live sandbox is one click — no accounts, no OAuth, a full fictional startup pre-loaded. Helm: five silos in, one decisive morning out."

---

## Production checklist
- [ ] Record the deployed sandbox, not localhost; it is instantly precomputed
- [ ] Say "Codex" and "GPT-5.6" aloud ≥2× each (script currently: 2 and 2)
- [ ] The Marta card expansion is the money shot — rehearse the cursor path
- [ ] Do not show a Gmail send unless it was actually implemented and tested on your own account; the shipped sandbox uses simulated approval
- [ ] Phone-muted test: on-screen text must carry the story
- [ ] Public YouTube, verify in incognito, link in submission
