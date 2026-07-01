import { Zap } from "lucide-react";

/**
 * Folia support banner. Render on plugin pages that support Folia.
 */
const FoliaBanner = () => {
  return (
    <a
      href="https://papermc.io/software/folia"
      target="_blank"
      rel="noreferrer noopener"
      className="not-prose my-4 flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent px-4 py-3 hover:border-emerald-400/70 transition-colors max-w-md"
    >
      <div className="h-10 w-10 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0">
        <Zap className="h-5 w-5 text-emerald-400" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-emerald-300">
          Folia supported
        </div>
        <div className="text-xs text-muted-foreground">
          Runs on PaperMC's multithreaded Folia server
        </div>
      </div>
    </a>
  );
};

export default FoliaBanner;
