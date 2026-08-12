import { Skeleton } from "@/components/ui/skeleton";

export function RepositoryListSkeleton() {
  return (
    <div className="space-y-4" aria-label="Repositories loading">
      <div className="grid gap-3 md:grid-cols-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/80">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="grid gap-4 border-b border-border/70 px-4 py-4 md:grid-cols-[1.6fr_1.8fr_1fr_1fr_1.2fr]">
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
