import { useState } from "react";
import { Check, ChevronDown, ChevronUp, RotateCcw, X } from "lucide-react";
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
    <Card className="space-y-3 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill label={insight.insightType} />
            <InsightSeverity severity={insight.severity} />
            <StatusPill label={insight.status} tone={getStatusTone(insight.status)} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{insight.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{insight.summary}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {insight.status === "open" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 border-emerald-300 px-0 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                disabled={actionsDisabled}
                onClick={onReview}
                aria-label={`Mark reviewed: ${insight.title}`}
                title="Mark reviewed"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {insight.status === "open" || insight.status === "reviewed" ? (
              <Button
                type="button"
                variant="danger-outline"
                size="sm"
                className="h-7 w-7 px-0"
                disabled={actionsDisabled}
                onClick={onDismiss}
                aria-label={`Dismiss: ${insight.title}`}
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {insight.status === "dismissed" || insight.status === "reviewed" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 px-0"
                disabled={actionsDisabled}
                onClick={onReopen}
                aria-label={`Reopen: ${insight.title}`}
                title="Reopen"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
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
            className="-ml-3 h-7 text-xs text-muted-foreground"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls={`${insight.insightKey}-evidence`}
            aria-label={`${detailsOpen ? "Hide" : "View"} evidence: ${insight.title}`}
          >
            {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {detailsOpen ? "Hide evidence" : "View evidence"}
          </Button>
          {detailsOpen ? (
            <div id={`${insight.insightKey}-evidence`} className="mt-2">
              <InsightEvidence evidence={insight.evidence} />
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
