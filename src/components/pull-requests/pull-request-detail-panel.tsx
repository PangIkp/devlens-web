import type { PullRequestDetail } from "@/features/pull-requests/pull-requests.schemas";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/status-pill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PullRequestTimeline } from "@/components/pull-requests/pull-request-timeline";
import { getPullRequestTone, getReviewStateTone, getRiskTone } from "@/components/pull-requests/pull-request-utils";
import { formatDateTime } from "@/components/repositories/repository-utils";
import { formatDurationMinutes } from "@/lib/formatters";

export function PullRequestDetailPanel({ pullRequest }: { pullRequest: PullRequestDetail }) {
  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={pullRequest.state} tone={getPullRequestTone(pullRequest.state)} />
          {pullRequest.isDraft ? <StatusPill label="draft" /> : null}
          <StatusPill label={`${pullRequest.riskIndicator.level} risk`} tone={getRiskTone(pullRequest.riskIndicator.level)} />
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
        {pullRequest.riskIndicator.reasons.length > 0 ? (
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {pullRequest.riskIndicator.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
        <div className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Files changed</p>
            <p className="mt-2 text-2xl font-semibold">{pullRequest.filesChanged}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Additions</p>
            <p className="mt-2 text-2xl font-semibold">+{pullRequest.additions}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Deletions</p>
            <p className="mt-2 text-2xl font-semibold">-{pullRequest.deletions}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Cycle time</p>
            <p className="mt-2 text-2xl font-semibold">{formatDurationMinutes(pullRequest.cycleTimeMinutes)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Review wait time</p>
            <p className="mt-2 text-2xl font-semibold">{formatDurationMinutes(pullRequest.reviewWaitMinutes)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({pullRequest.reviews.length})</TabsTrigger>
            <TabsTrigger value="files">Changed files ({pullRequest.fileChanges.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <PullRequestTimeline events={pullRequest.timeline} />
          </TabsContent>

          <TabsContent value="reviews">
            {pullRequest.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No review events were returned for this pull request.</p>
            ) : (
              <div className="divide-y divide-border/60 rounded-xl border border-border/70">
                {pullRequest.reviews.map((review) => (
                  <div key={review.id} className="space-y-1 p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{review.reviewer}</p>
                      <StatusPill label={review.state.toLowerCase()} tone={getReviewStateTone(review.state)} />
                    </div>
                    <p className="text-muted-foreground">Submitted {formatDateTime(review.reviewSubmittedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files">
            {pullRequest.fileChanges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No changed files were returned for this pull request.</p>
            ) : (
              <div className="divide-y divide-border/60 rounded-xl border border-border/70">
                {pullRequest.fileChanges.map((fileChange) => (
                  <div key={fileChange.id} className="p-4 text-sm">
                    <p className="break-all font-mono">{fileChange.filePath}</p>
                    <p className="mt-2 text-muted-foreground">
                      +{fileChange.additions} / -{fileChange.deletions} across {fileChange.commitCount} commits
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
