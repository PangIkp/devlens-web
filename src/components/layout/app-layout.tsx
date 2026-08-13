import type { PropsWithChildren } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
