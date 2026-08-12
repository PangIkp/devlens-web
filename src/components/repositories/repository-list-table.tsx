import { Link } from "@tanstack/react-router";
import type { Repository } from "@/features/repositories/repositories.schemas";
import { RepositoryStatusBadge } from "@/components/repositories/repository-status";
import { formatDateTime } from "@/components/repositories/repository-utils";
import { Button } from "@/components/ui/button";

type RepositoryListTableProps = {
  repositories: Repository[];
};

export function RepositoryListTable({ repositories }: RepositoryListTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80">
      <div className="hidden bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground md:grid md:grid-cols-[1.6fr_1.8fr_1fr_1fr_1.2fr]">
        <span>Repository</span>
        <span>Full name</span>
        <span>Default branch</span>
        <span>Status</span>
        <span>Last synced</span>
      </div>
      <div className="divide-y divide-border/70">
        {repositories.map((repository) => (
          <div
            key={repository.id}
            className="grid gap-3 px-4 py-4 md:grid-cols-[1.6fr_1.8fr_1fr_1fr_1.2fr] md:items-center"
          >
            <div>
              <p className="font-semibold">{repository.name}</p>
              <Button asChild variant="ghost" size="sm" className="mt-2 h-auto px-0 py-0 text-accent">
                <Link to="/repositories/$repositoryId" params={{ repositoryId: repository.id }}>
                  Open details
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{repository.fullName}</p>
            <p className="text-sm">{repository.defaultBranch ?? "No default branch"}</p>
            <div>
              <RepositoryStatusBadge repository={repository} />
            </div>
            <p className="text-sm text-muted-foreground">{formatDateTime(repository.lastSyncedAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
