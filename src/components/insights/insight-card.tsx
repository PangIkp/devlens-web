import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/status-pill";
import { InsightEvidence } from "@/components/insights/insight-evidence";
import { InsightSeverity } from "@/components/insights/insight-severity";
import type { Insight } from "@/features/insights/insights.schemas";
import { formatDateTime } from "@/components/repositories/repository-utils";

function formatInsightType(type: Insight["insightType"]) {
  return type.replaceAll("_", " ");
}

function getStatusTone(status: Insight["status"]) {
  if (status === "reviewed") {
    return "info" as const;
  }

  if (status === "dismissed") {
    return "neutral" as const;
  }

  return "warning" as const;
}

export function InsightCard({
  insight,
  onReview,
  onDismiss,
  onReopen,
  actionsDisabled = false,
}: {
  insight: Insight;
  onReview?: () => void;
  onDismiss?: () => void;
  onReopen?: () => void;
  actionsDisabled?: boolean;
}) {
  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={formatInsightType(insight.insightType)} />
            <InsightSeverity severity={insight.severity} />
            <StatusPill label={insight.status} tone={getStatusTone(insight.status)} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{insight.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{insight.summary}</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Detected {formatDateTime(insight.detectedAt)}</p>
          <p>{insight.repositoryName ?? "Organization-level insight"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">What happened</p>
          <p className="mt-2 text-sm">{insight.title}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Where</p>
          <p className="mt-2 text-sm">{insight.repositoryName ?? "Across the organization"}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Current status</p>
          <p className="mt-2 text-sm">{insight.status}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Evidence</p>
        <InsightEvidence evidence={insight.evidence} />
      </div>

      <div className="flex flex-wrap gap-3">
        {insight.status === "open" ? (
          <>
            <Button type="button" variant="outline" disabled={actionsDisabled} onClick={onReview}>
              Mark reviewed
            </Button>
            <Button type="button" variant="outline" disabled={actionsDisabled} onClick={onDismiss}>
              Dismiss
            </Button>
          </>
        ) : null}
        {insight.status === "dismissed" ? (
          <Button type="button" variant="outline" disabled={actionsDisabled} onClick={onReopen}>
            Reopen
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
