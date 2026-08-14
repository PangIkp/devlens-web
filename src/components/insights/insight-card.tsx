import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/status-pill";
import { InsightEvidence } from "@/components/insights/insight-evidence";
import { InsightSeverity } from "@/components/insights/insight-severity";
import type { Insight } from "@/features/insights/insights.schemas";
import { formatDateTime } from "@/components/repositories/repository-utils";

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasEvidence = Boolean(insight.evidence && Object.keys(insight.evidence).length > 0);

  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={insight.insightType} />
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

      {hasEvidence ? (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-3 text-muted-foreground"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls={`${insight.insightKey}-evidence`}
            aria-label={`${detailsOpen ? "Hide" : "View"} evidence: ${insight.title}`}
          >
            {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {detailsOpen ? "Hide evidence" : "View evidence"}
          </Button>
          {detailsOpen ? (
            <div id={`${insight.insightKey}-evidence`} className="mt-3">
              <InsightEvidence evidence={insight.evidence} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {insight.status === "open" ? (
          <Button
            type="button"
            variant="outline"
            disabled={actionsDisabled}
            onClick={onReview}
            aria-label={`Mark reviewed: ${insight.title}`}
          >
            Mark reviewed
          </Button>
        ) : null}
        {insight.status === "open" || insight.status === "reviewed" ? (
          <Button
            type="button"
            variant="outline"
            disabled={actionsDisabled}
            onClick={onDismiss}
            aria-label={`Dismiss: ${insight.title}`}
          >
            Dismiss
          </Button>
        ) : null}
        {insight.status === "dismissed" || insight.status === "reviewed" ? (
          <Button
            type="button"
            variant="outline"
            disabled={actionsDisabled}
            onClick={onReopen}
            aria-label={`Reopen: ${insight.title}`}
          >
            Reopen
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
