import type { SandboxBrief } from "../lib/sandbox/types";

interface ActivityTimelineProps {
  brief: SandboxBrief;
}

export function ActivityTimeline({ brief }: ActivityTimelineProps) {
  return (
    <ol className="activity-list">
      {brief.agentRun.steps.map((step, index) => (
        <li key={step.id} className="activity-step">
          <span className="step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div className="step-body">
            <div className="step-heading">
              <h2>{step.label}</h2>
              <span className={`step-status step-status--${step.status}`}>{step.status}</span>
            </div>
            <p>{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
