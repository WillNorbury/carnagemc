import { Copy, Check, Signal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  ip: string;
  bedrockIp?: string;
  bedrockPort?: string;
  online?: boolean;
  playersOnline?: number;
  version?: string;
  className?: string;
  /** Show the smaller bedrock tiles under the main IP */
  showBedrock?: boolean;
};

/**
 * Polished, reusable "connect to the server" block.
 * One canonical place for the CarnageMC IP + copy interaction.
 */
export default function ServerIP({
  ip,
  bedrockIp,
  bedrockPort,
  online,
  playersOnline,
  version,
  className,
  showBedrock = true,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      toast.success("Server IP copied!", { description: ip });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — long-press to copy manually");
    }
  };

  return (
    <div className={cn("max-w-lg mx-auto w-full", className)}>
      <button
        onClick={copy}
        aria-label={`Copy CarnageMC Java server IP ${ip} to clipboard`}
        className="group relative w-full rounded-2xl focus-visible:outline-none"
      >
        <span
          aria-hidden
          className="absolute -inset-0.5 rounded-2xl bg-gradient-fire opacity-50 blur transition-opacity duration-300 group-hover:opacity-100"
        />
        <span className="relative flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-card px-5 py-4 sm:px-6">
          <span className="text-left min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Play CarnageMC
            </span>
            <span className="block truncate font-mono text-lg font-bold sm:text-2xl">{ip}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-primary transition-transform duration-300 group-hover:scale-105">
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            <span className="hidden text-xs font-semibold uppercase tracking-wider sm:inline">
              {copied ? "Copied" : "Copy IP"}
            </span>
          </span>
        </span>
      </button>

      {showBedrock && (bedrockIp || bedrockPort) && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-primary/20 bg-card/70 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Bedrock IP</div>
            <div className="font-mono text-sm font-semibold sm:text-base">{bedrockIp ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-card/70 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Bedrock Port</div>
            <div className="font-mono text-sm font-semibold sm:text-base">{bedrockPort ?? "—"}</div>
          </div>
        </div>
      )}

      {online !== undefined && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span
            aria-hidden
            className={cn("h-2 w-2 rounded-full", online ? "bg-emerald-400 animate-pulse" : "bg-destructive")}
          />
          <Signal className="h-3.5 w-3.5 opacity-60" aria-hidden />
          {online ? `${playersOnline ?? 0} players online` : "Server offline"}
          {online && version && <span className="opacity-60">• {version}</span>}
        </p>
      )}
    </div>
  );
}
