import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHotspotsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80" aria-label="Hotspot files loading">
      <div className="divide-y divide-border/70">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="grid gap-3 px-4 py-4 md:grid-cols-[3fr_1fr] md:items-center">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
