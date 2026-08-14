import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";

const AUTO_DISMISS_MS = 4000;

export type SuccessModalState = { title: string; message?: string } | null;

export function SuccessModal({
  state,
  onOpenChange,
}: {
  state: SuccessModalState;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    if (!state) {
      return;
    }
    const timer = window.setTimeout(() => onOpenChange(false), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [state, onOpenChange]);

  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent className="text-center">
        <DialogClose className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-4 text-lg font-semibold">{state?.title}</p>
        {state?.message ? (
          <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
