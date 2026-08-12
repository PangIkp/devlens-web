import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "@/app/create-app-router";

const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
