import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ConfirmModalState = {
  title: string;
  description?: string;
  errorMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
} | null;

export function ConfirmModal({
  state,
  onOpenChange,
}: {
  state: ConfirmModalState;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <p className="text-lg font-semibold">{state?.title}</p>
        {state?.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{state.description}</p>
        ) : null}
        {state?.errorMessage ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
            {state.errorMessage}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={state?.pending}
            onClick={() => onOpenChange(false)}
          >
            {state?.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={state?.pending}
            onClick={() => state?.onConfirm()}
          >
            {state?.pending ? "Working..." : (state?.confirmLabel ?? "Confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
