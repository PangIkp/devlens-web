import { createRoute, Navigate } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexPage,
});

function IndexPage() {
  return <Navigate to="/dashboard" replace />;
}
