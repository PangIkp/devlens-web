import type { PullRequestDetail } from "@/features/pull-requests/pull-requests.schemas";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/status-pill";
import { formatDateTime } from "@/components/repositories/repository-utils";

function getPullRequestTone(state: string) {
  if (state === "merged") {
    return "success" as const;
  }

  if (state === "closed") {
    return "danger" as const;
  }

  return "info" as const;
}

export function PullRequestDetailPanel({ pullRequest }: { pullRequest: PullRequestDetail }) {
  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={pullRequest.state} tone={getPullRequestTone(pullRequest.state)} />
          {pullRequest.isDraft ? <StatusPill label="draft" /> : null}
          <span className="text-sm text-muted-foreground">
            {pullRequest.repository.fullName} • #{pullRequest.number}
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{pullRequest.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Opened by {pullRequest.author} on {formatDateTime(pullRequest.createdAt)}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Files changed</p>
            <p className="mt-2 text-2xl font-semibold">{pullRequest.filesChanged}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Additions</p>
            <p className="mt-2 text-2xl font-semibold">+{pullRequest.additions}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Deletions</p>
            <p className="mt-2 text-2xl font-semibold">-{pullRequest.deletions}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold">Reviews</h3>
        {pullRequest.reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No review events were returned for this pull request.</p>
        ) : (
          <div className="space-y-3">
            {pullRequest.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border/70 bg-background/70 p-4 text-sm">
                <p className="font-medium">{review.reviewer}</p>
                <p className="mt-1 text-muted-foreground">{review.state}</p>
                <p className="mt-1 text-muted-foreground">Submitted {formatDateTime(review.reviewSubmittedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold">Changed files</h3>
        <div className="space-y-3">
          {pullRequest.fileChanges.map((fileChange) => (
            <div key={fileChange.id} className="rounded-xl border border-border/70 bg-background/70 p-4 text-sm">
              <p className="break-all font-mono">{fileChange.filePath}</p>
              <p className="mt-2 text-muted-foreground">
                +{fileChange.additions} / -{fileChange.deletions} across {fileChange.commitCount} commits
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
