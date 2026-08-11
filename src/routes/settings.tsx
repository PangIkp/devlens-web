import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppLayout>
      <PageShell
        eyebrow="Settings"
        title="Settings placeholder"
        description="Reserved for GitHub connection state, sync controls, metric configuration, and user preferences in later phases."
      >
        <p className="text-sm text-muted-foreground">Authentication and repository configuration are out of scope for this branch.</p>
      </PageShell>
    </AppLayout>
  );
}
