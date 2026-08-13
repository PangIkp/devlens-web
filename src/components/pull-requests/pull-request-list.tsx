import { Link } from "@tanstack/react-router";
import type { PullRequestListItem } from "@/features/pull-requests/pull-requests.schemas";
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

export function PullRequestList({ pullRequests }: { pullRequests: PullRequestListItem[] }) {
  return (
    <div className="space-y-4">
      {pullRequests.map((pullRequest) => (
        <div key={pullRequest.id} className="rounded-2xl border border-border/80 bg-card/80 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={pullRequest.state} tone={getPullRequestTone(pullRequest.state)} />
                {pullRequest.isDraft ? <StatusPill label="draft" tone="neutral" /> : null}
                <span className="text-xs text-muted-foreground">#{pullRequest.number}</span>
              </div>
              <Link
                to="/pull-requests/$pullRequestId"
                params={{ pullRequestId: pullRequest.id }}
                className="text-lg font-semibold hover:underline"
              >
                {pullRequest.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {pullRequest.repository.fullName} • {pullRequest.author}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{formatDateTime(pullRequest.createdAt)}</p>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <p>{pullRequest.filesChanged} files changed</p>
            <p>+{pullRequest.additions} additions</p>
            <p>-{pullRequest.deletions} deletions</p>
          </div>
        </div>
      ))}
    </div>
  );
}
