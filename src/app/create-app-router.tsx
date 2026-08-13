import { createRouter, type RouterHistory } from "@tanstack/react-router";
import { dashboardRoute } from "@/routes/dashboard";
import { indexRoute } from "@/routes/index";
import { insightsRoute } from "@/routes/insights";
import { pullRequestDetailRoute } from "@/routes/pull-request-detail";
import { pullRequestsRoute } from "@/routes/pull-requests";
import { repositoriesRoute } from "@/routes/repositories";
import { repositoryDetailRoute } from "@/routes/repository-detail";
import { rootRoute } from "@/routes/root";
import { settingsRoute } from "@/routes/settings";

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  insightsRoute,
  pullRequestsRoute,
  pullRequestDetailRoute,
  repositoriesRoute,
  repositoryDetailRoute,
  settingsRoute,
]);

export function createAppRouter(history?: RouterHistory) {
  return createRouter({
    routeTree,
    history,
    defaultPreload: "intent",
  });
}
