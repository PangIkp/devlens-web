function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatEvidenceValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  switch (typeof value) {
    case "object":
      if (Array.isArray(value)) {
        return value.length === 0 ? "—" : value.map((item) => formatEvidenceValue(item)).join(", ");
      }
      return JSON.stringify(value);
    case "number":
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    case "string":
      return value;
    case "boolean":
      return value ? "true" : "false";
    default:
      return "";
  }
}

export function InsightEvidence({ evidence }: { evidence?: Record<string, unknown> }) {
  if (!evidence || Object.keys(evidence).length === 0) {
    return <p className="text-sm text-muted-foreground">No structured evidence was returned for this insight.</p>;
  }

  return (
    <dl className="grid gap-3 md:grid-cols-2">
      {Object.entries(evidence).map(([key, value]) => (
        <div key={key} className="rounded-lg bg-muted/50 p-3">
          <dt className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">{key}</dt>
          {isPlainObject(value) ? (
            <dl className="mt-2 space-y-1">
              {Object.entries(value).map(([nestedKey, nestedValue]) => (
                <div key={nestedKey} className="flex items-baseline justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">{nestedKey}</dt>
                  <dd className="break-words text-right">{formatEvidenceValue(nestedValue)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <dd className="mt-2 break-words text-sm">{formatEvidenceValue(value)}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}
