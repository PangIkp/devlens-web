import { useEffect, useRef } from "react";
import type { ECharts, EChartsOption } from "echarts";
import { EmptyState } from "@/components/shared/query-state";

type EChartPanelProps = {
  title: string;
  description: string;
  option: EChartsOption;
  empty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: boolean;
  height?: number;
};

export function EChartPanel({
  title,
  description,
  option,
  empty,
  emptyTitle = "No chart data available",
  emptyDescription = "The backend returned no datapoints for the selected range.",
  loading = false,
  height = 320,
}: EChartPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ECharts | null>(null);
  const optionRef = useRef(option);
  const loadingRef = useRef(loading);

  useEffect(() => {
    optionRef.current = option;
    loadingRef.current = loading;
  }, [loading, option]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let cancelled = false;
    let chart: ECharts | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let handleThemeChange: (() => void) | null = null;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Loaded lazily so pages that never render a chart don't pull the
    // (large) echarts bundle into their initial chunk.
    void import("echarts").then((echarts) => {
      if (cancelled || !containerRef.current) {
        return;
      }

      chart = echarts.init(containerRef.current, mediaQuery.matches ? "dark" : undefined);
      chartRef.current = chart;
      chart.setOption(optionRef.current, true);
      if (loadingRef.current) {
        chart.showLoading("default");
      }

      resizeObserver = new ResizeObserver(() => {
        chart?.resize();
      });
      resizeObserver.observe(containerRef.current);

      handleThemeChange = () => {
        if (!containerRef.current) {
          return;
        }

        chart?.dispose();
        const nextChart = echarts.init(containerRef.current, mediaQuery.matches ? "dark" : undefined);
        chart = nextChart;
        chartRef.current = nextChart;
        nextChart.setOption(optionRef.current, true);
        nextChart.hideLoading();
        if (loadingRef.current) {
          nextChart.showLoading("default");
        }
      };

      mediaQuery.addEventListener("change", handleThemeChange);
    });

    return () => {
      cancelled = true;
      if (handleThemeChange) {
        mediaQuery.removeEventListener("change", handleThemeChange);
      }
      resizeObserver?.disconnect();
      chart?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    if (loading) {
      chartRef.current.showLoading("default");
    } else {
      chartRef.current.hideLoading();
      chartRef.current.setOption(option, true);
    }
  }, [loading, option]);

  if (empty && !loading) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  if (import.meta.env.MODE === "test") {
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div
          role="img"
          aria-label={title}
          className="flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 text-sm text-muted-foreground"
          style={{ height }}
        >
          {loading ? "Chart loading" : "Chart ready"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        ref={containerRef}
        role="img"
        aria-label={title}
        className="relative w-full overflow-hidden rounded-2xl border border-border/70 bg-background/60"
        style={{ height }}
      />
    </div>
  );
}
