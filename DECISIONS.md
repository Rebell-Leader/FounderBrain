# Helm Decision Log

| Date | Decision | Why |
|---|---|---|
| 2026-07-20 | Helm is a revenue-moment co-pilot for solo and small B2B SaaS founders. | A narrow cross-silo customer-risk wedge is memorable and demoable. |
| 2026-07-20 | The judge path is a deterministic, precomputed LingoLoop sandbox. | It removes OAuth, network, and cold-start risk from the core demo. |
| 2026-07-20 | The sandbox is served by a server-only read DTO; its Approve control is client-side simulation. | Anonymous judges cannot safely read Supabase directly or mutate a shared fixture. |
| 2026-07-20 | Supabase CLI is the single local database workflow; the initial migration lives in `supabase/migrations/`. | It matches the production schema, Auth dependency, RLS, and pgvector requirements. |
| 2026-07-20 | Guardrails are product code, not prompt suggestions. | Merge legality, provenance, recipient lock, promise firewall, and send approval must be deterministic. |
| 2026-07-20 | Use OpenAI Responses API. Default to `gpt-5.6` for synthesis; evaluate `gpt-5.6-luna` for high-volume classification; use `text-embedding-3-small` for 1536-dimensional retrieval embeddings. | The models support the needed structured-output and tool workflow while keeping routine calls economical. |
| 2026-07-20 | Real Gmail, Stripe, web search, billing, cron, and Gemini runtime support are post-sandbox work. | They do not prove the headline insight and materially raise delivery risk. |
| 2026-07-20 | Target OpenAI Build Week submission by July 21, 2026, 5:00 PM PDT. | The official rules require a project created or meaningfully extended with Codex and/or GPT-5.6 during the submission period; keep the session evidence and commit history. |
| 2026-07-21 | Ship the judge path from a local, deterministic LingoLoop fixture bundle before wiring Supabase. | The fully grounded experience is now runnable without credentials, database state, or latency risk. |
| 2026-07-21 | Keep the GPT-5.6 refresh endpoint private and copy-only. | A token-protected server route may refresh headline/narrative copy, but deterministic code retains ranks, evidence, drafts, recipients, and execution boundaries. |
| 2026-07-21 | Keep the sandbox source corpus in checked-in, schema-validated local JSON. | The pipeline now consumes Gmail-, Stripe-, notes-, and watchlist-shaped fixtures and golden tests catch data or rule drift before a live connector is introduced. |

## Open decisions

- Choose MIT or BSL 1.1 before public submission.
- Decide whether the first private pilot is Stripe-only or Gmail + Stripe after the sandbox succeeds.
