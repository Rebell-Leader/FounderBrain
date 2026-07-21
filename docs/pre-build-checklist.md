# Pre-Build Checklist & Research Findings — Helm
**Do everything in §1 BEFORE Day 1. §2 contains research findings that change the plan — read first.**

---

## 1. Accounts, keys, config (half a day, do it now)

### Deadline-critical
- [ ] **OpenAI Build Week submission deadline: Jul 21, 2026, 5:00 PM PDT.** Preserve a Codex/GPT-5.6 evidence trail and commit history from the Jul 13 submission-period start; the previous Jul 17 credit deadline is obsolete.
- [ ] Install the Devpost Hackathons plugin in ChatGPT; skim Official Rules; confirm the founder co-pilot is eligible for "Work and productivity" and that external launch/commercialization after submission is permitted (it should be — you retain IP — but read it).
- [ ] Read Build with Gemini XPRIZE official rules for: when work may begin, whether a project also submitted elsewhere is eligible, revenue evidence format. Note both in DECISIONS.md.

### Google Cloud (one project now, one later)
- [ ] Create GCP project `helm-dev`. Enable Gmail API. Configure OAuth consent screen: **Publishing status = Testing**, User type = External. Scopes: `gmail.readonly`, `gmail.compose` (or `gmail.send` — decide with §2.1 in mind), `gmail.metadata` NOT needed.
- [ ] Add test users: your own account + a throwaway demo account + 2–3 friendly founders. (See §2.1 — this list IS your early-customer onboarding mechanism.)
- [ ] Create OAuth client (web), note client id/secret. Set redirect URIs for localhost + your future domain.
- [ ] Create a second project `helm-prod` later (Google recommends separate test/prod projects; the unverified-app user cap is per-project and lifetime — don't burn it in dev).
- [ ] Enable Vertex AI API (for the Gemini adapter, week 2).

### Stripe (two hats — remember which key is which)
- [ ] Hat 1, data source: in YOUR startup's Stripe account, create a **restricted key**: read-only on Customers, Subscriptions, Invoices, Charges, Events. This is what Helm ingests. Document the exact permission set in `docs/integrations.md` — it's also your security story.
- [ ] Hat 2, billing for Helm itself: fresh Stripe account (or new account under your entity), test mode now; Checkout + Customer Portal. Week 3 flips to live.
- [ ] Webhook signing secrets for both; note them for .env.

### Infra
- [ ] Supabase project (Postgres + pgvector extension enabled + Auth). Region: EU (Frankfurt) — you're selling EU-founder trust.
- [ ] Vercel account + project placeholder; alternatively Cloud Run from day 1 if you want a single deploy story (fine either way — Dockerfile is the invariant).
- [ ] Domain for the product (needed for OAuth redirect, ingest email address, and PH launch). Buy today; DNS propagation is not a Day-6 activity.
- [ ] Email ingest address: simplest v1 = a dedicated Gmail alias polled by the same sync, or Postmark inbound (30 min setup). Decide now, note in DECISIONS.md.
- [ ] YouTube account for the demo video; verify it can upload >2 min publicly.

### Repo
- [x] Canonical requirements are in `BUILD_READINESS.md`, `helm-technical-design.md`, `guardrails-design.md`, `prompts/`, `supabase/migrations/`, `DECISIONS.md`, and `.env.example`. The archived Reteach material is not part of Helm.
- [ ] First Codex session = the primary session for /feedback ID. Open it with the Day-1 bootstrap prompt (provided) and keep core pipeline work in it.

---

## 2. Research findings that change the plan

### 2.1 Gmail OAuth is the #1 constraint — verified, and it reshapes GTM
Confirmed from Google's docs: Gmail read scopes are **restricted** scopes. The consequences:

- An unverified app requesting restricted scopes is limited to **100 users over the lifetime of the project — the cap cannot be reset**, and users see scary warnings.
- Full verification for restricted scopes requires Google's review **plus a third-party security assessment (CASA)** if you store Gmail data on servers — this takes weeks-to-months and real money. **Not happening within either hackathon window.**
- While Publishing status = **Testing**, apps don't need verification, and you can allowlist up to 100 test users who won't be blocked.

**Plan implications (bake into the design):**
1. **Sandbox-first product:** everyone can use the full product on the sandbox tenant with zero OAuth. Real Gmail connection is a concierge step.
2. **Concierge onboarding for the first ~50 paying customers:** "connect Gmail" = we add your address as a test user (a 1-minute manual step, framed as white-glove founding-member onboarding). This fits the XPRIZE window: 10–50 customers is exactly the target, and the 100-cap is not binding by Aug 17. Track the count in an admin page — the cap is lifetime and unforgiving.
3. **Store minimal Gmail data** (summaries + metadata; raw bodies only where needed for threads awaiting reply) — reduces CASA burden later and is a trust selling point now.
4. **Post-hackathon path:** either start CASA, or swap the Gmail layer for a pre-verified aggregator (e.g., Nylas-class providers that already passed assessment). The ingest interface in the design doc is already abstracted per-source — keep it that way.
5. **Stripe-only mode must be a real mode:** a user with just a Stripe key + pasted notes + watchlist still gets a useful brief (payments, renewals, competitors, ICP threads). This widens the funnel beyond the OAuth bottleneck.

### 2.2 OpenAI API capabilities — confirmed current
- Use the **Responses API** (not Chat Completions): it's the primary endpoint, with structured outputs configured via `text.format` (moved from `response_format`) and built-in tools. The older Assistants API sunsets Aug 26, 2026 — don't touch it.
- **`web_search` is a built-in tool usable directly with `gpt-5.6`** — exactly what the watchlist pipeline needs; no Perplexity dependency, one vendor for the OpenAI deployment.
- Web search supports **domain filtering with up to 100 allowed domains** — use per-watch-item allowlists (competitor's domain + reddit.com + news.ycombinator.com + producthunt.com) to cut noise before any scoring. This is effectively another Layer-0 guardrail.
- Adapter note: implement `searchWeb()` as a Responses call with the web_search tool, then feed OUR normalized `{title,url,published_hint,snippet}` list into `watchlist-score` as a separate structured-output call. Two calls, clean separation (search ≠ judgment), provider-portable.

### 2.3 Gemini adapter notes (week 2, verify then)
- Gemini on Vertex AI has structured output support and Grounding with Google Search — the `searchWeb()` counterpart. Quirks differ (schema dialect, citation format); keep all normalization inside `/lib/llm/gemini.ts`. Re-verify current Vertex specifics in week 2 — don't burn hackathon-week-1 time on it beyond keeping the adapter compilable.

### 2.4 Rate/robustness notes
- Gmail sync: use `historyId`-based delta sync after initial backfill (last 30 days only for v1 — bounded cost, enough memory for the brief).
- Stripe: reconcile nightly via `/events` list even with webhooks configured — webhook delivery is at-least-once-ish in practice; the reconcile pass is the guardrail.
- Nightly run cost envelope (rough, sanity level): with Layer-0 filtering, a typical solo founder is ~20–60 classified emails/day + ~6 watchlist searches + 1 cross-ref + 1 brief + 3–5 drafts. Set the circuit breaker at $0.40/run and measure from day 1 (agent_runs.cost_usd).

---

## 3. Day-by-day pre-flight (condensed)
- Today: §1 complete, repo pushed, bootstrap prompt ready.
- Day 1 gate: brief renders from hardcoded interactions end-to-end (M1). If not: cut, don't extend.
- Day 3 gate: real Gmail works on YOUR account in Testing mode. If OAuth fights you: sandbox is the demo; video shows your own inbox only.
- Day 5 gate: golden suite green; judges' sandbox path rehearsed at 60 seconds.
