# Local Dev & Deployment Guide — Helm
**Stack decision (locked): Supabase (Postgres + pgvector + Auth) · Next.js app · deploy on Vercel or Render.** Local-first for the hackathon week; deploy at M5 (Day 4–5). This doc replaces the generic docker-compose plan in the design doc — DECISIONS.md entry: "DB=Supabase everywhere; local via Supabase CLI".

---

## 1. Local development

### One-time setup
```bash
# Supabase CLI (local stack: Postgres+pgvector, Auth, Studio) — needs Docker running
npm i -D supabase
npx supabase init
npx supabase start          # prints anon key, service_role key, DB URL, Studio URL
# Put migration in place and apply:
mkdir -p supabase/migrations && cp docs/0001_init.sql supabase/migrations/0001_init.sql
npx supabase db reset       # applies migrations to the local stack
```
`.env` for local: `DATABASE_URL` + `SUPABASE_URL=http://127.0.0.1:54321` + the two keys `supabase start` printed. Everything in env.example otherwise as-is.

Notes:
- The migration references `auth.users` — that's why local Postgres must be the Supabase stack, not vanilla postgres. (If Docker is unavailable on your machine, fallback: create a free hosted Supabase project and point local dev at it — one project `helm-dev`, fine for a solo build week.)
- pgvector + HNSW index are included in Supabase's Postgres by default.
- `npx supabase db reset && npm run seed` is your clean-slate loop; keep it under 30 seconds so you actually use it.

### Daily loop
```bash
npx supabase start                  # if not running
npm run dev                         # Next.js on :3000
npm run seed                        # loads sample-data/seed-bundle.json into sandbox tenant
npm test                            # vitest: gates + golden suite (fast, no network)
npm run test:llm                    # golden suite against real GPT-5.6 (env-gated, costs cents)
npm run pipeline:run -- --user sandbox   # manual full run, prints agent_run steps
```

### Auth locally
Supabase Auth email magic-link works on the local stack (emails land in Inbucket, printed by `supabase start`). For build week, one real user (you) + the sandbox tenant is all you need; don't build signup polish until week 2.

### Nightly pipeline locally
No cron locally — the `pipeline:run` script IS the pipeline. Cron is a deploy-time concern (§2.3). Keep the pipeline an ordinary async function `runPipeline(userId, trigger)` imported by (a) the script, (b) the API route, (c) the cron handler — one code path, three entry points.

## 2. Deployment (M5, after golden suite is green)

### 2.1 Database: hosted Supabase
- Create project `helm-prod`, **EU region (Frankfurt)**.
- `npx supabase link --project-ref <ref> && npx supabase db push` applies the same migrations. Zero divergence between local and prod schemas by construction.
- Enable Point-in-Time-Recovery later (paid); daily backups are on by default.

### 2.2 App: Vercel vs Render — pick by one question
**Does the nightly pipeline finish inside your platform's function time limit?**
- The per-user run does many sequential LLM calls; for one user it's ~1–3 min. Multi-user nightly runs will exceed serverless limits quickly.
- **Vercel:** great DX for the Next.js app; use Vercel Cron to hit `/api/cron/nightly`, but design the handler as a **fan-out**: cron enqueues one job per user (call itself per-user with `?user=` or use a queue) so each invocation stays small. Function duration limits vary by plan — verify yours before demo night, and keep SSE for "Run now" under the limit by streaming progress and doing work in chunks.
- **Render:** the app runs as a normal always-on Node service (no per-request time limits) + a native **Cron Job** service runs `npm run pipeline:nightly` in the same repo. Simpler mental model for long-running agent work; slightly less Next.js-optimized.

**Recommendation:** Vercel for the app + judges' sandbox (best cold-start/preview DX for the demo), and if the fan-out feels fragile by Day 5, move ONLY the nightly job to a Render Cron Job hitting the same Supabase DB. The app and the pipeline share a repo and a DB; where each process runs is swappable. Both platforms are fine for XPRIZE too (Google Cloud requirement is satisfied by Gemini on Vertex + optionally moving the cron to Cloud Run later — the DB and app can stay put).

### 2.3 Cron + secrets checklist
- [ ] `CRON_SECRET` set; `/api/cron/nightly` rejects requests without it (Vercel Cron sends it as a header you configure; Render Cron just runs the script with env).
- [ ] All env vars from env.example set in the platform dashboard; `SUPABASE_SERVICE_ROLE_KEY` marked sensitive; never exposed to the client bundle (no `NEXT_PUBLIC_` prefix).
- [ ] Google OAuth redirect URI updated to the prod domain; domain added in the GCP consent screen config.
- [ ] Stripe webhook endpoints (both hats) pointed at prod URLs; signing secrets set.
- [ ] `SANDBOX_ENABLED=true` in prod — the sandbox IS the judges' path.
- [ ] Kill switches default: sends **false** (enabled) for your own account, but flip `KILL_SWITCH_SENDS=true` during video recording rehearsals so a stray click can't email anyone.

### 2.4 Judge-proofing the deployment (Day 5 afternoon)
- Open the prod sandbox in an incognito window on a phone hotspot: target < 3s to first brief render (pre-warm: keep the sandbox brief precomputed in DB, never generated on page load).
- Seed the prod sandbox via a one-off script run (`npm run seed -- --remote`), not by clicking around.
- Verify `/api/sample` (the "Load sample class"-equivalent reset) is idempotent — judges may click it repeatedly.
- Add `robots.txt` disallow + a `demo` badge in the header so early PH visitors don't mistake sandbox data for real customers.

## 3. What deliberately stays out of build week
Queues (BullMQ etc.), multi-region, staging environment, IaC, observability platforms. `agent_runs.steps_json` + platform logs are your observability. Add a queue only when >20 real users make the fan-out cron creak — that's a good week-3 problem to have.
