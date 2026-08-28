import { AlertCircle, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ErrorModalState = { title: string; message: string } | null;

export function ErrorModal({
  state,
  onOpenChange,
}: {
  state: ErrorModalState;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent className="text-center">
        <DialogClose className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="mt-4 text-lg font-semibold">{state?.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">{state?.message}</p>
        <div className="mt-6 flex justify-center">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}