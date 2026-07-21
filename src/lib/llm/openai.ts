import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getSandboxBrief } from "../sandbox/pipeline";
import type { SandboxBrief } from "../sandbox/types";

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

type BriefCopy = z.infer<typeof BriefCopy>;
type BriefItemId = z.infer<typeof BriefItemId>;

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

function validateCopyShape(copy: BriefCopy, brief: SandboxBrief): void {
  const expectedIds = new Set(brief.items.map((item) => asBriefItemId(item.id)));
  const returnedIds = new Set(copy.items.map((item) => item.id));
  if (returnedIds.size !== expectedIds.size || [...expectedIds].some((id) => !returnedIds.has(id))) {
    throw new Error("Structured brief copy omitted or duplicated an action card.");
  }
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

  validateCopyShape(response.output_parsed, brief);
  const copyById = new Map(response.output_parsed.items.map((item) => [item.id, item]));

  return {
    ...brief,
    headline: response.output_parsed.headline,
    items: brief.items.map((item) => {
      const copy = copyById.get(asBriefItemId(item.id));
      if (!copy) throw new Error(`Missing refreshed copy for ${item.id}`);
      return { ...item, whyNow: copy.whyNow, narrative: copy.narrative };
    }),
    agentRun: {
      ...brief.agentRun,
      provider: `Live GPT-5.6 Responses API refresh · response ${response.id}`,
      costUsd: "Live usage — inspect OpenAI dashboard",
      duration: "Live request",
      steps: brief.agentRun.steps.map((step) =>
        step.id === "brief"
          ? { ...step, detail: "GPT-5.6 refreshed the brief copy after deterministic ranking and guardrails." }
          : step,
      ),
    },
  };
}
