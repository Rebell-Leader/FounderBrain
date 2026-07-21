import { z } from "zod";

import callNotesJson from "../../../sample-data/call-notes.json";
import contactsJson from "../../../sample-data/contacts.json";
import emailsJson from "../../../sample-data/emails.json";
import manifestJson from "../../../sample-data/manifest.json";
import stripeEventsJson from "../../../sample-data/stripe-events.json";
import userJson from "../../../sample-data/user.json";
import watchlistJson from "../../../sample-data/watchlist.json";
import webFixturesJson from "../../../sample-data/web-fixtures.json";
import type { TimelineEntry } from "../gates";

const Storyline = z.enum(["S1", "S2", "S3", "S4", "S5", "noise"]);
const IsoTimestamp = z.string().datetime({ offset: true });

const UserFixture = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  companyName: z.string().min(1),
  anchorDate: z.string().date(),
  timezone: z.string().min(1),
  productDescription: z.string().min(1),
  icpDescription: z.string().min(1),
}).strict();

const ContactFixture = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  companyKey: z.string().min(1),
  relationship: z.enum(["customer", "lead"]),
  planEurMonthly: z.number().int().positive().nullable(),
}).strict();

const EmailFixture = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  contactId: z.string().min(1).nullable(),
  direction: z.enum(["inbound", "outbound"]),
  occurredAt: IsoTimestamp,
  subject: z.string().min(1),
  body: z.string().min(1),
  category: z.enum(["customer_thread", "lead_thread", "inbound_interest", "newsletter", "vendor_pitch"]),
  requiresReply: z.boolean(),
  storyline: Storyline,
  purpose: z.enum(["pricing"]).optional(),
}).strict();

const CallNoteFixture = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
  occurredAt: IsoTimestamp,
  text: z.string().min(1),
  tags: z.array(z.string().min(1)),
  storyline: Storyline,
}).strict();

const StripeEventFixture = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
  occurredAt: IsoTimestamp,
  type: z.enum(["payment_failed", "payment_succeeded"]),
  amountEur: z.number().positive(),
  description: z.string().min(1),
  storyline: Storyline,
}).strict();

const WebFixture = z.object({
  id: z.string().min(1),
  occurredAt: IsoTimestamp,
  kind: z.enum(["competitor_result", "community_thread"]),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  url: z.string().url(),
  intent: z.enum(["competitor_move", "icp_thread", "noise"]),
  storyline: Storyline,
}).strict();

const WatchlistFixture = z.object({
  id: z.string().min(1),
  kind: z.enum(["competitor", "keyword"]),
  value: z.string().min(1),
  allowedDomains: z.array(z.string().min(1)).min(1),
}).strict();

const ManifestExpectation = z.object({
  storyline: z.enum(["S1", "S2", "S3", "S4", "S5"]),
  candidateIds: z.array(z.string().min(1)).min(1),
  merged: z.boolean(),
  rank: z.number().int().positive(),
  anchors: z.array(z.string().min(1)).min(1),
}).strict();

const ManifestFixture = z.object({
  version: z.string().min(1),
  fixtureId: z.string().min(1),
  anchorDate: z.string().date(),
  expectedBrief: z.object({
    itemIds: z.array(z.string().min(1)).min(1),
    topItem: z.string().min(1),
    skippedCount: z.number().int().nonnegative(),
    totalCandidates: z.number().int().positive(),
  }).strict(),
  expectations: z.array(ManifestExpectation).length(5),
}).strict();

export const FixtureBundleSchema = z.object({
  user: UserFixture,
  contacts: z.array(ContactFixture).min(1),
  emails: z.array(EmailFixture).min(1),
  callNotes: z.array(CallNoteFixture).min(1),
  stripeEvents: z.array(StripeEventFixture).min(1),
  webFixtures: z.array(WebFixture).min(1),
  watchlist: z.array(WatchlistFixture).min(1),
  manifest: ManifestFixture,
}).strict();

export type FixtureBundle = z.infer<typeof FixtureBundleSchema>;

function ensureUniqueIds(ids: string[], label: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Fixture validation failed: duplicate ${label} ids`);
  }
}

/** Parse and validate a fixture bundle before it reaches any signal rule. */
export function parseFixtureBundle(input: unknown): FixtureBundle {
  const bundle = FixtureBundleSchema.parse(input);
  const contactsById = new Set(bundle.contacts.map((contact) => contact.id));
  const allRecords = [...bundle.emails, ...bundle.callNotes, ...bundle.stripeEvents];

  ensureUniqueIds(bundle.contacts.map((contact) => contact.id), "contact");
  ensureUniqueIds(
    [...bundle.emails, ...bundle.callNotes, ...bundle.stripeEvents, ...bundle.webFixtures].map((record) => record.id),
    "source record",
  );

  for (const record of allRecords) {
    if (record.contactId && !contactsById.has(record.contactId)) {
      throw new Error(`Fixture validation failed: ${record.id} references unknown contact ${record.contactId}`);
    }
  }

  if (bundle.user.anchorDate !== bundle.manifest.anchorDate) {
    throw new Error("Fixture validation failed: user and manifest anchor dates differ");
  }

  const corpus = [
    ...bundle.emails.map((email) => `${email.subject} ${email.body}`),
    ...bundle.callNotes.map((note) => note.text),
    ...bundle.stripeEvents.map((event) => event.description),
    ...bundle.webFixtures.flatMap((fixture) => [fixture.title, fixture.excerpt]),
  ].join(" ").toLowerCase();
  const missingAnchors = bundle.manifest.expectations.flatMap((expectation) =>
    expectation.anchors
      .filter((anchor) => !corpus.includes(anchor.toLowerCase()))
      .map((anchor) => `${expectation.storyline}: ${anchor}`),
  );

  if (missingAnchors.length) {
    throw new Error(`Fixture validation failed: missing planted anchors (${missingAnchors.join(", ")})`);
  }

  return bundle;
}

const rawFixtureBundle = {
  user: userJson,
  contacts: contactsJson,
  emails: emailsJson,
  callNotes: callNotesJson,
  stripeEvents: stripeEventsJson,
  webFixtures: webFixturesJson,
  watchlist: watchlistJson,
  manifest: manifestJson,
};

/** Frozen local fixture data used by the judge-safe sandbox and golden tests. */
export const sandboxFixtures = parseFixtureBundle(rawFixtureBundle);

export function fixtureTimelineForContact(contactId: string): TimelineEntry[] {
  const entries: Array<TimelineEntry & { occurredAt: string }> = [
    ...sandboxFixtures.callNotes
      .filter((note) => note.contactId === contactId)
      .map((note) => ({ id: note.id, text: note.text, authoredByFounder: false, occurredAt: note.occurredAt })),
    ...sandboxFixtures.emails
      .filter((email) => email.contactId === contactId)
      .map((email) => ({
        id: email.id,
        text: `${email.subject}: ${email.body}`,
        authoredByFounder: email.direction === "outbound",
        occurredAt: email.occurredAt,
      })),
    ...sandboxFixtures.stripeEvents
      .filter((event) => event.contactId === contactId)
      .map((event) => ({ id: event.id, text: event.description, authoredByFounder: false, occurredAt: event.occurredAt })),
  ];

  return entries
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
    .map(({ occurredAt: _occurredAt, ...entry }) => entry);
}
