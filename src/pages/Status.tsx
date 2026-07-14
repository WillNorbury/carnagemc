import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Timer,
  ChevronRight,
  Sparkles,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Range = 90 | 180;

const RANGES: { label: string; value: Range }[] = [
  { label: "90 days", value: 90 },
  { label: "180 days", value: 180 },
];

const DEFAULT_SERVICES: { key: string; name: string; desc: string; url: string }[] = [
  { key: "website", name: "Website", desc: "Main site & dashboard", url: "" },
  { key: "minecraft", name: "Minecraft Server", desc: "mc.carnagemc.net", url: "" },
  { key: "api", name: "API & Database", desc: "Backend services", url: "" },
  { key: "panel", name: "Panel", desc: "panel.voxelnode.dev", url: "" },
  {
    key: "discord",
    name: "Discord Server",
    desc: "https://discord.gg/wD6K3nr2MG",
    url: "https://discord.carnagemc.net",
  },
  { key: "portfolio", name: "Portfolio", desc: "portfolio.carnagemc.net", url: "https://portfolio.carnagemc.net" },
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
      return "bg-primary/80 hover:bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]";
    case "degraded":
      return "bg-yellow-500/80 hover:bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]";
    case "down":
      return "bg-destructive/80 hover:bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.5)]";
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

  const sizeClass = days === 30 ? "h-7 flex-1 rounded-sm" : "h-6 flex-1 rounded-[2px]";
  const gapClass = days === 30 ? "gap-1" : "gap-[2px]";

  return (
    <div className={`flex ${gapClass} w-full`}>
      {cells.map((c) => (
        <div
          key={c.key}
          className={`${sizeClass} transition-all cursor-pointer ${colorFor(c.status)}`}
          title={
            c.total ? `${formatDate(c.d)} — ${c.pct?.toFixed(1)}% (${c.total} checks)` : `${formatDate(c.d)} — no data`
          }
        />
      ))}
    </div>
  );
};

// Circular progress ring for overall uptime
const UptimeRing = ({ pct, status }: { pct: number | null; status: DayStatus }) => {
  const size = 180;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const val = pct ?? 0;
  const offset = c - (val / 100) * c;
  const ringColor =
    status === "down"
      ? "hsl(var(--destructive))"
      : status === "degraded"
        ? "rgb(234 179 8)"
        : "hsl(var(--primary))";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ringColor} stopOpacity="1" />
            <stop offset="100%" stopColor={ringColor} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" opacity="0.25" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: "stroke-dashoffset 1s ease-out", filter: `drop-shadow(0 0 6px ${ringColor})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-4xl font-black text-gradient leading-none">
          {pct !== null ? `${pct.toFixed(2)}` : "—"}
          <span className="text-xl">%</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">Uptime</div>
      </div>
    </div>
  );
};

const Status = () => {
  const [range, setRange] = useState<Range>(90);
  const [rows, setRows] = useState<DailyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoInterval, setAutoInterval] = useState<number>(0);
  const [isOwner, setIsOwner] = useState(false);
  const [pageTitle, setPageTitle] = useState("CarnageMC Status");
  const [pageSubtitle, setPageSubtitle] = useState("Live uptime — automated checks every 5 minutes.");
  const [pageFootnote, setPageFootnote] = useState("");
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [incidents, setIncidents] = useState<
    Array<{
      id: string;
      incident_number: number;
      service_key: string;
      opened_at: string;
      closed_at: string | null;
      last_error: string | null;
    }>
  >([]);

  useEffect(() => {
    document.title = "Status — CarnageMC";
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "owner")
        .maybeSingle();
      setIsOwner(!!data);
    })();
    supabase
      .from("site_content")
      .select("value")
      .eq("key", "status_page")
      .maybeSingle()
      .then(({ data }) => {
        const v = (data?.value as any) ?? {};
        if (v.title) setPageTitle(v.title);
        if (v.subtitle) setPageSubtitle(v.subtitle);
        if (typeof v.footnote === "string") setPageFootnote(v.footnote);
        if (Array.isArray(v.services) && v.services.length) setServices(v.services);
      });
  }, []);

  const loadData = async (days: Range) => {
    setLoading(true);
    const { data } = await supabase.rpc("get_uptime_daily", { _days: days });
    setRows((data ?? []) as DailyRow[]);
    const { data: inc } = await supabase
      .from("uptime_incidents")
      .select("id, incident_number, service_key, opened_at, closed_at, last_error")
      .order("opened_at", { ascending: false })
      .limit(20);
    setIncidents((inc ?? []) as any);
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

  useEffect(() => {
    if (autoInterval <= 0) return;
    const id = setInterval(() => {
      handleRefresh();
    }, autoInterval * 60_000);
    return () => clearInterval(id);
  }, [autoInterval, range]);

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
    for (const s of services) {
      const rec = byService.get(s.key)?.get(today);
      out[s.key] = statusFromPct(rec?.pct ?? null, rec?.total ?? 0);
    }
    return out;
  }, [byService, services]);

  const worstNow: DayStatus = useMemo(() => {
    const vals = Object.values(serviceCurrent);
    if (vals.includes("down")) return "down";
    if (vals.includes("degraded")) return "degraded";
    if (vals.every((v) => v === "none")) return "none";
    return "up";
  }, [serviceCurrent]);

  const counts = useMemo(() => {
    const c = { up: 0, degraded: 0, down: 0, none: 0 };
    for (const s of services) c[serviceCurrent[s.key] ?? "none"]++;
    return c;
  }, [serviceCurrent, services]);

  const activeIncidents = incidents.filter((i) => !i.closed_at).length;

  const banner = {
    up: {
      icon: CheckCircle2,
      text: "All Systems Nominal",
      sub: "Every service is humming along.",
      ring: "hsl(var(--primary))",
      chip: "border-primary/40 bg-primary/10 text-primary",
    },
    degraded: {
      icon: AlertTriangle,
      text: "Partial Degradation",
      sub: "Some services are running slow.",
      ring: "rgb(234 179 8)",
      chip: "border-yellow-500/40 bg-yellow-500/10 text-yellow-500",
    },
    down: {
      icon: XCircle,
      text: "Active Outage",
      sub: "Our team is on it.",
      ring: "hsl(var(--destructive))",
      chip: "border-destructive/40 bg-destructive/10 text-destructive",
    },
    none: {
      icon: HelpCircle,
      text: "Awaiting Data",
      sub: "Warming up the sensors…",
      ring: "hsl(var(--muted-foreground))",
      chip: "border-border bg-muted/20 text-muted-foreground",
    },
  }[worstNow];
  const BannerIcon = banner.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 relative overflow-hidden">
        {/* Ambient glow backdrop */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-40 blur-3xl"
          style={{
            background: `radial-gradient(60% 60% at 50% 20%, ${banner.ring}, transparent 70%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="container max-w-6xl px-4 relative">
          {/* HERO */}
          <div className="text-center mb-10">
            <Badge variant="secondary" className={`mb-4 ${banner.chip} border`}>
              <span className="relative flex h-2 w-2 mr-2">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                  style={{ background: banner.ring }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: banner.ring }} />
              </span>
              Live · Checks every 5 min
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl font-black mb-4 tracking-tight">
              {(() => {
                const parts = pageTitle.trim().split(/\s+/);
                if (parts.length <= 1) return <span className="text-gradient">{pageTitle}</span>;
                const last = parts.pop();
                return (
                  <>
                    {parts.join(" ")} <span className="text-gradient">{last}</span>
                  </>
                );
              })()}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">{pageSubtitle}</p>
          </div>

          {/* BENTO HERO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-10">
            {/* Big status card with ring */}
            <Card
              className="md:col-span-4 relative overflow-hidden p-8 border-primary/20"
              style={{
                background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 60%, ${banner.ring}15 100%)`,
              }}
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl" style={{ background: banner.ring }} />
              <div className="relative flex flex-col md:flex-row items-center gap-8">
                <UptimeRing pct={overall} status={worstNow} />
                <div className="flex-1 text-center md:text-left">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border mb-3 ${banner.chip}`}>
                    <BannerIcon className="h-3.5 w-3.5" />
                    {banner.text}
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">{banner.sub}</h2>
                  <p className="text-sm text-muted-foreground">
                    {overall !== null
                      ? `Averaged across every service over the last ${range} days.`
                      : "Collecting probes from around the network…"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Mini stats stack */}
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-1 gap-4">
              <Card className="p-5 relative overflow-hidden group hover:border-primary/50 transition">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.08), transparent)" }} />
                <div className="relative flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-black leading-none">{counts.up}<span className="text-sm text-muted-foreground font-normal">/{services.length}</span></div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Operational</div>
                  </div>
                </div>
              </Card>
              <Card className={`p-5 relative overflow-hidden ${activeIncidents > 0 ? "border-destructive/40" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${activeIncidents > 0 ? "bg-destructive/15 text-destructive" : "bg-muted/40 text-muted-foreground"}`}>
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-black leading-none">{activeIncidents}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Active Incidents</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="uppercase tracking-widest">Timeline</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-border">
                      <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                      {[0, 1, 5, 15].map((min) => (
                        <Button
                          key={min}
                          size="sm"
                          variant={autoInterval === min ? "default" : "outline"}
                          onClick={() => isOwner && setAutoInterval(min)}
                          disabled={!isOwner}
                          className="px-2.5"
                        >
                          {min === 0 ? "Off" : `${min}m`}
                        </Button>
                      ))}
                    </div>
                  </TooltipTrigger>
                  {!isOwner && (
                    <TooltipContent side="bottom">
                      <p>Only owners can change auto-refresh settings.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing} className="px-2.5">
                <RefreshCw className={`h-3.5 w-3.5 sm:mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{refreshing ? "Running…" : "Refresh"}</span>
              </Button>
              {RANGES.map((r) => (
                <Button
                  key={r.value}
                  size="sm"
                  variant={range === r.value ? "default" : "outline"}
                  onClick={() => setRange(r.value)}
                  className="px-2.5"
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>

          {/* SERVICE GRID */}
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((s) => {
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
              const statusLabel = { up: "Operational", degraded: "Degraded", down: "Outage", none: "No data" }[current];
              const accent =
                current === "down"
                  ? "hsl(var(--destructive))"
                  : current === "degraded"
                    ? "rgb(234 179 8)"
                    : current === "up"
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground))";
              const statusDotCls = {
                up: "bg-primary animate-pulse",
                degraded: "bg-yellow-500",
                down: "bg-destructive animate-pulse",
                none: "bg-muted-foreground",
              }[current];
              return (
                <Card
                  key={s.key}
                  className="group relative p-5 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderColor: current === "up" ? undefined : `${accent}55` }}
                >
                  <div
                    className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-1.5"
                    style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
                  />
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-display font-bold hover:text-primary hover:underline"
                        >
                          {s.name}
                        </a>
                      ) : (
                        <div className="font-display font-bold">{s.name}</div>
                      )}
                      <div className="text-xs text-muted-foreground truncate">{s.desc}</div>
                    </div>
                    <Badge variant="secondary" className="border-border shrink-0">
                      <span className={`h-2 w-2 rounded-full mr-1.5 ${statusDotCls}`} />
                      {statusLabel}
                    </Badge>
                  </div>
                  <DayGrid days={range} byDay={days ?? new Map()} />
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground mt-3">
                    <span>{range}d ago</span>
                    <span className="font-mono font-bold text-sm normal-case tracking-normal" style={{ color: accent }}>
                      {pct !== null ? `${pct.toFixed(2)}%` : loading ? "…" : "—"}
                    </span>
                    <span>Today</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* INCIDENTS */}
          {incidents.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/20" />
                <h2 className="font-display text-2xl font-bold">Recent Incidents</h2>
                <span className="text-xs text-muted-foreground">({incidents.length})</span>
              </div>
              <Card className="divide-y divide-border overflow-hidden">
                {incidents.map((i) => {
                  const svc = services.find((s) => s.key === i.service_key);
                  const ongoing = !i.closed_at;
                  const durMin = Math.max(
                    1,
                    Math.round(
                      ((i.closed_at ? new Date(i.closed_at).getTime() : Date.now()) - new Date(i.opened_at).getTime()) /
                        60000,
                    ),
                  );
                  return (
                    <Link
                      key={i.id}
                      to={`/status/${i.incident_number}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${ongoing ? "bg-destructive animate-pulse shadow-[0_0_8px_hsl(var(--destructive))]" : "bg-muted-foreground"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-semibold text-sm truncate">
                          #{i.incident_number} · {svc?.name ?? i.service_key}
                          {ongoing && (
                            <Badge variant="destructive" className="ml-2 text-[10px]">
                              Ongoing
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(i.opened_at).toLocaleString()} ·{" "}
                          {durMin < 60 ? `${durMin}m` : `${Math.floor(durMin / 60)}h ${durMin % 60}m`}
                          {i.last_error ? ` · ${i.last_error}` : ""}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 group-hover:text-primary transition" />
                    </Link>
                  );
                })}
              </Card>
            </div>
          )}

          {/* LEGEND */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="uppercase tracking-widest text-[10px]">Legend</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-primary shadow-[0_0_6px_hsl(var(--primary))]" /> Up
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]" /> Degraded
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-destructive shadow-[0_0_6px_hsl(var(--destructive))]" /> Outage
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-muted" /> No data
            </span>
          </div>
          {pageFootnote && (
            <p className="text-center text-xs text-muted-foreground mt-4 whitespace-pre-wrap">{pageFootnote}</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Status;
