import { createRootRoute, Outlet } from "@tanstack/react-router";

export const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-[50vh] items-center justify-center text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
      </div>
    </div>
  ),
});

function RootComponent() {
  return <Outlet />;
}
