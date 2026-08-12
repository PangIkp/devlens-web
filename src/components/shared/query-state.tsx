import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type StatePanelProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function StatePanel({ title, description, action }: StatePanelProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/60 p-6 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Could not load data",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <StatePanel
      title={title}
      description={message}
      action={
        onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    />
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <StatePanel title={title} description={description} action={action} />;
}
