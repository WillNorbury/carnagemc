import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Users, Server, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

type Status = {
  online: boolean;
  players_online: number;
  players_max: number;
  motd: string | null;
  version: string | null;
  icon?: string | null;
};

interface Props {
  className?: string;
  compact?: boolean;
}

const ServerStatusWidget = ({ className = "", compact = false }: Props) => {
  const [ip, setIp] = useState("play.xylomc.net");
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("site_content").select("value").eq("key", "server").maybeSingle().then(({ data }) => {
      const v = data?.value as any;
      if (v?.ip) setIp(v.ip);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const r = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(ip)}`);
        const j = await r.json();
        if (cancelled) return;
        setStatus({
          online: !!j.online,
          players_online: j.players?.online ?? 0,
          players_max: j.players?.max ?? 0,
          motd: Array.isArray(j.motd?.clean) ? j.motd.clean.join(" ").trim() : null,
          version: j.version ?? null,
          icon: j.icon ?? null,
        });
      } catch {
        if (!cancelled) setStatus({ online: false, players_online: 0, players_max: 0, motd: null, version: null });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStatus();
    const t = setInterval(fetchStatus, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [ip]);

  const copyIp = () => { navigator.clipboard.writeText(ip); toast.success("Server IP copied"); };

  return (
    <Card className={`relative overflow-hidden border-primary/30 ${className}`}>
      <div className="absolute inset-0 opacity-10" style={{ background: "var(--gradient-fire)" }} />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {status?.icon ? (
              <img src={status.icon} alt="" className="h-10 w-10 rounded-md border border-border" />
            ) : (
              <div className="h-10 w-10 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                <Server className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">Live Server</div>
              <div className="font-display font-bold">XyloMC</div>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
            loading
              ? "border-border text-muted-foreground"
              : status?.online
              ? "border-primary/50 text-primary bg-primary/10 animate-pulse-glow"
              : "border-destructive/50 text-destructive bg-destructive/10"
          }`}>
            {loading ? <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              : status?.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {loading ? "Checking…" : status?.online ? "Online" : "Offline"}
          </div>
        </div>

        {/* IP copy bar */}
        <button onClick={copyIp} className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-secondary/60 border border-border hover:border-primary/60 transition mb-4">
          <div className="text-left min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Server IP</div>
            <div className="font-mono font-bold truncate">{ip}</div>
          </div>
          <div className="flex items-center gap-1.5 text-primary text-xs uppercase tracking-wider group-hover:scale-105 transition">
            <Copy className="h-4 w-4" /> Copy
          </div>
        </button>

        {/* Stats grid */}
        <div className={`grid ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"} gap-3 mb-4`}>
          <Stat
            icon={<Users className="h-4 w-4" />}
            label="Players"
            value={status ? `${status.players_online} / ${status.players_max}` : "—"}
          />
          <Stat
            icon={<Server className="h-4 w-4" />}
            label="Version"
            value={status?.version ?? "—"}
          />
          {!compact && (
            <Stat
              icon={<span className={`h-2 w-2 rounded-full ${status?.online ? "bg-primary animate-pulse" : "bg-destructive"}`} />}
              label="Status"
              value={status?.online ? "Live" : "Down"}
            />
          )}
        </div>

        {/* MOTD */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">MOTD</div>
          <div className="text-sm font-mono p-3 rounded-md bg-background/60 border border-border min-h-[2.5rem] whitespace-pre-wrap break-words">
            {status?.motd?.trim() || (loading ? "Loading…" : "—")}
          </div>
        </div>
      </div>
    </Card>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="rounded-lg bg-secondary/40 border border-border/60 p-3">
    <div className="flex items-center gap-1.5 text-primary mb-1">{icon}</div>
    <div className="font-display font-bold text-sm truncate">{value}</div>
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
  </div>
);

export default ServerStatusWidget;
