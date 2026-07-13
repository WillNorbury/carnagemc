import { useEffect, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Users, Gauge, Server as ServerIcon, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Row = {
  slug: string;
  name: string;
  ip: string | null;
  online: boolean;
  players_online: number;
  players_max: number;
  tps: number;
  uptime_pct: number;
  motd: string | null;
  sort_order: number;
  updated_at: string;
};

const tpsColor = (tps: number) =>
  tps >= 19 ? "text-emerald-500" : tps >= 15 ? "text-amber-500" : "text-destructive";

const uptimeColor = (pct: number) =>
  pct >= 99 ? "text-emerald-500" : pct >= 95 ? "text-amber-500" : "text-destructive";

const ServersStatus = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("mc_public_servers")
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("mc_public_servers")
      .on("postgres_changes", { event: "*", schema: "public", table: "mc_public_servers" }, load)
      .subscribe();
    const t = setInterval(load, 30_000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(t);
    };
  }, []);

  const copyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopied(ip);
    toast.success("IP copied");
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <header className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">Server Status</h1>
          <p className="text-muted-foreground">
            Live player counts, TPS, and uptime for every CarnageMC network server.
          </p>
        </header>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No servers configured yet.</Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((r) => {
              const pct =
                r.players_max > 0 ? Math.min(100, (r.players_online / r.players_max) * 100) : 0;
              return (
                <Card key={r.slug} className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ServerIcon className="h-4 w-4 text-primary" />
                        <h2 className="font-display font-bold text-xl">{r.name}</h2>
                      </div>
                      {r.motd && (
                        <p className="text-sm text-muted-foreground">{r.motd}</p>
                      )}
                    </div>
                    <Badge variant={r.online ? "default" : "outline"} className={r.online ? "" : "text-muted-foreground"}>
                      <span
                        className={`h-2 w-2 rounded-full mr-1.5 ${r.online ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`}
                      />
                      {r.online ? "Online" : "Offline"}
                    </Badge>
                  </div>

                  {r.ip && (
                    <button
                      onClick={() => copyIp(r.ip!)}
                      className="flex items-center gap-2 text-sm font-mono px-3 py-2 rounded-md bg-muted/40 hover:bg-muted transition w-full text-left"
                    >
                      <span className="flex-1 truncate">{r.ip}</span>
                      {copied === r.ip ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" /> Players
                      </span>
                      <span className="font-mono">
                        {r.players_online} / {r.players_max}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border border-border/60 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Gauge className="h-3.5 w-3.5" /> TPS
                      </div>
                      <div className={`font-mono text-lg font-bold ${tpsColor(r.tps)}`}>
                        {r.tps.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-md border border-border/60 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Activity className="h-3.5 w-3.5" /> Uptime (30d)
                      </div>
                      <div className={`font-mono text-lg font-bold ${uptimeColor(r.uptime_pct)}`}>
                        {r.uptime_pct.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Updated {new Date(r.updated_at).toLocaleString()}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ServersStatus;
