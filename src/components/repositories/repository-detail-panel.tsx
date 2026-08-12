import type { Repository } from "@/features/repositories/repositories.schemas";
import { RepositoryStatusBadge } from "@/components/repositories/repository-status";
import { formatDateTime, getRepositoryGitHubUrl } from "@/components/repositories/repository-utils";
import { Button } from "@/components/ui/button";

export function RepositoryDetailPanel({ repository }: { repository: Repository }) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Repository</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{repository.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{repository.fullName}</p>
        </div>
        <div className="space-y-3">
          <RepositoryStatusBadge repository={repository} />
          <div>
            <Button asChild variant="outline" size="sm">
              <a href={getRepositoryGitHubUrl(repository.fullName)} target="_blank" rel="noreferrer">
                Open on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Default branch" value={repository.defaultBranch ?? "Not set"} />
        <InfoCard label="Last synced" value={formatDateTime(repository.lastSyncedAt)} />
        <InfoCard label="Created at" value={formatDateTime(repository.createdAt)} />
        <InfoCard label="Updated at" value={formatDateTime(repository.updatedAt)} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoCard label="Repository ID" value={repository.id} mono />
        <InfoCard label="Organization ID" value={repository.organizationId} mono />
      </section>
    </div>
  );
}

function InfoCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/70 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className={`mt-3 text-sm ${mono ? "break-all font-mono" : "font-medium"}`}>{value}</p>
    </div>
  );
}
