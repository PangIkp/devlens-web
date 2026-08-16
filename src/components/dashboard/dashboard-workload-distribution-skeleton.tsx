import { Skeleton } from "@/components/ui/skeleton";

function DistributionBarSkeleton() {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export function DashboardWorkloadDistributionSkeleton() {
  return (
    <div className="space-y-6" aria-label="Workload distribution loading">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-2 h-7 w-16" />
        </div>
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-2 h-7 w-16" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <DistributionBarSkeleton key={row} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <DistributionBarSkeleton key={row} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
