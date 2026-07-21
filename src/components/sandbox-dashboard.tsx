"use client";

import { useState } from "react";
import type { SandboxBrief } from "../lib/sandbox/types";
import { BriefCard } from "./brief-card";

interface SandboxDashboardProps {
  brief: SandboxBrief;
}

export function SandboxDashboard({ brief }: SandboxDashboardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(brief.items[0]?.id ?? null);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  function toggleItem(itemId: string): void {
    setExpandedId((current) => (current === itemId ? null : itemId));
  }

  function approveItem(itemId: string): void {
    setApprovedIds((current) => (current.includes(itemId) ? current : [...current, itemId]));
  }

  return (
    <main className="shell">
      <nav className="top-nav" aria-label="Helm navigation">
        <a className="brand" href="/sandbox" aria-label="Helm sandbox home">
          <span className="brand-mark">H</span>
          <span>Helm</span>
        </a>
        <div className="nav-links">
          <a className="nav-link nav-link--active" href="/sandbox">Today</a>
          <a className="nav-link" href="/activity">Agent activity</a>
        </div>
        <span className="demo-chip">Sandbox · fictional data</span>
      </nav>

      <header className="brief-header">
        <div>
          <p className="eyebrow">Tuesday, July 21 · {brief.companyName}</p>
          <h1>{brief.headline}</h1>
          <p className="brief-summary">{brief.summary}</p>
        </div>
        <aside className="run-status" aria-label="Sandbox run status">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>Brief ready</strong>
            <p>Precomputed demo · {brief.agentRun.duration}</p>
          </div>
        </aside>
      </header>

      <section className="brief-list" aria-label="Today's action cards">
        <div className="section-label">
          <p>Today’s moves</p>
          <span>{brief.items.length} priority actions</span>
        </div>
        {brief.items.map((item) => (
          <BriefCard
            key={item.id}
            item={item}
            isExpanded={expandedId === item.id}
            isApproved={approvedIds.includes(item.id)}
            onToggle={toggleItem}
            onApprove={approveItem}
          />
        ))}
      </section>

      <section className="below-line" aria-label="Lower priority signals">
        <div>
          <p className="eyebrow">Below the line</p>
          <h2>And {brief.skippedCount} lower-priority signals</h2>
          <p>{brief.skippedSummary}</p>
        </div>
        <a href="/activity">Inspect the guardrails <span aria-hidden="true">→</span></a>
      </section>

      <p className="sandbox-disclaimer" role="status">
        This is a deterministic LingoLoop fixture. Approvals are local UI state only; no external account is connected.
      </p>
    </main>
  );
}
