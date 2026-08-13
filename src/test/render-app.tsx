import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { createAppRouter } from "@/app/create-app-router";
import { clearAuthSession, setAuthSession } from "@/features/auth/auth.store";
import { createTestSession } from "@/test/session-fixture";

export function renderApp(initialEntry: string, options?: { authenticated?: boolean }) {
  if (options?.authenticated === false) {
    clearAuthSession();
  } else {
    setAuthSession(createTestSession());
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  const history = createMemoryHistory({
    initialEntries: [initialEntry],
  });
  const router = createAppRouter(history);

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return {
    ...result,
    queryClient,
    router,
  };
}
