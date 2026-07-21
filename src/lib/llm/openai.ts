import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { promiseFirewall, verifyNumbersInCorpus } from "../gates";
import { fixtureTimelineForContact } from "../sandbox/fixtures";
import { getSandboxBrief } from "../sandbox/pipeline";
import type { BriefItem, SandboxBrief } from "../sandbox/types";

const briefItemIds = ["datawise", "shipfleet", "kadenz", "subtitly", "icp-thread"] as const;
const BriefItemId = z.enum(briefItemIds);

const BriefCopy = z.object({
  headline: z.string().min(20).max(180),
  items: z.array(z.object({
    id: BriefItemId,
    whyNow: z.string().min(8).max(160),
    narrative: z.string().min(20).max(560),
  })).length(5),
});

export type SandboxBriefCopy = z.infer<typeof BriefCopy>;
type BriefItemId = z.infer<typeof BriefItemId>;

export interface CopyRejection {
  field: "headline" | "whyNow" | "narrative";
  itemId: BriefItemId | null;
  gate: "promise firewall" | "number-in-evidence check";
  code: string;
  detail: string;
}

export class OpenAIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIConfigurationError";
  }
}

export function hasOpenAIConfiguration(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function loadPrompt(name: "brief-compose.md"): Promise<string> {
  return readFile(join(process.cwd(), "prompts", name), "utf8");
}

export function buildSandboxCopyInput(brief: SandboxBrief): string {
  return JSON.stringify({
    founder: brief.founderName,
    company: brief.companyName,
    date: brief.anchorDate,
    rule: "Return copy only. Do not change ranks, action kinds, evidence, recipients, drafts, or add facts.",
    items: brief.items.map((item) => ({
      id: item.id,
      rank: item.rank,
      title: item.title,
      why_now: item.whyNow,
      narrative: item.narrative,
      evidence: item.evidence.map((evidence) => ({
        source: evidence.source,
        excerpt: evidence.excerpt,
      })),
    })),
    skipped_count: brief.skippedCount,
    skipped_summary: brief.skippedSummary,
  });
}

function asBriefItemId(id: string): BriefItemId {
  if (!briefItemIds.includes(id as BriefItemId)) {
    throw new Error(`Unexpected sandbox action id: ${id}`);
  }
  return id as BriefItemId;
}

function validateCopyShape(copy: SandboxBriefCopy, brief: SandboxBrief): void {
  const expectedIds = new Set(brief.items.map((item) => asBriefItemId(item.id)));
  const returnedIds = new Set(copy.items.map((item) => item.id));
  if (returnedIds.size !== expectedIds.size || [...expectedIds].some((id) => !returnedIds.has(id))) {
    throw new Error("Structured brief copy omitted or duplicated an action card.");
  }
}

function evidenceCorpus(item: BriefItem): string {
  return [...item.evidence.map((evidence) => evidence.excerpt), item.title, ...item.mustReference].join(" ");
}

function founderAuthoredCorpus(item: BriefItem): string {
  if (!item.contactId) return "";
  return fixtureTimelineForContact(item.contactId)
    .filter((entry) => entry.authoredByFounder)
    .map((entry) => entry.text)
    .join(" ");
}

function rejectedCopyField(
  text: string,
  corpus: string,
  founderAuthored: string,
  field: CopyRejection["field"],
  itemId: BriefItemId | null,
): CopyRejection | null {
  const promiseResult = promiseFirewall(text, founderAuthored);
  const numberResult = verifyNumbersInCorpus(text, corpus);

  if (!promiseResult.ok) {
    return {
      field,
      itemId,
      gate: "promise firewall",
      code: promiseResult.code,
      detail: promiseResult.detail,
    };
  }
  if (!numberResult.ok) {
    return {
      field,
      itemId,
      gate: "number-in-evidence check",
      code: numberResult.code,
      detail: numberResult.detail,
    };
  }
  return null;
}

function rejectionDetail(rejection: CopyRejection): string {
  const target = rejection.itemId ? `${rejection.field} for ${rejection.itemId}` : rejection.field;
  return `${target} by the ${rejection.gate} (${rejection.code}: ${rejection.detail})`;
}

/**
 * Applies deterministic safety gates to all model-authored copy fields. A bad
 * field degrades to its frozen sandbox equivalent; it never fails the demo run.
 */
export function applyCopyGates(
  copy: SandboxBriefCopy,
  brief: SandboxBrief,
): { brief: SandboxBrief; rejections: CopyRejection[] } {
  validateCopyShape(copy, brief);
  const rejections: CopyRejection[] = [];
  const headlineRejection = rejectedCopyField(
    copy.headline,
    brief.items.flatMap((item) => item.evidence.map((evidence) => evidence.excerpt)).join(" "),
    brief.items.map(founderAuthoredCorpus).join(" "),
    "headline",
    null,
  );
  if (headlineRejection) rejections.push(headlineRejection);

  const copyById = new Map(copy.items.map((item) => [item.id, item]));
  const items = brief.items.map((item) => {
    const itemId = asBriefItemId(item.id);
    const refreshed = copyById.get(itemId);
    if (!refreshed) throw new Error(`Missing refreshed copy for ${item.id}`);

    const corpus = evidenceCorpus(item);
    const founderAuthored = founderAuthoredCorpus(item);
    const whyNowRejection = rejectedCopyField(
      refreshed.whyNow,
      corpus,
      founderAuthored,
      "whyNow",
      itemId,
    );
    const narrativeRejection = rejectedCopyField(
      refreshed.narrative,
      corpus,
      founderAuthored,
      "narrative",
      itemId,
    );
    if (whyNowRejection) rejections.push(whyNowRejection);
    if (narrativeRejection) rejections.push(narrativeRejection);

    return {
      ...item,
      whyNow: whyNowRejection ? item.whyNow : refreshed.whyNow,
      narrative: narrativeRejection ? item.narrative : refreshed.narrative,
    };
  });

  const degraded = brief.agentRun.degraded || rejections.length > 0;
  return {
    brief: {
      ...brief,
      headline: headlineRejection ? brief.headline : copy.headline,
      items,
      agentRun: {
        ...brief.agentRun,
        degraded,
        steps: rejections.length === 0
          ? brief.agentRun.steps
          : brief.agentRun.steps.map((step) =>
            step.id === "brief"
              ? {
                ...step,
                detail: `GPT-5.6 copy rejected: ${rejections.map(rejectionDetail).join("; ")}; showing deterministic copy.`,
              }
              : step,
          ),
      },
    },
    rejections,
  };
}

export async function refreshSandboxBriefWithOpenAI(): Promise<SandboxBrief> {
  if (!hasOpenAIConfiguration()) {
    throw new OpenAIConfigurationError("OPENAI_API_KEY is required to run a live sandbox refresh.");
  }

  const brief = getSandboxBrief();
  const [prompt, input] = await Promise.all([
    loadPrompt("brief-compose.md"),
    Promise.resolve(buildSandboxCopyInput(brief)),
  ]);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL ?? "gpt-5.6",
    instructions: `${prompt}\n\nSANDBOX CONSTRAINT: Keep the exact five item ids in order. This is copy refresh only; all facts must appear in the supplied evidence.`,
    input,
    reasoning: { effort: "low" },
    text: { format: zodTextFormat(BriefCopy, "sandbox_brief_copy") },
  });

  if (!response.output_parsed) {
    throw new Error("The OpenAI response did not contain structured brief copy.");
  }

  const gated = applyCopyGates(response.output_parsed, brief);

  return {
    ...gated.brief,
    agentRun: {
      ...gated.brief.agentRun,
      provider: `Live GPT-5.6 Responses API refresh · response ${response.id}`,
      costUsd: "Live usage — inspect OpenAI dashboard",
      duration: "Live request",
      steps: gated.brief.agentRun.steps.map((step) =>
        step.id === "brief" && gated.rejections.length === 0
          ? { ...step, detail: "GPT-5.6 refreshed the brief copy after deterministic ranking and guardrails." }
          : step,
      ),
    },
  };
}
