"use client";

import { useId } from "react";
import type { BriefItem } from "../lib/sandbox/types";

interface BriefCardProps {
  item: BriefItem;
  isExpanded: boolean;
  isApproved: boolean;
  onToggle: (itemId: string) => void;
  onApprove: (itemId: string) => void;
}

const sourceClass = {
  Gmail: "source-gmail",
  Stripe: "source-stripe",
  "Call note": "source-note",
  Watchlist: "source-watchlist",
} as const;

export function BriefCard({ item, isExpanded, isApproved, onToggle, onApprove }: BriefCardProps) {
  const panelId = useId();

  return (
    <article className="brief-card" data-urgency={item.urgency}>
      <div className="brief-card__topline">
        <span className="rank" aria-label={`Rank ${item.rank}`}>{String(item.rank).padStart(2, "0")}</span>
        <span className="kind-label">{item.kind}</span>
        <span className={`urgency urgency-${item.urgency}`}>Urgency {item.urgency}</span>
      </div>

      <div className="brief-card__content">
        <div>
          <h2>{item.title}</h2>
          <p className="why-now">{item.whyNow}</p>
          <p className="narrative">{item.narrative}</p>
        </div>

        <div className="brief-card__actions">
          <button
            className="text-button"
            type="button"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            onClick={() => onToggle(item.id)}
          >
            {isExpanded ? "Hide evidence" : "Why this?"}
          </button>
          <button
            className={isApproved ? "approval-button approval-button--approved" : "approval-button"}
            type="button"
            disabled={isApproved}
            onClick={() => onApprove(item.id)}
          >
            {isApproved ? "Approved in sandbox" : item.action.label}
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="brief-card__detail" id={panelId}>
          <section aria-labelledby={`${panelId}-evidence`}>
            <div className="detail-heading">
              <p id={`${panelId}-evidence`}>Evidence trail</p>
              <span>{item.evidence.length} sources</span>
            </div>
            <ol className="evidence-list">
              {item.evidence.map((evidence) => (
                <li key={evidence.id}>
                  <span className={`source-badge ${sourceClass[evidence.source]}`}>{evidence.source}</span>
                  <div>
                    <strong>{evidence.label}</strong>
                    <p>“{evidence.excerpt}”</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="draft" aria-labelledby={`${panelId}-draft`}>
            <div className="detail-heading">
              <p id={`${panelId}-draft`}>Proposed action</p>
              <span>{item.action.kind.replaceAll("_", " ")}</span>
            </div>
            {item.draft.subject ? <p className="draft-subject">Subject: {item.draft.subject}</p> : null}
            <p className="draft-body">{item.draft.body}</p>
            <p className="draft-footnote">
              {isApproved
                ? "Recorded as a simulated approval. No email was sent."
                : "Approval is simulated in this fixture. Nothing can send from the sandbox."}
            </p>
          </section>
        </div>
      ) : null}
    </article>
  );
}
