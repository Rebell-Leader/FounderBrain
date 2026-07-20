// generate-sandbox.ts — Sandbox fixture generator for Helm ("LingoLoop" tenant)
// Place at /scripts/generate-sandbox.ts. Run: npx tsx scripts/generate-sandbox.ts [--regen-llm]
//
// Two-phase design (per helm-sandbox-dataset.md):
//   Phase A (--regen-llm): call GPT-5.6 once per storyline to draft email/note text,
//            write to /sample-data/_drafts for HUMAN REVIEW. Never auto-freeze.
//   Phase B (default): assemble frozen, hand-reviewed content from /sample-data
//            into deterministic DB seed rows (stable UUIDs from a seed string).
// The golden test consumes manifest.json — ground truth never ships to the model.

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/* ---------- deterministic ids ---------- */
const NAMESPACE = "helm-sandbox-v1";
export const stableId = (key: string): string => {
  const h = createHash("sha256").update(`${NAMESPACE}:${key}`).digest("hex");
  // Format as UUID v4-shaped (deterministic, fine for fixtures)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

/* ---------- storyline spec (single source of truth, mirrors dataset doc §2) ---------- */
export interface StorylineSpec {
  id: "S1" | "S2" | "S3" | "S4" | "S5";
  expectSignalKinds: string[];       // manifest ground truth
  expectMerged: boolean;
  expectRank: number | null;         // S1 must be #1
  contacts: { key: string; name: string; email: string; company: string; kind: string; planEur?: number }[];
  anchors: string[];                 // facts that MUST appear verbatim in generated sources
  llmBrief: string;                  // instruction paragraph for Phase A generation
}

export const STORYLINES: StorylineSpec[] = [
  {
    id: "S1",
    expectSignalKinds: ["failed_payment", "unanswered"],
    expectMerged: true,
    expectRank: 1,
    contacts: [{ key: "marta", name: "Marta Kovač", email: "marta@datawise.example", company: "Datawise", kind: "customer", planEur: 299 }],
    anchors: ["procurement", "consolidat", "expired"],
    llmBrief:
      "Customer Marta (Datawise, €299/mo). Three artifacts: (1) call note from 3 weeks ago — " +
      "praises product, flags 'procurement pressure' on tool count, asks for a case study for her CFO; " +
      "(2) email 6 days ago mentioning they're 'evaluating whether to consolidate tools next quarter' — founder never replied; " +
      "(3) NO email about the card — the failed payment exists only in Stripe events. " +
      "CRITICAL: the procurement comment appears ONLY in the call note, never in email.",
  },
  {
    id: "S2",
    expectSignalKinds: ["quiet_lead"],
    expectMerged: false,
    expectRank: null,
    contacts: [{ key: "jonas", name: "Jonas Berg", email: "jonas@shipfleet.example", company: "Shipfleet", kind: "lead" }],
    anchors: ["40 seats", "July"],
    llmBrief:
      "Lead Jonas (Shipfleet). Call note 9 days ago: very positive, verbatim 'send me pricing for 40 seats' " +
      "and wants 'a pilot in July'. Founder sent pricing email 8 days ago (authored_by_founder). Silence since.",
  },
  {
    id: "S3",
    expectSignalKinds: ["competitor_move"],
    expectMerged: false, expectRank: null,
    contacts: [],
    anchors: ["free tier"],
    llmBrief:
      "Web fixture only: competitor 'Subtitly' announced a free tier yesterday. Produce 1 launch-post search result " +
      "(title, url on subtitly.example, snippet) + 2 noise results that should score irrelevant.",
  },
  {
    id: "S4",
    expectSignalKinds: ["icp_thread"],
    expectMerged: false, expectRank: null,
    contacts: [],
    anchors: ["without re-recording"],
    llmBrief:
      "Web fixture only: r/SaaS thread from this morning asking how to 'localize product walkthrough videos " +
      "without re-recording'. 5 comments, no good answer. Plus 1 stale (3-week-old) noise thread.",
  },
  {
    id: "S5",
    expectSignalKinds: ["unanswered"],
    expectMerged: false, expectRank: null,
    contacts: [{ key: "priya", name: "Priya N.", email: "priya@kadenz.example", company: "Kadenz", kind: "lead" }],
    anchors: ["German legal disclaimers", "IndieHackers"],
    llmBrief:
      "Inbound 3 days ago via website: 'Saw you on IndieHackers — does LingoLoop handle German legal disclaimers?' " +
      "Founder never answered.",
  },
];

/* Noise spec: must NOT surface in the brief (golden test negative cases) */
export const NOISE_BRIEF =
  "Generate: 2 genuinely boring newsletters (with List-Unsubscribe header noted), 1 cold vendor pitch to the founder, " +
  "1 happy customer 'thanks, works great!' email, and note 1 successful Stripe renewal (structured, no email). " +
  "Plus 9 routine customer contacts (names/companies only) to fill the roster to 14.";

/* ---------- Phase A: LLM drafting (writes _drafts for human review) ---------- */
async function phaseA(sampleDir: string): Promise<void> {
  const draftsDir = join(sampleDir, "_drafts");
  mkdirSync(draftsDir, { recursive: true });
  // TODO(Codex): implement using /lib/llm provider (Responses API, structured outputs).
  // One call per storyline + one for noise, schema: { emails: Eml[], callNotes: Note[], webFixtures: Fixture[] }
  // Prompt = dataset doc §4 skeleton + spec.llmBrief + hard rules (timestamps within
  // last 30 days relative to a FIXED anchor date, e.g. 2026-07-14T06:00:00Z — the
  // sandbox "today" is frozen so timelines never rot).
  for (const s of STORYLINES) {
    writeFileSync(join(draftsDir, `${s.id}.todo.json`), JSON.stringify({ spec: s, status: "PENDING_LLM" }, null, 2));
  }
  console.log("Phase A scaffolded. Wire the LLM call, generate, HAND-REVIEW, then move approved files up into /sample-data.");
}

/* ---------- Phase B: assemble frozen content into seed rows ---------- */
export interface SeedBundle {
  user: Record<string, unknown>;
  contacts: Record<string, unknown>[];
  interactions: Record<string, unknown>[];
  watchItems: Record<string, unknown>[];
  webFixtures: Record<string, unknown>[]; // consumed by the sandbox searchWeb() stub
  manifest: {
    version: string;
    anchorDate: string;
    expectations: { storyline: string; kinds: string[]; merged: boolean; rank: number | null; anchors: string[] }[];
  };
}

export function phaseB(sampleDir: string): SeedBundle {
  const anchorDate = "2026-07-14T06:00:00Z"; // frozen sandbox "today"
  const userId = stableId("user:alex");

  const bundle: SeedBundle = {
    user: {
      id: userId, email: "alex@lingoloop.example", company_name: "LingoLoop",
      product_description: "AI-powered onboarding-video localization for SaaS companies (€79–€299/mo).",
      icp_description: "B2B SaaS teams (5–200 employees) with product walkthrough videos and international users.",
      tz: "Europe/Berlin", is_sandbox: true,
    },
    contacts: [], interactions: [], watchItems: [], webFixtures: [],
    manifest: {
      version: "1",
      anchorDate,
      expectations: STORYLINES.map((s) => ({
        storyline: s.id, kinds: s.expectSignalKinds, merged: s.expectMerged, rank: s.expectRank, anchors: s.anchors,
      })),
    },
  };

  // Contacts from specs (stable ids from contact key)
  for (const s of STORYLINES) for (const c of s.contacts) {
    bundle.contacts.push({
      id: stableId(`contact:${c.key}`), user_id: userId, email: c.email, name: c.name,
      company: c.company, company_key: c.company.toLowerCase(), kind: c.kind,
      plan_eur_monthly: c.planEur ?? null,
    });
  }

  // Frozen content: read reviewed files if present (emails/, call-notes/, web-fixtures/, stripe-events.json)
  const read = (p: string): unknown[] =>
    existsSync(join(sampleDir, p)) ? (JSON.parse(readFileSync(join(sampleDir, p), "utf8")) as unknown[]) : [];
  // TODO(Codex): map emails → interactions(email_in/email_out) with thread_ref + stable source_ref ids;
  //              call notes → interactions(call_notes); stripe-events → interactions(stripe_event);
  //              validate every anchor string appears in its storyline's source text (fail loud if not);
  //              embeddings computed lazily at seed time (or precomputed and committed).
  void read;

  const contactId = (key: string) => stableId(`contact:${key}`);
  const addInteraction = (key: string, row: Record<string, unknown>) => {
    bundle.interactions.push({
      id: stableId(`interaction:${key}`),
      user_id: userId,
      source_ref: key,
      created_at: anchorDate,
      ...row,
    });
  };

  addInteraction("marta-call-procurement", {
    contact_id: contactId("marta"),
    kind: "call_notes",
    occurred_at: "2026-06-23T14:00:00Z",
    raw_text: "Marta praised LingoLoop's QA workflow but flagged procurement pressure around the number of tools Datawise is carrying. She asked for a short CFO-friendly case study before renewal.",
    summary: "Marta likes the product but procurement pressure could affect renewal.",
    sentiment: "at_risk",
    sentiment_evidence: "flagged procurement pressure",
    authored_by_founder: true,
  });
  addInteraction("marta-email-consolidation", {
    contact_id: contactId("marta"),
    kind: "email_in",
    occurred_at: "2026-07-08T08:30:00Z",
    thread_ref: "thread:marta:consolidation",
    raw_text: "Hi Alex — we're evaluating whether to consolidate tools next quarter. Can you send the latest notes on what LingoLoop replaces and where it still needs a separate workflow? Best, Marta",
    summary: "Marta says Datawise is evaluating whether to consolidate tools next quarter and asks for replacement notes.",
    sentiment: "at_risk",
    sentiment_evidence: "evaluating whether to consolidate tools next quarter",
    authored_by_founder: false,
  });
  addInteraction("marta-stripe-failed-payment", {
    contact_id: contactId("marta"),
    kind: "stripe_event",
    occurred_at: "2026-07-12T06:15:00Z",
    raw_text: "invoice.payment_failed for Datawise customer cus_datawise_marta: €299 monthly plan, reason expired card.",
    summary: "Datawise's €299 monthly payment failed because the card is expired.",
    sentiment: "negative",
    sentiment_evidence: "expired card",
    authored_by_founder: false,
  });
  addInteraction("jonas-call-40-seat-july", {
    contact_id: contactId("jonas"),
    kind: "call_notes",
    occurred_at: "2026-07-05T10:00:00Z",
    raw_text: "Jonas was excited after the demo. Exact next step: send me pricing for 40 seats and let's aim for a pilot in July.",
    summary: "Jonas wants pricing for 40 seats and a July pilot.",
    sentiment: "positive",
    sentiment_evidence: "pilot in July",
    authored_by_founder: true,
  });
  addInteraction("jonas-pricing-sent", {
    contact_id: contactId("jonas"),
    kind: "email_out",
    occurred_at: "2026-07-06T09:00:00Z",
    thread_ref: "thread:jonas:pricing",
    raw_text: "Hi Jonas, sending pricing for the 40 seats we discussed and a proposed July pilot plan.",
    summary: "Alex sent Shipfleet pricing for 40 seats and a July pilot plan.",
    sentiment: "neutral",
    authored_by_founder: true,
  });
  addInteraction("priya-inbound-disclaimers", {
    contact_id: contactId("priya"),
    kind: "email_in",
    occurred_at: "2026-07-11T15:20:00Z",
    thread_ref: "thread:priya:inbound",
    raw_text: "Saw you on IndieHackers — does LingoLoop handle German legal disclaimers in onboarding videos? We're testing localization this month. Priya",
    summary: "Priya asks whether LingoLoop handles German legal disclaimers after seeing Alex on IndieHackers.",
    sentiment: "positive",
    sentiment_evidence: "testing localization this month",
    authored_by_founder: false,
  });

  // Watchlist
  bundle.watchItems.push(
    { id: stableId("watch:subtitly"), user_id: userId, kind: "competitor", value: "Subtitly",
      allowed_domains: ["subtitly.example", "news.ycombinator.com", "producthunt.com"] },
    { id: stableId("watch:icp-kw"), user_id: userId, kind: "icp_keyword", value: "onboarding video localization",
      allowed_domains: ["reddit.com", "news.ycombinator.com"] },
  );

  bundle.webFixtures.push(
    {
      id: stableId("web:subtitly-free-tier"),
      watch_item_id: stableId("watch:subtitly"),
      title: "Subtitly launches free tier for SaaS localization",
      url: "https://subtitly.example/blog/free-tier",
      published_hint: "2026-07-13",
      snippet: "Subtitly announced a free tier yesterday for teams localizing onboarding videos.",
    },
    {
      id: stableId("web:reddit-localization-thread"),
      watch_item_id: stableId("watch:icp-kw"),
      title: "How do you localize walkthrough videos without re-recording?",
      url: "https://reddit.com/r/SaaS/comments/example/localize_walkthrough_videos",
      published_hint: "2026-07-14",
      snippet: "Founder asks how to localize product walkthrough videos without re-recording; comments have no good answer yet.",
    },
  );

  return bundle;
}

/* ---------- anchor validation (run in Phase B; the anti-drift tripwire) ---------- */
export function validateAnchors(bundle: SeedBundle): string[] {
  const corpus = bundle.interactions.map((i) => `${i.raw_text ?? ""} ${i.summary ?? ""}`).join(" ").toLowerCase()
    + " " + bundle.webFixtures.map((f) => JSON.stringify(f)).join(" ").toLowerCase();
  const missing: string[] = [];
  for (const e of bundle.manifest.expectations)
    for (const a of e.anchors)
      if (!corpus.includes(a.toLowerCase())) missing.push(`${e.storyline}: "${a}"`);
  return missing; // must be [] before seeding; golden test also asserts this
}

/* ---------- main ---------- */
const sampleDir = join(process.cwd(), "sample-data");
if (process.argv.includes("--regen-llm")) {
  await phaseA(sampleDir);
} else {
  const bundle = phaseB(sampleDir);
  const missing = validateAnchors(bundle);
  if (missing.length && bundle.interactions.length > 0) {
    console.error("ANCHOR VALIDATION FAILED:\n" + missing.join("\n"));
    process.exit(1);
  }
  mkdirSync(join(sampleDir), { recursive: true });
  writeFileSync(join(sampleDir, "seed-bundle.json"), JSON.stringify(bundle, null, 2));
  writeFileSync(join(sampleDir, "manifest.json"), JSON.stringify(bundle.manifest, null, 2));
  console.log(`Seed bundle written: ${bundle.contacts.length} contacts, ${bundle.interactions.length} interactions.`);
  console.log("Next: npm run seed  (inserts bundle into DB for the sandbox tenant)");
}
