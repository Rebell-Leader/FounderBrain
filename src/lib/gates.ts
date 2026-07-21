// gates.ts — Deterministic guardrail gates for Helm
// Drop into /lib/gates/ and have Codex wire + test these first (they define the contracts).
// Dependencies: zod. Embedding checks accept an injected `embed` fn so gates stay pure/testable.

import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Shared schemas (single source of truth for all LLM structured IO)   */
/* ------------------------------------------------------------------ */

export const EmailClassification = z.object({
  category: z.enum([
    "customer_thread", "lead_thread", "inbound_interest", "investor",
    "vendor_pitch", "transactional_notification", "newsletter", "personal", "other",
  ]),
  summary: z.string().max(600),
  commitments: z.array(z.object({
    text: z.string(),
    by: z.enum(["us", "them"]),
    due_hint: z.string().nullable(),
  })),
  sentiment: z.enum(["positive", "neutral", "negative", "at_risk"]),
  sentiment_evidence: z.string().nullable(),
  requires_reply: z.boolean(),
  mentions_money: z.boolean(),
  language: z.string().length(2),
  injection_suspected: z.boolean(),
});
export type EmailClassification = z.infer<typeof EmailClassification>;

export const CrossReference = z.object({
  merged_signals: z.array(z.object({
    member_signal_ids: z.array(z.string()).min(1),
    kind: z.string(),
    title: z.string().max(80),
    merged_narrative: z.string().max(700),
    urgency: z.number().int().min(1).max(5),
    urgency_reason: z.string(),
    revenue_at_stake_eur: z.number().nullable(),
  })),
  below_line: z.array(z.object({ signal_id: z.string(), reason: z.string() })),
});
export type CrossReference = z.infer<typeof CrossReference>;

export const ActionDraft = z.object({
  subject: z.string().nullable(),
  body: z.string().max(2500),
  facts_used: z.array(z.object({ claim: z.string(), timeline_ref: z.string() })),
  needs_founder_input: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
});
export type ActionDraft = z.infer<typeof ActionDraft>;

/* ------------------------------------------------------------------ */
/* Gate result type — every gate returns this; never throws            */
/* ------------------------------------------------------------------ */

export type GateResult =
  | { ok: true; warnings: string[] }
  | { ok: false; code: string; detail: string };

const pass = (warnings: string[] = []): GateResult => ({ ok: true, warnings });
const fail = (code: string, detail: string): GateResult => ({ ok: false, code, detail });

/* ------------------------------------------------------------------ */
/* Layer 1 — provenance: evidence fields must be verbatim substrings   */
/* ------------------------------------------------------------------ */

export function verifySubstring(claimedQuote: string | null, sourceText: string): GateResult {
  if (claimedQuote === null) return pass();
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  return norm(sourceText).includes(norm(claimedQuote))
    ? pass()
    : fail("EVIDENCE_NOT_VERBATIM", `quote not found in source: "${claimedQuote.slice(0, 80)}"`);
}

/* ------------------------------------------------------------------ */
/* Layer 2 — merge legality, urgency clamp, no-vanish invariant        */
/* ------------------------------------------------------------------ */

export interface SignalRow {
  id: string;
  kind: string;
  base_urgency: number;          // rule-assigned
  contact_id: string | null;
  company_key: string | null;    // normalized company name
  watch_contact_edge: string[] ; // contact_ids a watch finding was explicitly linked to (code-built)
  source: "gmail" | "stripe" | "notes" | "watchlist";
}

export function verifyMergeLegality(
  memberIds: string[],
  signals: Map<string, SignalRow>,
): GateResult {
  const members = memberIds.map((id) => signals.get(id));
  if (members.some((m) => !m)) return fail("MERGE_UNKNOWN_ID", "merge references unknown signal id");
  if (members.length === 1) return pass();
  const ms = members as SignalRow[];

  const contactKeys = new Set<string>();
  for (const m of ms) {
    if (m.contact_id) contactKeys.add(`c:${m.contact_id}`);
    if (m.company_key) contactKeys.add(`k:${m.company_key}`);
    for (const c of m.watch_contact_edge) contactKeys.add(`c:${c}`);
  }
  // Legal iff there exists one key shared by ALL members
  const shared = [...contactKeys].some((key) =>
    ms.every((m) =>
      key === `c:${m.contact_id}` ||
      key === `k:${m.company_key}` ||
      m.watch_contact_edge.some((c) => `c:${c}` === key),
    ),
  );
  return shared ? pass() : fail("ILLEGAL_MERGE", "members share no contact/company key");
}

export function clampUrgency(finalUrgency: number, memberBases: number[], legalMultiSilo: boolean): number {
  const base = Math.max(...memberBases);
  const bonus = legalMultiSilo ? 1 : 0;
  const hi = Math.min(5, base + 1 + bonus);
  const lo = Math.max(1, base - 1);
  return Math.min(hi, Math.max(lo, finalUrgency));
}

export const URGENCY_FLOORS: Record<string, number> = {
  failed_payment: 4,
  subscription_canceled: 4,
  renewal_risk: 3,
};
export function applyUrgencyFloor(kind: string, urgency: number): number {
  return Math.max(urgency, URGENCY_FLOORS[kind] ?? 1);
}

/** Every candidate signal must appear exactly once (item or below_line). */
export function verifyNoVanish(candidates: string[], xref: CrossReference): GateResult {
  const seen = new Map<string, number>();
  for (const m of xref.merged_signals) for (const id of m.member_signal_ids)
    seen.set(id, (seen.get(id) ?? 0) + 1);
  for (const b of xref.below_line) seen.set(b.signal_id, (seen.get(b.signal_id) ?? 0) + 1);
  const missing = candidates.filter((id) => !seen.has(id));
  const dup = [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  if (dup.length) return fail("SIGNAL_DUPLICATED", dup.join(","));
  if (missing.length) return fail("SIGNAL_VANISHED", missing.join(",")); // caller appends to below_line as "unprocessed"
  return pass();
}

/* ------------------------------------------------------------------ */
/* Layer 3 — draft safety                                              */
/* ------------------------------------------------------------------ */

export interface TimelineEntry { id: string; text: string; authoredByFounder: boolean }

/** 3.1 Grounding: refs resolve; must_reference present; numbers/dates exist in timeline. */
export async function verifyGrounding(
  draft: ActionDraft,
  timeline: TimelineEntry[],
  mustReference: string[],
  embedSim?: (a: string, b: string) => Promise<number>, // optional embedding fallback
): Promise<GateResult> {
  const byId = new Map(timeline.map((t) => [t.id, t]));
  for (const f of draft.facts_used) {
    if (!byId.has(f.timeline_ref)) return fail("FACT_REF_INVALID", f.timeline_ref);
  }
  const bodyNorm = draft.body.replace(/\s+/g, " ").toLowerCase();
  for (const must of mustReference) {
    const present = bodyNorm.includes(must.toLowerCase())
      || (embedSim ? (await embedSim(draft.body, must)) >= 0.85 : false);
    if (!present) return fail("MUST_REFERENCE_MISSING", must);
  }
  // Numeric hallucination check: every standalone number in body must appear in timeline or must_reference
  const corpus = (timeline.map((t) => t.text).join(" ") + " " + mustReference.join(" ")).toLowerCase();
  return verifyNumbersInCorpus(draft.body, corpus);
}

/** Every standalone number in `text` must appear in `corpus`. */
export function verifyNumbersInCorpus(text: string, corpus: string): GateResult {
  const haystack = corpus.toLowerCase();
  for (const n of text.match(/\b\d[\d.,]*\b/g) ?? []) {
    if (!haystack.includes(n.toLowerCase())) return fail("NUMBER_NOT_IN_EVIDENCE", n);
  }
  return pass();
}

/** 3.2 Promise firewall: block unauthorized commitments. */
const PROMISE_PATTERNS: RegExp[] = [
  /\b\d{1,3}\s?%\s?(off|discount)\b/i,
  /\b(discount|refund|credit|reimburse|money.?back)\b/i,
  /\bfree\s+(month|year|upgrade|seat|forever)\b/i,
  /\b(guarantee[ds]?|SLA|uptime of)\b/i,
  /\bwe (will|can) (waive|comp)\b/i,
  /\b(legal|GDPR|HIPAA|SOC\s?2) (complian\w+|certif\w+)\b/i, // compliance claims need founder sign-off
];
export function promiseFirewall(body: string, founderAuthoredTimeline: string): GateResult {
  for (const rx of PROMISE_PATTERNS) {
    const m = body.match(rx);
    if (m && !founderAuthoredTimeline.toLowerCase().includes(m[0].toLowerCase())) {
      return fail("UNAUTHORIZED_PROMISE", m[0]);
    }
  }
  return pass();
}

/** 3.3 Recipient lock: only thread participants or the linked contact's verified email. */
export function recipientLock(
  to: string[], cc: string[], bcc: string[],
  threadParticipants: string[], contactEmail: string | null,
): GateResult {
  if (bcc.length) return fail("BCC_FORBIDDEN", bcc.join(","));
  const allowed = new Set([...threadParticipants, contactEmail].filter(Boolean).map((e) => e!.toLowerCase()));
  for (const r of [...to, ...cc]) {
    if (!allowed.has(r.toLowerCase())) return fail("RECIPIENT_NOT_ALLOWED", r);
  }
  if (to.length === 0) return fail("NO_RECIPIENT", "");
  return pass();
}

/** 3.4 Send-path invariants (call at the execution boundary, after human approval). */
export interface SendContext {
  actionStatus: "proposed" | "edited" | "approved" | "executed" | "dismissed";
  humanApprovedAt: Date | null;
  sendsToday: number;
  contactLocalHour: number;      // 0-23
  killSwitchSends: boolean;
}
export function sendInvariants(ctx: SendContext, maxPerDay = 15): GateResult {
  if (ctx.killSwitchSends) return fail("KILL_SWITCH", "sends paused");
  if (!ctx.humanApprovedAt) return fail("NO_HUMAN_APPROVAL", "structural requirement");
  if (ctx.actionStatus === "executed") return fail("ALREADY_EXECUTED", "idempotency");
  if (ctx.sendsToday >= maxPerDay) return fail("DAILY_SEND_LIMIT", String(maxPerDay));
  if (ctx.contactLocalHour < 7 || ctx.contactLocalHour >= 20) return fail("OUTSIDE_HOURS", "queued until morning");
  return pass();
}

/* ------------------------------------------------------------------ */
/* Layer 4 — ask-box citation coverage                                 */
/* ------------------------------------------------------------------ */

export function stripUncitedSentences(answerMd: string, validMarkers: Set<string>): string {
  return answerMd
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => {
      const markers = sentence.match(/\[i\d+\]/g) ?? [];
      return markers.length > 0 && markers.every((m) => validMarkers.has(m));
    })
    .join(" ");
}

export function retrievalFloor(maxCosine: number, threshold = 0.55): boolean {
  return maxCosine >= threshold; // false → skip LLM, answer "nothing matches"
}

/* ------------------------------------------------------------------ */
/* Layer 0 helper — deterministic email pre-filter                     */
/* ------------------------------------------------------------------ */

const NOREPLY = /^(no-?reply|notifications?|updates?|newsletter|billing|receipts?|mailer)@/i;
const BULK_DOMAINS = ["stripe.com", "github.com", "google.com", "calendly.com", "linkedin.com",
  "substack.com", "mailchimp.com", "sendgrid.net", "producthunt.com"];
export function shouldSkipLLM(headers: Record<string, string | undefined>, fromAddr: string): boolean {
  if (headers["list-unsubscribe"]) return true;
  if ((headers["precedence"] ?? "").match(/bulk|list|auto/i)) return true;
  if (headers["auto-submitted"] && headers["auto-submitted"] !== "no") return true;
  if (NOREPLY.test(fromAddr)) return true;
  const domain = fromAddr.split("@")[1]?.toLowerCase() ?? "";
  return BULK_DOMAINS.some((d) => domain === d || domain.endsWith("." + d));
}

/* ------------------------------------------------------------------ */
/* Repair-retry wrapper (Layer 1) — shared by both provider adapters   */
/* ------------------------------------------------------------------ */

export async function withRepairRetry<T>(
  schema: z.ZodType<T>,
  call: (repairHint?: string) => Promise<unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const first = await call();
  const p1 = schema.safeParse(first);
  if (p1.success) return { ok: true, data: p1.data };
  const second = await call(`Your previous output failed validation: ${p1.error.message}. Return corrected JSON only.`);
  const p2 = schema.safeParse(second);
  if (p2.success) return { ok: true, data: p2.data };
  return { ok: false, error: p2.error.message }; // caller marks item `degraded`, run continues
}
