import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Partner = {
  id: string;
  label: string;
  url: string;
  description: string | null;
  icon: string | null;
};

const COLS = 9;
const ROWS = 6;

const Partners = () => {
  const [rows, setRows] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<Partner | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id,label,url,description,icon")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) toast.error(error.message);
      else setRows((data ?? []) as Partner[]);
      setLoading(false);
    })();
  }, []);

  const copyIp = async (p: Partner) => {
    try {
      await navigator.clipboard.writeText(p.url);
      toast.success(`Copied IP: ${p.url}`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Layout partners into row 1 (index 9..) leaving row 0 as header row like the reference
  const slots: (Partner | null)[] = Array.from({ length: COLS * ROWS }, () => null);
  rows.forEach((p, i) => {
    // start at second row, second slot for a nicer look
    const target = COLS + 1 + i;
    if (target < slots.length) slots[target] = p;
  });

  // pixel-art fallback emojis for slots
  const ICONS = ["🔮", "💎", "🧿", "🌸", "⚔️", "🛡️", "🔥", "⭐", "🍎", "🗝️", "🏹", "🧪"];

  return (
    <>
      <SEO title="Partners — CarnageMC" description="Our partner Minecraft servers and communities." />
      <Navbar />
      <main className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10 bg-background">
        <div className="w-full max-w-3xl">
          <div
            className="relative rounded-md p-4 sm:p-6 shadow-2xl"
            style={{
              background: "linear-gradient(180deg, hsl(240 8% 10%), hsl(240 10% 6%))",
              border: "3px solid hsl(240 6% 22%)",
              boxShadow: "inset 0 0 0 2px hsl(240 6% 14%), 0 20px 60px -20px hsl(0 0% 0% / 0.8)",
              imageRendering: "pixelated",
            }}
          >
            {/* Header bar */}
            <div className="mb-4 px-2 py-2 flex items-center justify-between border-b border-border/40">
              <h1
                className="text-muted-foreground tracking-[0.3em] text-xs sm:text-sm uppercase select-none"
                style={{ fontFamily: '"Press Start 2P", "VT323", ui-monospace, monospace' }}
              >
                Server Selector — Partner
              </h1>
              <span className="text-[10px] text-muted-foreground/60 tracking-widest">
                {rows.length}/{COLS * ROWS}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : (
              <div
                className="grid gap-1.5 sm:gap-2"
                style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
              >
                {slots.map((p, i) => {
                  const filled = !!p;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!filled}
                      onClick={() => p && copyIp(p)}
                      onMouseEnter={() => setHovered(p)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(p)}
                      onBlur={() => setHovered(null)}
                      aria-label={p ? `Copy IP for ${p.label}` : "Empty slot"}
                      className={`relative aspect-square rounded-[3px] transition-all ${
                        filled
                          ? "hover:scale-105 hover:z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                          : "cursor-default"
                      }`}
                      style={{
                        background: "linear-gradient(180deg, hsl(240 6% 20%), hsl(240 8% 12%))",
                        boxShadow:
                          "inset 1px 1px 0 hsl(240 6% 30%), inset -1px -1px 0 hsl(240 10% 4%)",
                      }}
                    >
                      {filled && (
                        <span
                          className="absolute inset-0 flex items-center justify-center text-lg sm:text-2xl select-none drop-shadow-[0_0_6px_rgba(255,120,220,0.5)]"
                          style={{ imageRendering: "pixelated" }}
                        >
                          {ICONS[i % ICONS.length]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tooltip / detail bar */}
            <div
              className="mt-4 min-h-[64px] px-3 py-2 rounded-[3px] border border-border/40 flex items-center gap-3"
              style={{ background: "hsl(240 10% 8%)" }}
            >
              {hovered ? (
                <>
                  <div
                    className="h-10 w-10 flex items-center justify-center rounded-[3px] shrink-0 text-xl"
                    style={{
                      background: "linear-gradient(180deg, hsl(240 6% 20%), hsl(240 8% 12%))",
                      boxShadow: "inset 1px 1px 0 hsl(240 6% 30%), inset -1px -1px 0 hsl(240 10% 4%)",
                    }}
                  >
                    {ICONS[rows.findIndex((r) => r.id === hovered.id) % ICONS.length]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-primary text-sm truncate"
                      style={{ fontFamily: '"Press Start 2P", "VT323", ui-monospace, monospace' }}
                    >
                      {hovered.label}
                    </div>
                    <div className="text-xs text-muted-foreground truncate font-mono">
                      {hovered.url}
                    </div>
                    {hovered.description && (
                      <div className="text-[11px] text-muted-foreground/80 truncate">
                        {hovered.description}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest hidden sm:inline">
                    Click to copy IP
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground/60 tracking-widest uppercase">
                  {rows.length === 0
                    ? "No partners yet"
                    : "Hover a slot to inspect · Click to copy IP"}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Partners;
