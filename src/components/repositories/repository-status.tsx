import type { Repository } from "@/features/repositories/repositories.schemas";
import { cn } from "@/lib/utils";

function getRepositoryStatus(repository: Repository) {
  if (repository.archivedAt) {
    return {
      label: "Archived repository",
      className: "border-amber-300 bg-amber-100 text-amber-900",
    };
  }

  if (repository.isActive) {
    return {
      label: "Active repository",
      className: "border-emerald-300 bg-emerald-100 text-emerald-900",
    };
  }

  return {
    label: "Inactive repository",
    className: "border-slate-300 bg-slate-100 text-slate-800",
  };
}

export function RepositoryStatusBadge({ repository }: { repository: Repository }) {
  const status = getRepositoryStatus(repository);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        status.className,
      )}
    >
      {status.label}
    </span>
  );
}
