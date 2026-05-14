import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

const ConfirmHost = ({
  options,
  onResolve,
}: {
  options: ConfirmOptions;
  onResolve: (v: boolean) => void;
}) => {
  const [open, setOpen] = useState(true);

  // Auto-cleanup after close animation
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => onResolve(false), 150);
      return () => clearTimeout(t);
    }
  }, [open, onResolve]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title ?? "Are you sure?"}</AlertDialogTitle>
          {options.description && (
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setOpen(false); onResolve(false); }}>
            {options.cancelText ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            className={options.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            onClick={() => { setOpen(false); onResolve(true); }}
          >
            {options.confirmText ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * Imperative in-app confirm dialog. Returns a Promise<boolean>.
 * Replaces native window.confirm() with a themed shadcn AlertDialog.
 *
 * Usage:
 *   if (!(await confirm({ title: "Delete?", destructive: true }))) return;
 */
export function confirm(options: ConfirmOptions | string = {}): Promise<boolean> {
  const opts: ConfirmOptions =
    typeof options === "string" ? { title: options } : options;

  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const cleanup = (value: boolean) => {
      resolve(value);
      // Defer unmount so close animation can play
      setTimeout(() => {
        root.unmount();
        container.remove();
      }, 200);
    };

    root.render(<ConfirmHost options={opts} onResolve={cleanup} />);
  });
}
