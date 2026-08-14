import type { PropsWithChildren } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <RequireAuth>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex h-screen flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
