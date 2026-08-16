import { Skeleton } from "@/components/ui/skeleton";

export function RepositoryListSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80" aria-label="Repositories loading">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="grid gap-4 border-b border-border/70 px-4 py-4 last:border-b-0 md:grid-cols-[1.6fr_1.8fr_1fr_1fr_1.2fr]">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      ))}
    </div>
  );
}
