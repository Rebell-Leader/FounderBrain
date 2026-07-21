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
- The hackathon sandbox runs `openai`. Keep the Gemini adapter as a compiling
  boundary only; run provider-parity golden tests after submission, when the
  Gemini/Google Cloud path is actually being implemented.

### 1.2 Deployment duality
- Containerized from day 1 (single Dockerfile). OpenAI demo: Vercel or Cloud Run — either fine. XPRIZE: **Cloud Run + Cloud Scheduler + Cloud SQL (Postgres)** — satisfies "uses at least one Google Cloud product" several times over.
- Dev/demo DB: Postgres via Supabase (also gives auth). Do NOT use SQLite — real multi-tenant customers arrive in week 3.

### 1.3 Agent execution logging (XPRIZE evidence, also great for demo)
Every pipeline run writes `agent_runs(id, user_id, trigger, steps_json, tokens, cost_usd, actions_proposed, actions_executed, started_at, finished_at)`. Steps_json = ordered log of every LLM call + tool call with truncated inputs/outputs. Surface as an "Agent activity" page. This is literally a submission requirement for XPRIZE ("agent execution logs... AI running in production continuously") and a credibility booster for OpenAI judges.

## 2. Scope: ship the proof before the platform

**Hackathon MVP (ship now):** an anonymous, precomputed LingoLoop sandbox;
deterministic signals over frozen Gmail/Stripe/notes/watchlist fixtures;
cross-silo merge and ranking; evidence panels; grounded drafts; client-side
simulated approval; Agent Activity; and a network-free golden suite. The
sandbox is read through a server-only DTO endpoint and never invokes a real
integration on page load.

**After the golden suite is stable:** Gmail read/draft/send-with-approval,
Stripe ingestion, notes ingestion, live watchlist search, contact memory and
ask-box, billing, cron, and Gemini runtime parity.

**Out:** customer support tooling, product analytics (PostHog owns this), live
social APIs, note-taker integrations (Fathom/Granola CSV import at most),
calendar write, CRM pipelines/kanban, teams/multi-seat, mobile app, and
LinkedIn automation (ToS risk).

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
In the sandbox, Approve is client-side simulated state and never sends or
persists to the shared fixture. In the later authenticated product, approval
unlocks a Gmail API send from the founder's own address; social drafts use copy
and "mark posted". Every real execution updates `actions` + `agent_runs`.

### 4.5 Scheduling
Post-MVP: a nightly cron (Cloud Scheduler / Vercel cron) per user at 6:00 local
→ full pipeline → brief-ready notification. A demo "Run now" button must be
explicitly opt-in and use the same pipeline code path; it is not needed for the
precomputed judge flow.

## 5. Memory & ask ("what did Marta say?")

Chat box scoped to a contact or global. Retrieval: pgvector embeddings over `interactions.summary` + raw_text chunks, top-k → LLM answer with interaction citations (date + source). This is 1 day of work with pgvector and it's the retention hook — build it, keep it simple.

## 6. UI

**Hackathon MVP:** (1) sandbox Today with ranked cards, evidence, draft preview,
and simulated approval; (2) Agent Activity with rule/model/gate steps and cost;
and (3) a minimal sandbox entry page. Today gets the polish.

**Later:** onboarding with real integrations, contacts with timeline/ask-box,
watchlist, and billing settings.

Design: calm, dense-but-breathable, keyboard-friendly (j/k through cards, a=approve). Founder tools win on speed-feel.

## 7. Build order

- **M0:** Scaffold Next.js/Supabase/Vitest; make the checked-in migration reset;
  compile `gates.ts` and its unit suite.
- **M1:** Complete frozen LingoLoop fixture data; seed the sandbox Auth user;
  implement deterministic rules and cross-reference gates; make the golden test
  pass with no network credentials.
- **M2:** Add a precomputed brief and agent-run seed; render the anonymous
  server-side sandbox Today and Agent Activity views; simulated approval only.
- **M3:** Deploy, rehearse the public path, film only the flow that exists, and
  submit.
- **After submission:** integrate Gmail/Stripe/notes/watchlist, then ask-box,
  billing, scheduling, and Gemini/Cloud Run parity.

## 8. Testing

- Network-free golden test: run the deterministic sandbox pipeline → assert the
  5 planted storylines each produce their expected signal kind, the cross-silo
  storyline is merged into one item, and it ranks #1.
- Opt-in OpenAI evaluation: rerun the same fixtures with GPT-5.6 only after the
  deterministic test passes and record cost/latency. Gemini parity is a
  post-submission acceptance test.
- Draft-specificity test: every generated email draft contains ≥1 verbatim-checkable fact from that contact's interaction history (assert via string/embedding match against timeline).
- Unit: signal rules, Gmail classifier, dedupe.

## 9. Security/trust checklist (founders are handing you their inbox)
Restricted-scope OAuth (gmail.readonly + gmail.compose, NOT full), Stripe restricted keys only, encrypt tokens, "we never auto-send without approval" as a product guarantee stated in UI, delete-everything button, privacy page before launch.

## 10. Codex working agreement
One primary Codex session for core pipeline work (clean /feedback session ID). After each milestone: Codex writes/updates tests, runs them in-session. Maintain `DECISIONS.md` (one line per key decision Codex helped make) → feeds README's judging section.
