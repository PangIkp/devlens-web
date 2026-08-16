import type { Repository } from "@/features/repositories/repositories.schemas";
import { Card } from "@/components/ui/card";
import { RepositoryStatusBadge } from "@/components/repositories/repository-status";
import { formatDateTime, getRepositoryGitHubUrl } from "@/components/repositories/repository-utils";
import { Button } from "@/components/ui/button";

export function RepositoryDetailPanel({ repository }: { repository: Repository }) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <RepositoryStatusBadge repository={repository} />
          </div>
          <h2 className="mt-2 text-2xl font-semibold">{repository.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{repository.fullName}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={getRepositoryGitHubUrl(repository.fullName)} target="_blank" rel="noreferrer">
            Open on GitHub
          </a>
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatChip label="Default branch" value={repository.defaultBranch ?? "Not set"} />
        <StatChip label="Last synced" value={formatDateTime(repository.lastSyncedAt)} />
        <StatChip label="Created at" value={formatDateTime(repository.createdAt)} />
        <StatChip label="Updated at" value={formatDateTime(repository.updatedAt)} />
        <StatChip label="Repository ID" value={repository.id} mono />
        <StatChip label="Organization ID" value={repository.organizationId} mono />
      </div>
    </Card>
  );
}

function StatChip({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-sm ${mono ? "break-all font-mono" : "font-medium"}`}>{value}</p>
    </div>
  );
}
