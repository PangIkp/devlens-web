import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthBootstrap } from "@/app/auth-bootstrap";
import { queryClient } from "@/app/query-client";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthBootstrap />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
