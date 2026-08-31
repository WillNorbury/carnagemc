import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { parseMcText } from "@/lib/mcColors";
import { Loader2 } from "lucide-react";

type TabAnimation = {
  id: string;
  name: string;
  change_interval: number;
  lines: string[];
  sort_order: number;
};

const AnimatedLine = ({ anim }: { anim: TabAnimation }) => {
  const frames = anim.lines.length ? anim.lines : [""];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (frames.length <= 1) return;
    const t = setInterval(
      () => setIdx((v) => (v + 1) % frames.length),
      Math.max(250, anim.change_interval || 2500),
    );
    return () => clearInterval(t);
  }, [frames.length, anim.change_interval]);

  return (
    <div
      className="whitespace-pre font-mono text-[15px] leading-6 transition-opacity duration-200"
      key={idx}
      style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.6)" }}
    >
      {parseMcText(frames[idx], `${anim.id}-${idx}-`) || " "}
    </div>
  );
};

const TabAnimations = () => {
  const [rows, setRows] = useState<TabAnimation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("tab_animations" as any) as any)
        .select("id,name,change_interval,lines,sort_order")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      setRows(
        ((data ?? []) as any[]).map((r) => ({
          ...r,
          lines: Array.isArray(r.lines) ? r.lines.filter((l: any) => typeof l === "string") : [],
        })),
      );
      setLoading(false);
    })();
  }, []);

  const groups = useMemo(() => rows, [rows]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Tab Animations | CarnageMC</title>
        <meta name="description" content="Preview animated Minecraft TAB list lines with color codes and configurable change intervals." />
      </Helmet>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Animated Tab List</h1>
        <p className="text-muted-foreground mb-8">
          Live preview of the server's animated TAB lines. Colors use Minecraft formatting codes.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground">No animations published yet.</p>
        ) : (
          <div className="space-y-8">
            {/* Minecraft TAB-list style preview */}
            <div className="rounded-lg border border-border bg-black/80 p-6 shadow-xl">
              <div className="mx-auto w-fit min-w-[280px] rounded bg-[#1a1a1a]/90 px-6 py-4 space-y-1">
                {groups.map((g) => (
                  <AnimatedLine key={g.id} anim={g} />
                ))}
              </div>
            </div>

            {/* Config view per group */}
            {groups.map((g) => (
              <div key={g.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold">{g.name}</h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    change-interval: {g.change_interval}
                  </span>
                </div>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
{`${g.name}:
  change-interval: ${g.change_interval}
  texts:
${g.lines.map((l) => `  - "${l}"`).join("\n")}`}
                </pre>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TabAnimations;
