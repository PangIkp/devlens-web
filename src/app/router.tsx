import { RouterProvider, createRouter } from "@tanstack/react-router";
import { dashboardRoute } from "@/routes/dashboard";
import { indexRoute } from "@/routes/index";
import { repositoriesRoute } from "@/routes/repositories";
import { repositoryDetailRoute } from "@/routes/repository-detail";
import { rootRoute } from "@/routes/root";
import { settingsRoute } from "@/routes/settings";

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  repositoriesRoute.addChildren([repositoryDetailRoute]),
  settingsRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
