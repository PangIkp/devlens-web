import { useHealthQuery } from "@/features/health/use-health-query";

export function HealthStatusCard() {
  const { data, isLoading, isError, error } = useHealthQuery();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Checking backend health...</p>;
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-accent">Backend connection not available</p>
        <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">No health data available.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</p>
        <p className="mt-2 text-xl font-semibold capitalize">{data.status}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Timestamp</p>
        <p className="mt-2 text-lg font-medium">{data.timestamp}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Postgres</p>
        <p className="mt-2 text-lg font-medium capitalize">{data.dependencies.postgres.status}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ClickHouse</p>
        <p className="mt-2 text-lg font-medium capitalize">{data.dependencies.clickhouse.status}</p>
      </div>
    </div>
  );
}
