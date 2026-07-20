# Technical Design Doc — "Helm" (working name: The Founder's Morning Brief that Acts)
**Audience: OpenAI Codex.** Paste section by section into Codex as source of truth. Build in milestone order; each must run end-to-end before the next.
**Dual-hackathon constraint:** this codebase serves the OpenAI Build Week submission (July 21, Codex + GPT-5.6) AND the Build with Gemini XPRIZE (Aug 17, Gemini + Google Cloud, real revenue). Every architectural decision below respects both.

---

## 0. Product in one paragraph

A solo founder connects Gmail (read + draft), Stripe (read-only), pastes/forwards meeting notes, and defines a watchlist (competitors + ICP keywords + subreddits). Every morning an agent pipeline ingests all signals, cross-references them against a persistent memory of every contact and interaction, and produces ONE brief: the top 3–5 things that matter today, each as an **action card with a pre-drafted artifact** (email reply, follow-up, social post draft) executable with one approval click. Not a dashboard — a decision-and-action loop. The differentiator vs. RedditGrow/Eodly/PostHog: cross-silo synthesis ("this Stripe failed payment + this quiet email thread are the same customer — here's the save-the-account draft").

## 1. Non-negotiable architectural decisions

### 1.1 Provider-agnostic LLM layer (THE key decision)
```ts
// /lib/llm/provider.ts
interface LLMProvider {
  complete(req: { system: string; messages: Msg[]; schema?: ZodSchema; tools?: Tool[] }): Promise<LLMResult>;
  searchWeb(query: string): Promise<SearchResult[]>;   // provider-native web tool
}
// adapters: /lib/llm/openai.ts (gpt-5.6)  /lib/llm/gemini.ts (gemini via Vertex AI)
// selected by env: LLM_PROVIDER=openai|gemini
```
- All prompts in `/prompts/*.md`, provider-neutral wording, structured outputs via Zod schemas validated identically for both adapters (Gemini structured output quirks handled inside the adapter, never in business logic).
- OpenAI hackathon build + demo runs `openai`. XPRIZE production runs `gemini` on Google Cloud. Golden tests (§8) must pass on BOTH providers — run the suite twice in CI.

### 1.2 Deployment duality
- Containerized from day 1 (single Dockerfile). OpenAI demo: Vercel or Cloud Run — either fine. XPRIZE: **Cloud Run + Cloud Scheduler + Cloud SQL (Postgres)** — satisfies "uses at least one Google Cloud product" several times over.
- Dev/demo DB: Postgres via Supabase (also gives auth). Do NOT use SQLite — real multi-tenant customers arrive in week 3.

### 1.3 Agent execution logging (XPRIZE evidence, also great for demo)
Every pipeline run writes `agent_runs(id, user_id, trigger, steps_json, tokens, cost_usd, actions_proposed, actions_executed, started_at, finished_at)`. Steps_json = ordered log of every LLM call + tool call with truncated inputs/outputs. Surface as an "Agent activity" page. This is literally a submission requirement for XPRIZE ("agent execution logs... AI running in production continuously") and a credibility booster for OpenAI judges.

## 2. Scope: what's IN and OUT (say no all week)

**IN (v1):** Gmail read/draft/send-with-approval · Stripe read-only (customers, subscriptions, invoices, failed payments) · meeting notes via paste + email-forward-to-ingest address · watchlist monitoring via LLM web search (competitors, ICP keyword mentions on Reddit/HN — search-based, NO Reddit API) · contact memory + timeline · morning brief generation · action cards with approve/edit/dismiss · sandbox mode with seeded fictional startup (see dataset doc) · Stripe billing for Helm itself (week 3, needed for XPRIZE revenue) · agent activity log.

**OUT (resist):** customer support tooling, product analytics (PostHog owns this), live social APIs, note-taker integrations (Fathom/Granola CSV import at most), calendar write, CRM pipelines/kanban, teams/multi-seat, mobile app, LinkedIn automation (ToS risk).

## 3. Data model (Postgres)

```sql
users(id, email, company_name, icp_description, product_description, tz, created_at)
connections(id, user_id, kind /* gmail|stripe */, oauth_json_encrypted, status, last_sync_at)
contacts(id, user_id, email, name, company, kind /* lead|customer|investor|other */, stripe_customer_id, created_at)
interactions(id, user_id, contact_id, kind /* email_in|email_out|call_notes|stripe_event */,
             occurred_at, source_ref, raw_text, summary, sentiment, created_at)
watch_items(id, user_id, kind /* competitor|icp_keyword|community */, value, notes)
signals(id, user_id, run_id, kind /* quiet_lead|failed_payment|competitor_move|icp_thread|unanswered|renewal_risk|positive */,
        contact_id?, watch_item_id?, evidence_json, urgency 1-5, created_at)
briefs(id, user_id, run_id, date, headline, items_json, created_at)
actions(id, user_id, brief_id, signal_id, kind /* email_reply|email_followup|social_post_draft|task */,
        draft_subject, draft_body, status /* proposed|approved|edited|executed|dismissed */,
        executed_at, execution_ref)
agent_runs(...)   -- §1.3
```
Encrypt OAuth tokens at rest (libsodium sealed box, key in env/Secret Manager). GDPR basics from day 1 — you're in Europe and so are your first customers: data export endpoint, delete-account cascades, no email bodies in logs.

## 4. Pipelines (the heart)

### 4.1 Ingest (per source, incremental)
- **Gmail:** history API delta sync; store thread-level; classify each new message → contact linking (create contact if new), `interactions` row with LLM summary + sentiment. Label heuristics: skip newsletters/notifications (LLM classifier with cheap model tier).
- **Stripe:** webhook + nightly reconcile → `interactions` rows for created/canceled subscriptions, failed payments, disputes; link via customer email to contacts.
- **Notes:** paste box or forward to `ingest+<userhash>@...` → LLM extracts: attendees→contacts, commitments made (theirs and yours), objections, next steps → `interactions` (kind=call_notes) with structured extraction stored in evidence.
- **Watchlist:** for each watch_item, `searchWeb()` with recency filter → LLM relevance+novelty scoring against last 14 days of seen items (dedupe by URL + semantic similarity) → candidate signals.

### 4.2 Signal detection (deterministic rules + LLM, in that order)
Rules first (cheap, testable): lead with no reply from us >48h → `unanswered`; hot contact silent >7d after positive call → `quiet_lead`; Stripe failed payment → `failed_payment`; renewal <14d with low interaction → `renewal_risk`. Then one LLM pass over rule-based signals + watchlist candidates + last-24h interactions to (a) merge duplicates, (b) CROSS-REFERENCE (same contact appearing in two silos = urgency boost + merged narrative), (c) score urgency 1–5 with justification.

### 4.3 Brief composition
One LLM call: top signals + user's product/ICP context + yesterday's brief (for continuity, "still waiting on…") → schema:
```ts
{ headline: string,             // one sentence, the single most important thing today
  items: { signal_id, title, why_now: string, narrative: string,
           suggested_action: { kind, draft_subject?, draft_body, tone_note } }[]  // 3-5 max, ranked
  , skipped_count: number }     // "12 other signals below the line" — honesty builds trust
```
**Draft quality bar (test this):** email drafts must quote something concrete from the actual interaction history ("you mentioned the Q3 pilot on our call") — generic drafts are the product's death. Include contact's full timeline in the drafting context.

### 4.4 Execution
Approve → Gmail API send (from user's own address); social drafts → copy button + "mark posted". Every execution updates `actions` + `agent_runs`. Edited-then-approved counts as executed with `edited=true` (track this — edit rate is your quality KPI).

### 4.5 Scheduling
Nightly cron (Cloud Scheduler / Vercel cron) per user at 6:00 local → full pipeline → brief ready + email notification "Your brief is ready" (with headline only, pull them into the app). Manual "Run now" button for demo and impatient users.

## 5. Memory & ask ("what did Marta say?")

Chat box scoped to a contact or global. Retrieval: pgvector embeddings over `interactions.summary` + raw_text chunks, top-k → LLM answer with interaction citations (date + source). This is 1 day of work with pgvector and it's the retention hook — build it, keep it simple.

## 6. UI (five screens)

1. **Onboarding wizard:** product description, ICP, connect Gmail (OAuth), connect Stripe (restricted key paste), add 3 competitors + 3 keywords, import notes. **"Try sandbox instead"** button — loads the fictional startup (dataset doc) with zero connections. Judges take this path.
2. **Today (home):** the brief. Headline, ranked action cards with draft preview, Approve / Edit / Dismiss inline. Yesterday's executed actions collapsed at bottom ("3 sent, 1 reply received ✓"). THE screen — disproportionate polish.
3. **Contacts:** list + timeline detail view (every email/call/stripe event chronologically) + scoped ask-box.
4. **Watchlist:** items + recent findings feed.
5. **Agent activity:** runs, steps, cost. (Also: Settings with billing via Stripe Checkout, week 3.)

Design: calm, dense-but-breathable, keyboard-friendly (j/k through cards, a=approve). Founder tools win on speed-feel.

## 7. Build order

- **M1 (Day 1):** Schemas + LLM provider layer with BOTH adapters stubbed (openai real, gemini compilable) + brief composition working over hardcoded seeded interactions → ugly Today page. End-to-end or bust.
- **M2 (Day 2):** Sandbox dataset loader + signal detection rules + cross-referencing pass. Golden test green (§8).
- **M3 (Day 3):** Gmail OAuth + delta sync + draft/send with approval. (Riskiest external dependency — if Google OAuth verification friction blocks demo, sandbox mode is the demo; real Gmail shown on YOUR account in video.)
- **M4 (Day 4):** Stripe ingest + notes ingest + watchlist web-search pipeline + Contacts/timeline + ask-box (pgvector).
- **M5 (Day 5):** Polish Today screen, agent activity page, deploy, sandbox one-click for judges.
- **M6 (Day 6):** Video. Freeze. README.
- **M7 (Day 7):** Submit OpenAI by noon PT.
- **Week 2 (Jul 22–28):** Gemini adapter parity + Cloud Run deploy + Stripe billing + waitlist→onboarding + Product Hunt/r/SaaS launch (GTM plan in README appendix).
- **Weeks 3–4:** customer feedback loop, testimonials + revenue evidence collection for XPRIZE narrative.

## 8. Testing

- Golden test (both providers): run full pipeline on sandbox dataset → assert the 5 planted storylines each produce their expected signal kind, the cross-silo storyline (failed payment + quiet thread, same contact) is MERGED into one item, and it ranks #1.
- Draft-specificity test: every generated email draft contains ≥1 verbatim-checkable fact from that contact's interaction history (assert via string/embedding match against timeline).
- Unit: signal rules, Gmail classifier, dedupe.

## 9. Security/trust checklist (founders are handing you their inbox)
Restricted-scope OAuth (gmail.readonly + gmail.compose, NOT full), Stripe restricted keys only, encrypt tokens, "we never auto-send without approval" as a product guarantee stated in UI, delete-everything button, privacy page before launch.

## 10. Codex working agreement
One primary Codex session for core pipeline work (clean /feedback session ID). After each milestone: Codex writes/updates tests, runs them in-session. Maintain `DECISIONS.md` (one line per key decision Codex helped make) → feeds README's judging section.
