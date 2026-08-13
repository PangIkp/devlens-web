import type { PullRequestTimelineEvent } from "@/features/pull-requests/pull-requests.schemas";
import { formatDateTime } from "@/components/repositories/repository-utils";

export function PullRequestTimeline({ events }: { events: PullRequestTimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No timeline events were returned for this pull request.</p>;
  }

  return (
    <ol className="space-y-0">
      {events.map((event, index) => (
        <li key={`${event.type}-${event.occurredAt}-${index}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            {index < events.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
          </div>
          <div className="pb-4 text-sm">
            <p className="font-medium">{event.label}</p>
            <p className="text-xs text-muted-foreground">
              {[event.actor, formatDateTime(event.occurredAt), event.state].filter(Boolean).join(" • ")}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
