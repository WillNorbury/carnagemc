import { useEffect, useRef, useState } from "react";
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
import { Sparkles, RefreshCw } from "lucide-react";

/**
 * Polls index.html for a changed ETag/Last-Modified and, when the deployed
 * version differs from the one the user loaded, shows a dialog asking them
 * to reload the site. Runs only in the browser and only over http(s).
 */
const POLL_MS = 60_000; // 1 minute

async function fetchVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/index.html?_v=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (
      res.headers.get("etag") ||
      res.headers.get("last-modified") ||
      res.headers.get("content-length") ||
      null
    );
  } catch {
    return null;
  }
}

export const UpdatePrompt = () => {
  const initial = useRef<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip in local/preview dev where HMR handles updates.
    if (window.location.hostname === "localhost") return;

    let cancelled = false;

    const check = async () => {
      const v = await fetchVersion();
      if (cancelled || !v) return;
      if (initial.current == null) {
        initial.current = v;
        return;
      }
      if (v !== initial.current) setOpen(true);
    };

    check();
    const id = window.setInterval(check, POLL_MS);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="border-primary/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            A new version is available
          </AlertDialogTitle>
          <AlertDialogDescription>
            The site was just updated. Reload to get the latest changes — your
            current page will refresh.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Later</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UpdatePrompt;
