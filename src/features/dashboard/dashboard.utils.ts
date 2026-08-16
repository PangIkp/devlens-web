const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 30;

export const dashboardRangePresets = [7, 30, 90] as const;

export type DashboardRangePreset = (typeof dashboardRangePresets)[number];

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getDefaultDashboardDateRange(referenceDate = new Date()) {
  return getDashboardDateRangeForPreset(DEFAULT_RANGE_DAYS, referenceDate);
}

export function getDashboardDateRangeForPreset(days: DashboardRangePreset, referenceDate = new Date()) {
  const endDate = new Date(referenceDate);
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - (days - 1));

  return {
    from: toIsoDate(startDate),
    to: toIsoDate(endDate),
  };
}

export function isValidDateRange(from: string, to: string) {
  return from <= to;
}

export function getPreviousDateRange(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const durationDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / DAY_IN_MS) + 1);

  const previousToDate = new Date(fromDate);
  previousToDate.setDate(previousToDate.getDate() - 1);

  const previousFromDate = new Date(previousToDate);
  previousFromDate.setDate(previousFromDate.getDate() - (durationDays - 1));

  return {
    from: toIsoDate(previousFromDate),
    to: toIsoDate(previousToDate),
  };
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
  return points.map((point) => [point.date, point.value] as [string, number]);
}

export function alignComparisonSeries(
  current: Array<{ date: string; value: number }>,
  previous: Array<{ date: string; value: number }> | undefined,
) {
  const length = Math.max(current.length, previous?.length ?? 0);
  const categories = Array.from({ length }, (_, index) => `Day ${index + 1}`);
  const currentValues = categories.map((_, index) => current[index]?.value ?? null);
  const previousValues = previous
    ? categories.map((_, index) => previous[index]?.value ?? null)
    : undefined;

  return { categories, currentValues, previousValues };
}

export function getDashboardPresetFromRange(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const differenceInDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / DAY_IN_MS) + 1);

  return dashboardRangePresets.find((preset) => preset === differenceInDays);
}
