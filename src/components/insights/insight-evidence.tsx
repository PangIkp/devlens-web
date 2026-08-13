export function InsightEvidence({ evidence }: { evidence?: Record<string, unknown> }) {
  if (!evidence || Object.keys(evidence).length === 0) {
    return <p className="text-sm text-muted-foreground">No structured evidence was returned for this insight.</p>;
  }

  return (
    <dl className="grid gap-3 md:grid-cols-2">
      {Object.entries(evidence).map(([key, value]) => (
        <div key={key} className="rounded-xl border border-border/70 bg-background/70 p-3">
          <dt className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">{key}</dt>
          <dd className="mt-2 break-words text-sm">
            {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
