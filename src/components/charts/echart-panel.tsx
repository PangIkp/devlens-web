import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
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
  const chartRef = useRef<echarts.ECharts | null>(null);
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

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const chart = echarts.init(containerRef.current, mediaQuery.matches ? "dark" : undefined);
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(containerRef.current);

    const handleThemeChange = () => {
      chart.dispose();
      const nextChart = echarts.init(containerRef.current, mediaQuery.matches ? "dark" : undefined);
      chartRef.current = nextChart;
      nextChart.setOption(optionRef.current, true);
      nextChart.hideLoading();
      if (loadingRef.current) {
        nextChart.showLoading("default");
      }
    };

    mediaQuery.addEventListener("change", handleThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
      resizeObserver.disconnect();
      chart.dispose();
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
        className="w-full rounded-2xl border border-border/70 bg-background/60"
        style={{ height }}
      />
    </div>
  );
}
