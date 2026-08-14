import type { Insight } from "@/features/insights/insights.schemas";
import { StatusPill } from "@/components/shared/status-pill";

const severityTone: Record<Insight["severity"], "neutral" | "info" | "warning" | "danger"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

export function InsightSeverity({ severity }: { severity: Insight["severity"] }) {
  return <StatusPill label={severity} tone={severityTone[severity]} />;
}
