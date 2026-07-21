import { SandboxDashboard } from "../../components/sandbox-dashboard";
import { getSandboxBrief } from "../../lib/sandbox/pipeline";

export const metadata = {
  title: "Sandbox",
};

export default function SandboxPage() {
  return <SandboxDashboard brief={getSandboxBrief()} />;
}
