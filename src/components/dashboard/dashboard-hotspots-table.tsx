import type { HotspotFile } from "@/features/dashboard/dashboard.schemas";
import { formatCount } from "@/lib/formatters";

export function DashboardHotspotsTable({ hotspots }: { hotspots: HotspotFile[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80">
      <div className="hidden bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground md:grid md:grid-cols-[3fr_1fr]">
        <span>File path</span>
        <span>Hotspot score</span>
      </div>
      <div className="divide-y divide-border/70">
        {hotspots.map((hotspot) => (
          <div
            key={hotspot.filePath}
            className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[3fr_1fr] md:items-center"
          >
            <p className="break-all font-mono text-xs md:text-sm">{hotspot.filePath}</p>
            <p>{formatCount(hotspot.hotspotScore, 2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
