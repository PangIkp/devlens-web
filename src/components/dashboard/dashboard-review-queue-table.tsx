import type { ReviewQueueItem } from "@/features/dashboard/dashboard.schemas";
import { formatDurationMinutes } from "@/lib/formatters";

export function DashboardReviewQueueTable({ items }: { items: ReviewQueueItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80">
      <div className="hidden bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground md:grid md:grid-cols-[3fr_1.2fr_1fr]">
        <span>Pull request</span>
        <span>Author</span>
        <span>Waiting</span>
      </div>
      <div className="divide-y divide-border/70">
        {items.map((item) => (
          <div
            key={item.pullRequestId}
            className="grid gap-2 px-4 py-4 text-sm md:grid-cols-[3fr_1.2fr_1fr] md:items-center"
          >
            <div>
              <p className="font-medium">
                #{item.number} {item.title}
              </p>
            </div>
            <p className="text-muted-foreground">{item.author}</p>
            <p>{formatDurationMinutes(item.waitingMinutes)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
