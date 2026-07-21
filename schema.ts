// schema.ts — Drizzle schema for Helm (Supabase Postgres + pgvector)
// Place at /lib/db/schema.ts. Matches helm-technical-design.md §3 and src/lib/gates.ts SignalRow.
// Auth: Supabase Auth owns auth.users; our `users` table references its UUID.

import {
  pgTable, uuid, text, timestamp, integer, boolean, jsonb, numeric,
  pgEnum, index, uniqueIndex, customType,
} from "drizzle-orm/pg-core";

/* pgvector column (1536 dims = OpenAI text-embedding-3-small; Gemini adapter
   maps its embeddings to the same dim or uses a second column later) */
const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType: () => "vector(1536)",
  toDriver: (v) => `[${v.join(",")}]`,
});

/* ---------------- enums ---------------- */
export const connectionKind = pgEnum("connection_kind", ["gmail", "stripe"]);
export const connectionStatus = pgEnum("connection_status", ["active", "error", "revoked"]);
export const contactKind = pgEnum("contact_kind", ["lead", "customer", "investor", "other"]);
export const interactionKind = pgEnum("interaction_kind", [
  "email_in", "email_out", "call_notes", "stripe_event",
]);
export const sentiment = pgEnum("sentiment", ["positive", "neutral", "negative", "at_risk"]);
export const watchKind = pgEnum("watch_kind", ["competitor", "icp_keyword", "community"]);
export const signalKind = pgEnum("signal_kind", [
  "quiet_lead", "failed_payment", "subscription_canceled", "renewal_risk",
  "unanswered", "commitment_due", "competitor_move", "icp_thread", "positive",
]);
export const signalSource = pgEnum("signal_source", ["gmail", "stripe", "notes", "watchlist", "rules"]);
export const actionKind = pgEnum("action_kind", ["email_reply", "email_followup", "social_post_draft", "task"]);
export const actionStatus = pgEnum("action_status", [
  "proposed", "edited", "approved", "executed", "dismissed", "failed",
]);
export const runTrigger = pgEnum("run_trigger", ["nightly", "manual", "canary"]);
export const runStatus = pgEnum("run_status", ["running", "completed", "degraded", "failed"]);

/* ---------------- tables ---------------- */

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),                       // = auth.users.id (Supabase)
  email: text("email").notNull().unique(),
  companyName: text("company_name"),
  productDescription: text("product_description"),
  icpDescription: text("icp_description"),
  tz: text("tz").notNull().default("Europe/Berlin"),
  voiceSamples: jsonb("voice_samples").$type<string[]>().default([]),
  isSandbox: boolean("is_sandbox").notNull().default(false),
  gmailTestUserApproved: boolean("gmail_test_user_approved").notNull().default(false), // concierge onboarding tracker
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const connections = pgTable("connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: connectionKind("kind").notNull(),
  credentialsEncrypted: text("credentials_encrypted").notNull(), // sealed-box ciphertext (OAuth tokens / restricted key)
  status: connectionStatus("status").notNull().default("active"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  syncCursor: text("sync_cursor"),                   // gmail historyId / stripe event id
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("connections_user_kind").on(t.userId, t.kind)]);

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email"),
  name: text("name"),
  company: text("company"),
  companyKey: text("company_key"),                   // normalized; merge-legality key (gates.ts)
  kind: contactKind("kind").notNull().default("other"),
  stripeCustomerId: text("stripe_customer_id"),
  planEurMonthly: numeric("plan_eur_monthly"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("contacts_user").on(t.userId),
  uniqueIndex("contacts_user_email").on(t.userId, t.email),
]);

export const interactions = pgTable("interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  kind: interactionKind("kind").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  sourceRef: text("source_ref"),                     // gmail msg id / stripe event id / note id
  threadRef: text("thread_ref"),                     // gmail thread id
  rawText: text("raw_text"),                         // minimal-retention policy: bodies only where needed
  summary: text("summary"),
  sentiment: sentiment("sentiment"),
  sentimentEvidence: text("sentiment_evidence"),     // verbatim substring (gate-verified)
  extraction: jsonb("extraction"),                   // EmailClassification | NotesExtraction (validated)
  authoredByFounder: boolean("authored_by_founder").notNull().default(false),
  injectionSuspected: boolean("injection_suspected").notNull().default(false),
  embedding: vector1536("embedding"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("interactions_user_time").on(t.userId, t.occurredAt),
  index("interactions_contact_time").on(t.contactId, t.occurredAt),
  uniqueIndex("interactions_source_ref").on(t.userId, t.kind, t.sourceRef), // idempotent ingest
]);

export const watchItems = pgTable("watch_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: watchKind("kind").notNull(),
  value: text("value").notNull(),
  notes: text("notes"),
  allowedDomains: jsonb("allowed_domains").$type<string[]>().default([]), // OpenAI web_search domain filter
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const watchFindings = pgTable("watch_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  watchItemId: uuid("watch_item_id").notNull().references(() => watchItems.id, { onDelete: "cascade" }),
  urlCanonical: text("url_canonical").notNull(),
  title: text("title"),
  snippet: text("snippet"),
  publishedHint: text("published_hint"),
  scoring: jsonb("scoring"),                         // WatchlistScoring finding (validated)
  embedding: vector1536("embedding"),                // semantic dedupe
  seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("findings_user_url").on(t.userId, t.urlCanonical)]);

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trigger: runTrigger("trigger").notNull(),
  status: runStatus("status").notNull().default("running"),
  stepsJson: jsonb("steps_json").$type<unknown[]>().default([]),  // append-only step log (XPRIZE evidence)
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  costUsd: numeric("cost_usd").notNull().default("0"),
  actionsProposed: integer("actions_proposed").notNull().default(0),
  actionsExecuted: integer("actions_executed").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (t) => [index("runs_user_time").on(t.userId, t.startedAt)]);

export const signals = pgTable("signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  runId: uuid("run_id").references(() => agentRuns.id, { onDelete: "set null" }),
  kind: signalKind("kind").notNull(),
  source: signalSource("source").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  watchItemId: uuid("watch_item_id").references(() => watchItems.id, { onDelete: "set null" }),
  watchContactEdge: jsonb("watch_contact_edge").$type<string[]>().default([]), // code-built links (gates.ts)
  baseUrgency: integer("base_urgency").notNull(),
  evidence: jsonb("evidence").$type<{ source: string; date: string; excerpt: string; interactionId?: string }[]>().notNull(),
  evidenceHash: text("evidence_hash").notNull(),      // continuity guard (guardrails L2)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("signals_user_run").on(t.userId, t.runId)]);

export const briefs = pgTable("briefs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  runId: uuid("run_id").references(() => agentRuns.id, { onDelete: "set null" }),
  briefDate: text("brief_date").notNull(),            // YYYY-MM-DD in user tz
  headline: text("headline").notNull(),
  itemsJson: jsonb("items_json").notNull(),           // Brief schema (validated) + merged_signal member ids
  skippedCount: integer("skipped_count").notNull().default(0),
  skippedSummary: text("skipped_summary"),
  carryoverNote: text("carryover_note"),
  degraded: boolean("degraded").notNull().default(false), // guardrails L5 banner
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("briefs_user_date").on(t.userId, t.briefDate)]);

export const actions = pgTable("actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  briefId: uuid("brief_id").references(() => briefs.id, { onDelete: "cascade" }),
  signalId: uuid("signal_id").references(() => signals.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  kind: actionKind("kind").notNull(),
  status: actionStatus("status").notNull().default("proposed"),
  draftSubject: text("draft_subject"),
  draftBody: text("draft_body").notNull(),
  draftMeta: jsonb("draft_meta"),                     // ActionDraft (facts_used, confidence…)
  wasEdited: boolean("was_edited").notNull().default(false), // quality KPI
  gateFailures: jsonb("gate_failures").$type<string[]>().default([]),
  usedTemplateFallback: boolean("used_template_fallback").notNull().default(false),
  humanApprovedAt: timestamp("human_approved_at", { withTimezone: true }),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  executionRef: text("execution_ref"),                // gmail message id of the send
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("actions_user_status").on(t.userId, t.status)]);

/* Helm's own billing (week 3) */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("none"),   // none|trialing|active|past_due|canceled
  priceId: text("price_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
