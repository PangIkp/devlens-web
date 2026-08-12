import { formatCount, formatDateRange, formatDurationMinutes, formatPercentage } from "@/lib/formatters";

describe("formatters", () => {
  it("formats duration in human readable form", () => {
    expect(formatDurationMinutes(90)).toBe("1h 30m");
    expect(formatDurationMinutes(45)).toBe("45m");
  });

  it("formats percentages", () => {
    expect(formatPercentage(0.82)).toBe("82%");
  });

  it("returns unavailable for missing values", () => {
    expect(formatDurationMinutes(null)).toBe("Unavailable");
    expect(formatPercentage(undefined)).toBe("Unavailable");
    expect(formatCount(null)).toBe("Unavailable");
  });

  it("formats date ranges", () => {
    expect(formatDateRange("2026-08-01", "2026-08-12")).toContain("2026");
  });
});
