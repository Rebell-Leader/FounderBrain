import { ActivityTimeline } from "../../components/activity-timeline";
import { getSandboxBrief } from "../../lib/sandbox/pipeline";

export const metadata = {
  title: "Agent activity",
};

export default function ActivityPage() {
  const brief = getSandboxBrief();

  return (
    <main className="shell activity-shell">
      <nav className="top-nav" aria-label="Helm navigation">
        <a className="brand" href="/sandbox" aria-label="Helm sandbox home">
          <span className="brand-mark">H</span>
          <span>Helm</span>
        </a>
        <div className="nav-links">
          <a className="nav-link" href="/sandbox">Today</a>
          <a className="nav-link nav-link--active" href="/activity">Agent activity</a>
        </div>
        <span className="demo-chip">Sandbox · fictional data</span>
      </nav>

      <header className="activity-header">
        <p className="eyebrow">Pipeline trace</p>
        <h1>Why this morning’s brief is safe to trust.</h1>
        <p>Every priority in the sandbox is traced to a fixture, a deterministic rule, or a guardrail decision.</p>
      </header>

      <section className="run-metrics" aria-label="Agent run metrics">
        <div><span>Run ID</span><strong>{brief.agentRun.id}</strong></div>
        <div><span>Runtime</span><strong>{brief.agentRun.duration}</strong></div>
        <div><span>Model cost</span><strong>{brief.agentRun.costUsd}</strong></div>
        <div><span>Run state</span><strong>{brief.agentRun.degraded ? "Degraded" : "Complete"}</strong></div>
      </section>

      <p className="provider-note">{brief.agentRun.provider}</p>
      <ActivityTimeline brief={brief} />

      <aside className="activity-callout">
        <p className="eyebrow">Safety boundary</p>
        <p>Sandbox actions never invoke Gmail, Stripe, or a live web-search request. They are isolated, inspectable fixture behavior.</p>
      </aside>
    </main>
  );
}
