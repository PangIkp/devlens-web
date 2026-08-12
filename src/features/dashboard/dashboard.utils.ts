const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 30;

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getDefaultDashboardDateRange(referenceDate = new Date()) {
  const endDate = new Date(referenceDate);
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - (DEFAULT_RANGE_DAYS - 1));

  return {
    from: toIsoDate(startDate),
    to: toIsoDate(endDate),
  };
}

export function isValidDateRange(from: string, to: string) {
  return from <= to;
}

export function inferMetricsInterval(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const differenceInDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / DAY_IN_MS) + 1);

  if (differenceInDays <= 31) {
    return "day" as const;
  }

  if (differenceInDays <= 180) {
    return "week" as const;
  }

  return "month" as const;
}

export function createLineSeriesData(points: Array<{ date: string; value: number }>) {
  return points.map((point) => [point.date, point.value] as const);
}
