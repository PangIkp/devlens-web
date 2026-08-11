import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppLayout>
      <PageShell
        eyebrow="Dashboard"
        title="Dashboard placeholder"
        description="Reserved for summary cards, trends, hotspots, and review queues once the API endpoints are integrated."
      >
        <p className="text-sm text-muted-foreground">No dashboard widgets are implemented in this foundation branch.</p>
      </PageShell>
    </AppLayout>
  );
}
