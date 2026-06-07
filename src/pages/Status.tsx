import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, AlertTriangle, XCircle, HelpCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Range = 1 | 7 | 30;

const RANGES: { label: string; value: Range }[] = [
  { label: "1 day", value: 1 },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
];

const SERVICES: { key: string; name: string; desc: string }[] = [
  { key: "website", name: "Website", desc: "Main site & dashboard" },
  { key: "minecraft", name: "Minecraft Server", desc: "play.havocsmp.net" },
  { key: "api", name: "API & Database", desc: "Backend services" },
  { key: "panel", name: "Panel", desc: "panel.voxelnode.dev" },
  { key: "discord", name: "Discord Server", desc: "discord.havocsmp.net" },
];

type DailyRow = {
  service_key: string;
  day: string;
  total_checks: number;
  up_checks: number;
  uptime_pct: number | null;
};
type DayStatus = "up" | "degraded" | "down" | "none";

const formatDate = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const toDayKey = (d: Date) => d.toISOString().slice(0, 10);

const statusFromPct = (pct: number | null, total: number): DayStatus => {
  if (!total) return "none";
  if (pct === null) return "none";
  if (pct >= 99) return "up";
  if (pct >= 80) return "degraded";
  return "down";
};

const colorFor = (s: DayStatus) => {
  switch (s) {
    case "up":
      return "bg-primary/80 hover:bg-primary";
    case "degraded":
      return "bg-yellow-500/80 hover:bg-yellow-500";
    case "down":
      return "bg-destructive/80 hover:bg-destructive";
    default:
      return "bg-muted/40 hover:bg-muted/60";
  }
};

const DayGrid = ({ days, byDay }: { days: number; byDay: Map<string, { pct: number | null; total: number }> }) => {
  const today = new Date();
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - (days - 1 - i));
    const key = toDayKey(d);
    const rec = byDay.get(key);
    const status = statusFromPct(rec?.pct ?? null, rec?.total ?? 0);
    return { d, key, status, pct: rec?.pct ?? null, total: rec?.total ?? 0 };
  });

  const sizeClass =
    days === 7 ? "h-10 w-10 rounded-md" : days === 30 ? "h-6 w-3 rounded-sm" : "h-5 w-[5px] rounded-[2px]";
  const gapClass = days === 7 ? "gap-2" : days === 30 ? "gap-1" : "gap-[2px]";

  return (
    <div className={`flex flex-wrap ${gapClass}`}>
      {cells.map((c) => (
        <div
          key={c.key}
          className={`${sizeClass} transition-colors cursor-pointer ${colorFor(c.status)}`}
          title={
            c.total ? `${formatDate(c.d)} — ${c.pct?.toFixed(1)}% (${c.total} checks)` : `${formatDate(c.d)} — no data`
          }
        />
      ))}
    </div>
  );
};

const Status = () => {
  const [range, setRange] = useState<Range>(30);
  const [rows, setRows] = useState<DailyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    document.title = "Status — HavocSMP";
  }, []);

  const loadData = async (days: Range) => {
    setLoading(true);
    const { data } = await supabase.rpc("get_uptime_daily", { _days: days });
    setRows((data ?? []) as DailyRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData(range);
  }, [range]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await supabase.functions.invoke("uptime-check", { method: "POST" });
    } catch {
      /* ignore */
    }
    await loadData(range);
    setRefreshing(false);
  };

  const byService = useMemo(() => {
    const m = new Map<string, Map<string, { pct: number | null; total: number }>>();
    for (const r of rows) {
      if (!m.has(r.service_key)) m.set(r.service_key, new Map());
      m.get(r.service_key)!.set(r.day, { pct: r.uptime_pct, total: Number(r.total_checks) });
    }
    return m;
  }, [rows]);

  const overall = useMemo(() => {
    let total = 0,
      up = 0;
    for (const r of rows) {
      total += Number(r.total_checks);
      up += Number(r.up_checks);
    }
    if (!total) return null;
    return (100 * up) / total;
  }, [rows]);

  const serviceCurrent: Record<string, DayStatus> = useMemo(() => {
    const today = toDayKey(new Date());
    const out: Record<string, DayStatus> = {};
    for (const s of SERVICES) {
      const rec = byService.get(s.key)?.get(today);
      out[s.key] = statusFromPct(rec?.pct ?? null, rec?.total ?? 0);
    }
    return out;
  }, [byService]);

  const worstNow: DayStatus = useMemo(() => {
    const vals = Object.values(serviceCurrent);
    if (vals.includes("down")) return "down";
    if (vals.includes("degraded")) return "degraded";
    if (vals.every((v) => v === "none")) return "none";
    return "up";
  }, [serviceCurrent]);

  const banner = {
    up: { icon: CheckCircle2, text: "All services operational", cls: "border-primary/30 bg-primary/5 text-primary" },
    degraded: {
      icon: AlertTriangle,
      text: "Some services degraded",
      cls: "border-yellow-500/40 bg-yellow-500/5 text-yellow-500",
    },
    down: {
      icon: XCircle,
      text: "Service outage detected",
      cls: "border-destructive/40 bg-destructive/5 text-destructive",
    },
    none: { icon: HelpCircle, text: "Awaiting data…", cls: "border-border bg-muted/20 text-muted-foreground" },
  }[worstNow];
  const BannerIcon = banner.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/40">
              <Activity className="h-3 w-3 mr-1" /> System Status
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-3">
              HavocSMP <span className="text-gradient">Status</span>
            </h1>
            <p className="text-muted-foreground">Live uptime — automated checks every 5 minutes.</p>
          </div>

          <Card className={`p-6 mb-8 flex items-center gap-4 ${banner.cls}`}>
            <div className="h-12 w-12 rounded-full bg-background/40 flex items-center justify-center">
              <BannerIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-lg text-foreground">{banner.text}</div>
              <div className="text-sm text-muted-foreground">
                {overall !== null ? `${overall.toFixed(2)}% uptime over the last ${range} days.` : "Collecting data…"}
              </div>
            </div>
            {overall !== null && (
              <div className="hidden sm:block text-right">
                <div className="text-2xl font-display font-black text-gradient">{overall.toFixed(1)}%</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Uptime</div>
              </div>
            )}
          </Card>

          <div className="flex items-center justify-end gap-2 mb-4">
            {RANGES.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant={range === r.value ? "default" : "outline"}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {SERVICES.map((s) => {
              const current = serviceCurrent[s.key];
              const days = byService.get(s.key);
              let total = 0,
                up = 0;
              if (days)
                for (const v of days.values()) {
                  total += v.total;
                  up += Math.round(((v.pct ?? 0) / 100) * v.total);
                }
              const pct = total ? (100 * up) / total : null;
              const statusLabel = {
                up: "Operational",
                degraded: "Degraded",
                down: "Outage",
                none: "No data",
              }[current];
              const statusDotCls = {
                up: "bg-primary animate-pulse",
                degraded: "bg-yellow-500",
                down: "bg-destructive",
                none: "bg-muted-foreground",
              }[current];
              return (
                <Card key={s.key} className="p-5 hover-glow">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="font-display font-bold">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                    <Badge variant="secondary" className="border-border shrink-0">
                      <span className={`h-2 w-2 rounded-full mr-1.5 ${statusDotCls}`} />
                      {statusLabel}
                    </Badge>
                  </div>
                  <DayGrid days={range} byDay={days ?? new Map()} />
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                    <span>{range} days ago</span>
                    <span>{pct !== null ? `${pct.toFixed(2)}% uptime` : loading ? "Loading…" : "No data yet"}</span>
                    <span>Today</span>
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Legend:
            <span className="inline-block h-3 w-3 rounded-sm bg-primary mx-1 align-middle" /> Up
            <span className="inline-block h-3 w-3 rounded-sm bg-yellow-500 mx-1 align-middle" /> Degraded
            <span className="inline-block h-3 w-3 rounded-sm bg-destructive mx-1 align-middle" /> Outage
            <span className="inline-block h-3 w-3 rounded-sm bg-muted mx-1 align-middle" /> No data
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Status;
