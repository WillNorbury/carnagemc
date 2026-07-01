import { Zap } from "lucide-react";

/**
 * Compact "Folia supported" pill. Use in list cards where the full
 * FoliaBanner is too large. Detection: pass any array of loaders/platforms
 * (or single strings) — case-insensitive match on "folia".
 */
export const supportsFolia = (
  ...sources: Array<string | null | undefined | (string | null | undefined)[]>
): boolean => {
  const flat: string[] = [];
  for (const s of sources) {
    if (!s) continue;
    if (Array.isArray(s)) flat.push(...(s.filter(Boolean) as string[]));
    else flat.push(s);
  }
  return flat.some((v) => v.toLowerCase() === "folia");
};

const FoliaBadge = ({ className = "" }: { className?: string }) => (
  <span
    title="Folia supported"
    className={`inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ${className}`}
  >
    <Zap className="h-3 w-3" />
    Folia
  </span>
);

export default FoliaBadge;
