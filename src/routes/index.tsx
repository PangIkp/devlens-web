import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { HealthStatusCard } from "@/routes/shared/health-status-card";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexPage,
});

function IndexPage() {
  return (
    <AppLayout>
      <PageShell
        eyebrow="Phase 0"
        title="DevLens Web Foundation"
        description="This starter shell validates routing, layout, server-state wiring, and OpenAPI-driven contracts before dashboard features are implemented."
      >
        <HealthStatusCard />
      </PageShell>
    </AppLayout>
  );
}
