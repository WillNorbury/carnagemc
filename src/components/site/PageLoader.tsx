import { useEffect, useState } from "react";
import logo from "@/assets/xylo-logo.png";
import { cn } from "@/lib/utils";

/**
 * Full-screen branded loading overlay (Netherite.gg-style).
 * Renders an animated logo, gradient pulse, and a progress bar.
 * Fades out when `loading` flips false.
 */
export const PageLoader = ({
  loading,
  label = "Loading",
}: {
  loading: boolean;
  label?: string;
}) => {
  const [show, setShow] = useState(loading);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    if (loading) {
      setShow(true);
      setProgress(8);
      const id = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.08) : p));
      }, 120);
      return () => clearInterval(id);
    } else {
      setProgress(100);
      const t = setTimeout(() => setShow(false), 450);
      return () => clearTimeout(t);
    }
  }, [loading]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500",
        loading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!loading}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute left-1/2 top-1/2 h-[30vmax] w-[30vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[80px] animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6">
        <div className="relative">
          {/* Rotating ring */}
          <div className="absolute inset-0 -m-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <div className="absolute inset-0 -m-8 rounded-full border border-primary/10 border-t-primary/60 animate-spin [animation-duration:3s] [animation-direction:reverse]" />
          {/* Logo */}
          <div className="relative h-20 w-20 rounded-2xl bg-card/60 backdrop-blur flex items-center justify-center shadow-elegant ring-1 ring-primary/30">
            <img
              src={logo}
              alt=""
              className="h-12 w-12 animate-pulse drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)]"
            />
          </div>
        </div>

        <div className="text-center">
          <div className="font-display text-lg font-semibold tracking-wide">
            <span className="text-gradient">{label}</span>
            <span className="loader-dots ml-0.5" aria-hidden>
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Please wait
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 max-w-[70vw] h-1 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/70 via-primary to-primary/70 transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <style>{`
        .loader-dots span {
          display: inline-block;
          animation: loader-dot 1.4s infinite both;
        }
        .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loader-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes loader-dot {
          0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
