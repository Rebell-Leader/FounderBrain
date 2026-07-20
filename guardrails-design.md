# Guardrails Design — Helm
**Principle: LLMs propose, deterministic code disposes.** Every LLM output passes through code-level gates before it can affect state, ranking, or (especially) anything sent to a human. The system must degrade gracefully to "boring but correct" when any model call fails or drifts.

---

## Layer 0 — Don't call the LLM at all (deterministic pre-processing)

| Concern | Deterministic mechanism (no LLM) |
|---|---|
| Newsletters/notifications | Skip any email with `List-Unsubscribe` header, `Precedence: bulk`, known no-reply patterns, or sender in a static domain blocklist (stripe.com receipts, github, calendars). Only survivors reach `email-classify`. Expect this to cut LLM email volume ~60%. |
| Stripe signals | Stripe events are already structured. `failed_payment`, `subscription_canceled`, `renewal<14d` become signals **directly from webhook data** — the LLM never creates or suppresses a money signal, only narrates it. |
| Rule signals | `unanswered>48h`, `quiet_lead>7d after positive interaction`, `commitment due` are pure SQL over timestamps. The LLM can merge and re-rank ±1; it cannot delete a rule signal (only demote below-line, which is visible and reversible). |
| Watchlist dedupe | URL canonicalization + exact-match against 14-day history BEFORE scoring; embedding-similarity dedupe (cosine > 0.92) after. LLM novelty judgment is the third filter, not the first. |
| Contact linking | Email↔contact and Stripe↔contact linking by exact email match only. The LLM may *suggest* a link (e.g., from call notes naming a person) → goes to a human confirmation queue, never auto-linked. |

## Layer 1 — Schema and provenance validation (every LLM call)

1. **Zod parse** → on failure, one repair retry with the validation error appended → on second failure, mark item `degraded` and continue the run (never abort a whole run for one item).
2. **Verbatim-substring checks**: fields declared as evidence quotes (`sentiment_evidence`, `objections_risks[].evidence`) must be exact substrings of the source text. Fail → null the field, keep the rest, log.
3. **Enum/bounds enforcement** in code even though the schema declares them (belt and suspenders across providers — Gemini and GPT-5.6 fail differently).
4. **Prompt-injection posture**: all external text (emails, notes, web snippets) is delimited as untrusted data; `injection_suspected: true` on any item → that item can still inform the brief but is **banned from influencing drafts or merges**, and is flagged in UI. Drafting calls never receive raw web content — only our own structured summaries.

## Layer 2 — Merge and ranking gates (after cross-reference)

- **Legal-merge check (deterministic):** every merge must share a `contact_id` OR normalized company key OR an explicit watch_item→contact edge that code can verify. Illegal merge → reject, fall back to unmerged member signals. (This is the check that makes the "Marta" headliner trustworthy.)
- **Urgency clamp:** final urgency ∈ [base−1, base+1]; +1 multi-silo bonus only when a verified legal merge has ≥2 members from different sources. `failed_payment` has a floor of 4 — no model can bury a money problem.
- **No-vanish invariant:** every candidate signal appears exactly once — in an item or in `below_line`. Set-difference check; missing signals are appended to below_line with reason "unprocessed".
- **Continuity guard:** an item acted on yesterday can't reappear unchanged (hash of member evidence); it may reappear only with new evidence attached.

## Layer 3 — Draft safety (the highest-stakes surface)

Every draft passes ALL gates before it renders in the UI; a failed gate regenerates once with the failure reason, then falls back to a template (see Layer 5).

1. **Grounding verifier:** `facts_used[].timeline_ref` must resolve to real timeline entries; each `must_reference` item must appear in the body (string or embedding ≥ 0.85). Numbers and dates in the body must exist somewhere in the timeline (`\d` extraction → membership check) — kills invented "40 seats" style errors.
2. **Promise firewall (regex + small classifier):** discount/refund/credit/percent-off/SLA/legal-guarantee patterns → block unless the same promise exists in founder-authored timeline text. This is non-negotiable: an LLM promising a refund to a real customer is the product-killing failure mode.
3. **Recipient lock:** email actions may only go to (a) an address already present in the thread being replied to, or (b) the linked contact's verified email. Drafts cannot introduce new recipients, CC, or BCC. Attachments impossible by construction (no attachment capability in the send path).
4. **Send-path invariants (code, not model):** replies keep the original thread ID and subject; new emails get subjects from the draft but sender is always the founder's own authenticated Gmail; rate limit ≤ 15 agent-assisted sends/day/user; sends outside 07:00–20:00 contact-local queue until morning (configurable).
5. **Language/length/style lint:** language must match contact's detected language; length caps enforced; banned-phrase list ("I hope this email finds you well", chain em-dashes) as a lint warning, not a block.
6. **Human approval is structural, not optional:** the `execute` endpoint requires an `action_id` in `proposed|edited` state owned by the session user. There is no code path for autonomous sending — this is a product guarantee stated in the UI and enforced by architecture.

## Layer 4 — Ask-box honesty

- Uncited sentences are stripped in code (citation-marker coverage check).
- Retrieval floor: if top-k max cosine < 0.55, skip the LLM entirely and return "nothing in your history matches that" with nearest topics. Better silent than confidently wrong about the user's own customers.

## Layer 5 — Degradation ladder (per component)

| Component fails | Fallback (always ships a brief) |
|---|---|
| email-classify | Store raw email unsummarized, category "other" — timeline still complete |
| watchlist-score | Show raw top findings labeled "unscored" in Watchlist page; no brief items |
| cross-reference | Brief = rule signals only, ranked by base urgency; UI banner "synthesis unavailable — showing raw signals" |
| brief-compose | Render merged signals directly as cards without prose |
| draft-action | Template library per action kind with merge fields from evidence ("Hi {{name}}, following up on {{last_topic}}…") — bland but safe and grounded by construction |
| Provider outage | `LLM_PROVIDER` failover flag (openai↔gemini) — the dual-adapter layer doubles as a guardrail |

## Layer 6 — Operational controls

- **Cost circuit breaker:** per-run token/cost budget (env-configured, e.g. $0.40/run); exceeding it stops enrichment (Layer 0/rule outputs still produce a brief) and alerts.
- **Timeouts + idempotency:** every pipeline step keyed by `(run_id, step)`; reruns are safe; a stuck step can't double-create signals or drafts.
- **Kill switches:** per-user and global flags to pause sends, pause watchlist crawling, or force template-only drafting — one env var each, checked at the execution boundary.
- **Sandbox isolation:** sandbox mode stubs `searchWeb()` with fixtures and stubs the Gmail send; a sandbox user physically cannot email anyone.

## Layer 7 — Continuous verification

- **Golden suite in CI, both providers:** the 5 sandbox storylines (merge, ranking, specificity, noise exclusion, ask-box citation) must pass on OpenAI and Gemini adapters before deploy.
- **Nightly canary:** production pipeline runs against the sandbox tenant every night; assertion failure pages the founder (you) before customers see drift. This is also perfect XPRIZE "AI running continuously in production" evidence.
- **Quality KPIs from behavior, not vibes:** per-user edit rate (edited-before-approve %), dismiss rate per signal kind, regenerate rate. Thresholds (e.g., edit rate > 60% on a draft kind for 3 days) open a GitHub issue automatically with anonymized examples.
- **Why-this panel in UI:** every card shows rule trigger + LLM justification + evidence links. Transparency is a guardrail — users catch what tests miss, and it builds the trust that makes founders connect their inbox at all.

---

### The one-line summary for the README/judges
Money signals, merges, recipients, promises, and sending are governed by deterministic code; the LLM's creativity is confined to summarizing, connecting, and wording — and everything it words is verified against evidence before a human approves it.
