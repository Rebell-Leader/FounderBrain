# Demo Video Script — "Helm" (OpenAI Build Week, Work & Productivity track)
**Target 2:45, hard ceiling 3:00. Requirement: audio must explicitly cover how Codex was used AND how GPT-5.6 powers it.**

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
> "This is Helm — a morning brief that acts. I built it in seven days with OpenAI Codex, and it runs on GPT-5.6. Every night, agents read my email, my Stripe account, my call notes, and the open web — and every morning I get the three to five moves that matter, pre-drafted and ready to send."

---

## 0:40–1:50 — Live Demo (sandbox startup "LingoLoop")

**Beat 1 (0:40–1:05) — THE HEADLINER card.**
**Visual:** Today screen. Card #1: "Datawise is a churn risk on two fronts." Expand it: shows the Stripe failed payment AND the quiet email thread AND a quote from a call note three weeks ago.

**VO:**
> "Look at the top card. GPT-5.6 connected three silos: Marta's card failed in Stripe two days ago, her last email hinted they might consolidate tools, and — from a call three weeks ago — she'd mentioned procurement pressure. No single tool sees this. Helm's cross-referencing pass merged them into one story and ranked it number one."

**Beat 2 (1:05–1:25) — Act in one click.**
**Visual:** The pre-drafted email inside the card: it references the procurement comment, gracefully handles the card issue, answers the consolidation question. Click **Edit** (change one word), click **Approve** → "Sent via Gmail ✓".

**VO:**
> "And here's the difference from a dashboard: the action is already drafted — quoting what she actually said on our call. I tweak one line, hit approve, and it's sent from my own Gmail. Nothing ever auto-sends without me."

**Beat 3 (1:25–1:50) — Breadth in 25 seconds.**
**Visual:** Fast scroll through remaining cards: quiet lead follow-up ("your 40-seat pilot"), competitor free-tier launch with a positioning post draft, an r/SaaS thread to answer, an unanswered inbound. Flash the "…and 6 lower-priority signals" line. Then 3 seconds on the Contacts timeline + ask-box: type "what did Marta say about procurement?" → cited answer.

**VO:**
> "The rest of the brief: a hot lead gone quiet — the follow-up already references his forty-seat pilot. A competitor launched a free tier overnight — here's my positioning post. A Reddit thread full of my exact customers. And Helm remembers everything: ask it what any customer said on any call, and it answers with the source."

---

## 1:50–2:35 — Codex + GPT-5.6 (required, specific)

**Visual:** Real Codex session scrolling; then the Agent Activity page showing a live pipeline run with steps and cost.

**VO:**
> "How it was built: almost entirely inside Codex. Codex scaffolded the app, then built the signal-detection pipeline with me across dozens of turns — deterministic rules first, then a GPT-5.6 cross-referencing pass. When our golden test showed the Marta storyline splitting into two separate cards instead of merging, Codex diagnosed it, redesigned the merge step, and re-ran the tests until they passed. Our feedback session ID is in the submission."
>
> "At runtime, GPT-5.6 does the heavy lifting: classifying and summarizing every email, extracting commitments from messy call notes, searching the web for competitor and customer signals, cross-referencing all of it into ranked stories, and drafting actions grounded in each contact's real history — with structured outputs end to end. Every run is logged: you can watch the agent think, step by step, on the activity page."

**On-screen text:** `Codex: pipeline built test-first, dozens of turns` · `GPT-5.6: classify → extract → search → cross-reference → draft`

---

## 2:35–2:55 — Close

**Visual:** Today screen once more. End card: live URL (sandbox, no signup), repo, "launching on Product Hunt July 22."

**VO:**
> "Judges: the live sandbox is one click — no accounts, no OAuth, a full fictional startup pre-loaded. I built Helm because I needed it; it's launching publicly next week with real founders and real billing. Helm: five silos in, one decisive morning out."

---

## Production checklist
- [ ] Record sandbox pre-warmed; "Run now" once off-camera first so the on-camera run is brisk
- [ ] Say "Codex" and "GPT-5.6" aloud ≥2× each (script currently: 3 and 4)
- [ ] The Marta card expansion is the money shot — rehearse the cursor path
- [ ] Show real Gmail send on YOUR OWN account only (never a real customer's data on camera)
- [ ] Phone-muted test: on-screen text must carry the story
- [ ] Public YouTube, verify in incognito, link in submission
