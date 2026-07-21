import type { ActionDraft } from "../gates";

export type SignalSource = "gmail" | "stripe" | "notes" | "watchlist";

export type ActionKind =
  | "email_reply"
  | "email_followup"
  | "social_post_draft"
  | "task";

export interface Evidence {
  id: string;
  source: "Gmail" | "Stripe" | "Call note" | "Watchlist";
  label: string;
  occurredAt: string;
  excerpt: string;
}

export interface CandidateSignal {
  id: string;
  storyline: "S1" | "S2" | "S3" | "S4" | "S5" | "noise";
  kind: string;
  source: SignalSource;
  baseUrgency: number;
  contactId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  companyKey: string | null;
  watchContactEdge: string[];
  evidence: Evidence[];
}

export interface BriefItem {
  id: string;
  rank: number;
  kind: string;
  urgency: number;
  title: string;
  whyNow: string;
  narrative: string;
  evidence: Evidence[];
  action: {
    kind: ActionKind;
    label: string;
    recipient: string | null;
  };
  draft: ActionDraft;
  mustReference: string[];
  contactId: string | null;
}

export interface AgentStep {
  id: string;
  label: string;
  detail: string;
  kind: "ingest" | "rules" | "model" | "guardrail" | "brief" | "execution";
  status: "complete" | "protected" | "simulated";
}

export interface SandboxBrief {
  companyName: string;
  founderName: string;
  anchorDate: string;
  headline: string;
  summary: string;
  skippedCount: number;
  skippedSummary: string;
  items: BriefItem[];
  agentRun: {
    id: string;
    provider: string;
    costUsd: string;
    duration: string;
    degraded: boolean;
    steps: AgentStep[];
  };
}
