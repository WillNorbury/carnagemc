import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gauge,
  HelpCircle,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Timer,
  XCircle,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Range = 90 | 180;
type DayStatus = "up" | "degraded" | "down" | "none";

type DailyRow = {
  service_key: string;
  day: string;
  total_checks: number;
  up_checks: number;
  uptime_pct: number | null;
};

type Service = { key: string; name: string; desc: string; url: string };
type Incident = {
  id: string;
  incident_number: number;
  service_key: string;
  opened_at: string;
  closed_at: string | null;
  last_error: string | null;
};
type Check = {
  checked_at: string;
  is_up: boolean;
  latency_ms: number | null;
  status_code: number | null;
  error: string | null;
};

const RANGES: { label: string; value: Range }[] = [
  { label: "90 days", value: 90 },
  { label: "180 days", value: 180 },
];

const DEFAULT_SERVICES: Service[] = [
  { key: "website", name: "Website", desc: "Main site & dashboard", url: "" },
  { key: "minecraft", name: "Minecraft Server", desc: "mc.carnagemc.net", url: "" },
  { key: "api", name: "API & Database", desc: "Backend services", url: "" },
  { key: "panel", name: "Panel", desc: "panel.voxelnode.dev", url: "" },
  { key: "discord", name: "Discord Server", desc: "https://discord.gg/wD6K3nr2MG", url: "https://discord.carnagemc.net" },
  { key: "portfolio", name: "Portfolio", desc: "portfolio.carnagemc.net", url: "https://portfolio.carnagemc.net" },
];

const toDayKey = (d: Date) => d.toISOString().slice(0, 10);
const formatDate = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const formatDateTime = (value: string) => new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const statusFromPct = (pct: number | null, total: number): DayStatus => {
  if (!total || pct === null) return "none";
  if (pct >= 99) return "up";
  if (pct >= 80) return "degraded";
  return "down";
};

const statusMeta: Record<DayStatus, { label: string; summary: string; tone: string; dot: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  up: {
    label: "Operational",
    summary: "Systems are responding normally.",
    tone: "bg-emerald-500/10",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    border: "border-emerald-500/35",
    icon: CheckCircle2,
  },
  degraded: {
    label: "Degraded",
    summary: "One or more checks are slower than expected.",
    tone: "bg-amber-500/10",
    dot: "bg-amber-400",
    text: "text-amber-400",
    border: "border-amber-500/35",
    icon: AlertTriangle,
  },
  down: {
    label: "Outage",
    summary: "A service is currently failing checks.",
    tone: "bg-red-500/10",
    dot: "bg-red-400",
    text: "text-red-400",
    border: "border-red-500/35",
    icon: XCircle,
  },
  none: {
    label: "No data",
    summary: "Checks are still being collected.",
    tone: "bg-white/5",
    dot: "bg-[#5f6472]",
    text: "text-[#9ca3af]",
    border: "border-white/10",
    icon: HelpCircle,
  },
};

const dayColor = (status: DayStatus) => {
  if (status === "up") return "bg-emerald-500/80";
  if (status === "degraded") return "bg-amber-500/80";
  if (status === "down") return "bg-red-500/80";
  return "bg-white/10";
};


const getUptime = (days?: Map<string, { pct: number | null; total: number }>) => {
  let total = 0;
  let up = 0;
  if (days) {
    for (const v of days.values()) {
      total += v.total;
      up += Math.round(((v.pct ?? 0) / 100) * v.total);
    }
  }
  return total ? (100 * up) / total : null;
};

const DayGrid = ({ days, byDay }: { days: Range; byDay: Map<string, { pct: number | null; total: number }> }) => {
  const today = new Date();
  const cells = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (days - 1 - index));
    const key = toDayKey(date);
    const rec = byDay.get(key);
    const status = statusFromPct(rec?.pct ?? null, rec?.total ?? 0);
    return { date, key, status, pct: rec?.pct ?? null, total: rec?.total ?? 0 };
  });

  return (
    <div
      className="grid w-full min-w-0 gap-px overflow-hidden rounded-sm"
      style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}
      aria-label={`${days} day uptime timeline`}
    >
      {cells.map((cell) => (
        <span
          key={cell.key}
          className={cn("h-8 min-w-0 transition-opacity hover:opacity-80", dayColor(cell.status))}
          title={cell.total ? `${formatDate(cell.date)} — ${cell.pct?.toFixed(1)}% (${cell.total} checks)` : `${formatDate(cell.date)} — no data`}
        />
      ))}
    </div>
  );
};

const StatusPill = ({ status, className }: { status: DayStatus; className?: string }) => {
  const meta = statusMeta[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5 whitespace-nowrap", meta.border, meta.text, className)}>
      <span className={cn("h-2 w-2 rounded-full", meta.dot, status !== "none" && "animate-pulse")} />
      {meta.label}
    </Badge>
  );
};

const MiniMetric = ({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string | number }) => (
  <div className="rounded-lg border border-border bg-card/70 p-4 min-w-0">
    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
    <div className="font-display text-2xl font-bold leading-none truncate">{value}</div>
  </div>
);

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
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [detailChecks, setDetailChecks] = useState<Check[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [subEmail, setSubEmail] = useState("");
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subDone, setSubDone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setSubEmail(user.email);
    });
  }, []);

  const submitSubscribe = async () => {
    const email = subEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    setSubSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("status_subscribers")
      .insert({ email, user_id: user?.id ?? null });
    setSubSubmitting(false);
    if (error && !/duplicate|unique/i.test(error.message)) {
      toast({ title: "Couldn't subscribe", description: error.message, variant: "destructive" });
      return;
    }
    setSubDone(true);
    toast({ title: "You're subscribed", description: "We'll email you when incidents are posted or updated." });
  };

  useEffect(() => {
    document.title = "Status — CarnageMC";

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "owner")
        .maybeSingle()
        .then(({ data }) => setIsOwner(!!data));
    });

    supabase
      .from("site_content")
      .select("value")
      .eq("key", "status_page")
      .maybeSingle()
      .then(({ data }) => {
        const value = (data?.value as any) ?? {};
        if (value.title) setPageTitle(value.title);
        if (value.subtitle) setPageSubtitle(value.subtitle);
        if (typeof value.footnote === "string") setPageFootnote(value.footnote);
        if (Array.isArray(value.services) && value.services.length) setServices(value.services);
      });
  }, []);

  const loadData = async (days: Range) => {
    setLoading(true);
    const { data } = await supabase.rpc("get_uptime_daily", { _days: days });
    setRows((data ?? []) as DailyRow[]);

    const { data: incidentRows } = await supabase
      .from("uptime_incidents")
      .select("id, incident_number, service_key, opened_at, closed_at, last_error")
      .order("opened_at", { ascending: false })
      .limit(20);
    setIncidents((incidentRows ?? []) as Incident[]);
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
      // Manual refresh should not block the page if the check endpoint is unavailable.
    }
    await loadData(range);
    setRefreshing(false);
  };

  useEffect(() => {
    if (autoInterval <= 0) return;
    const id = window.setInterval(handleRefresh, autoInterval * 60_000);
    return () => window.clearInterval(id);
  }, [autoInterval, range]);

  useEffect(() => {
    if (!detailKey) return;
    setDetailLoading(true);
    setDetailChecks([]);
    supabase
      .from("uptime_checks")
      .select("checked_at, is_up, latency_ms, status_code, error")
      .eq("service_key", detailKey)
      .order("checked_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setDetailChecks((data ?? []) as Check[]);
        setDetailLoading(false);
      });
  }, [detailKey]);

  const byService = useMemo(() => {
    const map = new Map<string, Map<string, { pct: number | null; total: number }>>();
    for (const row of rows) {
      if (!map.has(row.service_key)) map.set(row.service_key, new Map());
      map.get(row.service_key)!.set(row.day, { pct: row.uptime_pct, total: Number(row.total_checks) });
    }
    return map;
  }, [rows]);

  const overall = useMemo(() => {
    let total = 0;
    let up = 0;
    for (const row of rows) {
      total += Number(row.total_checks);
      up += Number(row.up_checks);
    }
    return total ? (100 * up) / total : null;
  }, [rows]);

  const serviceCurrent: Record<string, DayStatus> = useMemo(() => {
    const today = toDayKey(new Date());
    const result: Record<string, DayStatus> = {};
    for (const service of services) {
      const rec = byService.get(service.key)?.get(today);
      result[service.key] = statusFromPct(rec?.pct ?? null, rec?.total ?? 0);
    }
    return result;
  }, [byService, services]);

  const currentStatus: DayStatus = useMemo(() => {
    const values = Object.values(serviceCurrent);
    if (values.includes("down")) return "down";
    if (values.includes("degraded")) return "degraded";
    if (values.every((value) => value === "none")) return "none";
    return "up";
  }, [serviceCurrent]);

  const statusCounts = useMemo(() => {
    const counts = { up: 0, degraded: 0, down: 0, none: 0 };
    for (const service of services) counts[serviceCurrent[service.key] ?? "none"] += 1;
    return counts;
  }, [serviceCurrent, services]);

  const activeIncidents = incidents.filter((incident) => !incident.closed_at).length;
  const currentMeta = statusMeta[currentStatus];
  const CurrentIcon = currentMeta.icon;

  const selectedService = detailKey ? services.find((service) => service.key === detailKey) : null;
  const selectedDays = detailKey ? byService.get(detailKey) : undefined;
  const selectedStatus = detailKey ? serviceCurrent[detailKey] ?? "none" : "none";
  const selectedIncidents = detailKey ? incidents.filter((incident) => incident.service_key === detailKey) : [];
  const selectedOpenIncidents = selectedIncidents.filter((incident) => !incident.closed_at).length;
  const selectedUptime = getUptime(selectedDays);
  const lastCheck = detailChecks[0];
  const avgLatency = useMemo(() => {
    const latencies = detailChecks.filter((check) => check.is_up && check.latency_ms != null).map((check) => check.latency_ms!);
    return latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : null;
  }, [detailChecks]);

  const daySummary = useMemo(() => {
    const summary = { up: 0, degraded: 0, down: 0, none: 0 };
    if (!selectedDays) return { ...summary, none: range };
    for (const value of selectedDays.values()) summary[statusFromPct(value.pct, value.total)] += 1;
    summary.none += Math.max(0, range - selectedDays.size);
    return summary;
  }, [selectedDays, range]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-slate-100">
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap"
        rel="stylesheet"
      />
      <Navbar />
      <main className="flex-1 w-full font-['Inter']">
        <div className="max-w-6xl w-full mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col gap-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
            <div className="space-y-2 min-w-0">
              <span className="text-[#ff5722] font-mono text-sm tracking-widest uppercase">
                Live Uptime
              </span>
              <h1 className="text-6xl md:text-8xl font-bold font-['Space_Grotesk'] tracking-tighter italic break-words">
                STATUS
              </h1>
              <p className="text-[#9ca3af] max-w-xl">{pageSubtitle}</p>
            </div>

            <div
              className={cn(
                "relative bg-[#1a1a24] border p-5 min-w-[260px]",
                currentStatus === "up" && "border-emerald-500/30",
                currentStatus === "degraded" && "border-amber-500/40",
                currentStatus === "down" && "border-red-500/40",
                currentStatus === "none" && "border-white/10",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center border",
                    currentStatus === "up" && "border-emerald-500/40 text-emerald-400",
                    currentStatus === "degraded" && "border-amber-500/40 text-amber-400",
                    currentStatus === "down" && "border-red-500/40 text-red-400",
                    currentStatus === "none" && "border-white/10 text-[#9ca3af]",
                  )}
                >
                  <CurrentIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-['Space_Grotesk'] text-2xl font-bold leading-none">
                    {overall !== null ? `${overall.toFixed(2)}%` : "—"}
                  </div>
                  <div
                    className={cn(
                      "mt-2 text-[10px] font-mono tracking-widest uppercase",
                      currentStatus === "up" && "text-emerald-400",
                      currentStatus === "degraded" && "text-amber-400",
                      currentStatus === "down" && "text-red-400",
                      currentStatus === "none" && "text-[#9ca3af]",
                    )}
                  >
                    {currentMeta.label}
                  </div>
                  <p className="mt-1 text-xs text-[#9ca3af]">{currentMeta.summary}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick metrics */}
          <div className="-mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "Services up", value: `${statusCounts.up}/${services.length}` },
              { icon: Zap, label: "Active incidents", value: activeIncidents },
              { icon: Activity, label: "Window", value: `${range} days` },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-[#1a1a24] border border-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#9ca3af]">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[#ff5722]" />
                    <span className="truncate">{m.label}</span>
                  </div>
                  <div className="font-['Space_Grotesk'] text-2xl font-bold leading-none truncate">
                    {m.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="-mt-6 flex flex-col gap-3 border-b border-white/5 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-mono text-[#ff5722] uppercase tracking-[0.3em]">
                Service History
              </h2>
              <p className="text-xs text-[#9ca3af] mt-1">
                Select a row for recent checks, latency, and incident history.
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 border border-white/10 p-1">
                      <Timer className="ml-2 h-3.5 w-3.5 text-[#9ca3af]" />
                      {[0, 1, 5, 15].map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => isOwner && setAutoInterval(min)}
                          disabled={!isOwner}
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase transition",
                            autoInterval === min
                              ? "bg-[#ff5722] text-white"
                              : "text-[#9ca3af] hover:text-[#ff5722]",
                            !isOwner && "opacity-40 cursor-not-allowed hover:text-[#9ca3af]",
                          )}
                        >
                          {min === 0 ? "Off" : `${min}m`}
                        </button>
                      ))}
                    </div>
                  </TooltipTrigger>
                  {!isOwner && (
                    <TooltipContent side="bottom">
                      <p>Only owners can change auto-refresh.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-[10px] font-mono tracking-widest uppercase text-[#9ca3af] hover:border-[#ff5722] hover:text-[#ff5722] transition disabled:opacity-40"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                <span className="hidden sm:inline">{refreshing ? "Running" : "Refresh"}</span>
              </button>
              <div className="flex items-center border border-white/10 p-1">
                {RANGES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRange(item.value)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-mono tracking-widest uppercase transition",
                      range === item.value
                        ? "bg-[#ff5722] text-white"
                        : "text-[#9ca3af] hover:text-[#ff5722]",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Service list */}
          <section className="-mt-6 space-y-3">
            {services.map((service) => {
              const status = serviceCurrent[service.key] ?? "none";
              const meta = statusMeta[status];
              const days = byService.get(service.key) ?? new Map<string, { pct: number | null; total: number }>();
              const uptime = getUptime(days);
              return (
                <div
                  key={service.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailKey(service.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setDetailKey(service.key);
                    }
                  }}
                  className="group min-w-0 cursor-pointer overflow-hidden p-4 bg-[#1a1a24] border border-white/5 hover:border-[#ff5722]/40 transition focus:outline-none focus-visible:border-[#ff5722]"
                >
                  <div className="grid min-w-0 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_8rem] lg:items-center">
                    <div className="min-w-0">
                      <div className="mb-1 flex min-w-0 items-center gap-2">
                        <span className="font-['Space_Grotesk'] font-bold truncate group-hover:text-[#ff5722] transition-colors">
                          {service.name}
                        </span>
                        {service.url && (
                          <a
                            href={service.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Open ${service.name}`}
                            className="shrink-0 text-[#9ca3af] hover:text-[#ff5722] transition-colors"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <div className="truncate text-xs text-[#9ca3af]">{service.desc}</div>
                    </div>

                    <div className="min-w-0">
                      <DayGrid days={range} byDay={days} />
                      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-[#5f6472]">
                        <span>{range}d ago</span>
                        <span>today</span>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center justify-between gap-3 lg:justify-end">
                      <div className="text-left lg:text-right min-w-0">
                        <div className={cn("font-['Space_Grotesk'] text-lg font-bold leading-none", meta.text)}>
                          {uptime !== null ? `${uptime.toFixed(2)}%` : loading ? "…" : "—"}
                        </div>
                        <div className="mt-1 flex lg:justify-end">
                          <StatusPill status={status} />
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#5f6472] transition-transform group-hover:translate-x-0.5 group-hover:text-[#ff5722]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {incidents.length > 0 && (
            <section className="-mt-4">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-sm font-mono text-[#ff5722] uppercase tracking-[0.3em]">
                  Recent Incidents
                </h2>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#9ca3af]">
                  {incidents.length}
                </span>
              </div>
              <div className="bg-[#1a1a24] border border-white/5 divide-y divide-white/5 overflow-hidden">
                {incidents.map((incident) => {
                  const service = services.find((item) => item.key === incident.service_key);
                  const ongoing = !incident.closed_at;
                  const duration = Math.max(
                    1,
                    Math.round(((incident.closed_at ? new Date(incident.closed_at).getTime() : Date.now()) - new Date(incident.opened_at).getTime()) / 60000),
                  );
                  return (
                    <Link
                      key={incident.id}
                      to={`/status/${incident.incident_number}`}
                      className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-[#23232f] group"
                    >
                      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", ongoing ? "bg-red-500 animate-pulse" : "bg-[#5f6472]")} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold font-['Space_Grotesk'] group-hover:text-[#ff5722] transition-colors">
                          #{incident.incident_number} · {service?.name ?? incident.service_key}
                        </span>
                        <span className="block truncate text-xs text-[#9ca3af]">
                          {formatDateTime(incident.opened_at)} · {duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60}m`}
                          {incident.last_error ? ` · ${incident.last_error}` : ""}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#5f6472] group-hover:text-[#ff5722] transition" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section className="-mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#9ca3af]">
            <span className="uppercase tracking-widest text-[10px] font-mono text-[#5f6472]">Legend</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 bg-emerald-500" /> Up</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 bg-amber-500" /> Degraded</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 bg-red-500" /> Outage</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 bg-white/10" /> No data</span>
          </section>
          {pageFootnote && <p className="-mt-6 whitespace-pre-wrap text-center text-xs text-[#5f6472]">{pageFootnote}</p>}
        </div>
      </main>
      <Footer />


      <Dialog open={!!detailKey} onOpenChange={(open) => !open && setDetailKey(null)}>
        <DialogContent className="left-0 right-0 top-auto bottom-0 max-h-[88vh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto overflow-x-hidden rounded-t-lg p-4 sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:w-[min(48rem,calc(100vw-2rem))] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6">
          {selectedService && (
            <>
              <DialogHeader className="pr-8 text-left">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <DialogTitle className="font-display text-2xl leading-tight break-words">{selectedService.name}</DialogTitle>
                  <StatusPill status={selectedStatus} />
                </div>
                <DialogDescription className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0 break-words">{selectedService.desc}</span>
                  {selectedService.url && (
                    <a href={selectedService.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border-l border-border pl-2 text-primary hover:underline">
                      Visit <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MiniMetric icon={Activity} label="Uptime" value={selectedUptime !== null ? `${selectedUptime.toFixed(2)}%` : "—"} />
                <MiniMetric icon={Gauge} label="Avg latency" value={avgLatency !== null ? `${avgLatency}ms` : "—"} />
                <MiniMetric icon={Zap} label="Incidents" value={selectedOpenIncidents ? `${selectedIncidents.length} (${selectedOpenIncidents} open)` : selectedIncidents.length} />
                <MiniMetric icon={Clock} label="Last check" value={lastCheck ? new Date(lastCheck.checked_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—"} />
              </div>

              <section className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Day breakdown
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["up", "degraded", "down", "none"] as DayStatus[]).map((status) => (
                    <div key={status} className={cn("rounded-lg border p-3", statusMeta[status].border, statusMeta[status].tone)}>
                      <div className={cn("font-display text-xl font-bold", statusMeta[status].text)}>{daySummary[status]}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{statusMeta[status].label}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-5">
                <div className="mb-2 text-sm font-semibold">Recent checks</div>
                {detailLoading ? (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Loading…</div>
                ) : detailChecks.length === 0 ? (
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">No recent checks recorded.</div>
                ) : (
                  <Card className="max-h-64 divide-y divide-border overflow-y-auto overflow-x-hidden">
                    {detailChecks.map((check, index) => (
                      <div key={`${check.checked_at}-${index}`} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-xs">
                        {check.is_up ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[10px] text-muted-foreground">{formatDateTime(check.checked_at)}</span>
                          <span className="block truncate">
                            {check.is_up ? "Up" : "Down"}
                            {check.status_code != null ? ` · HTTP ${check.status_code}` : ""}
                            {check.error ? ` · ${check.error}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-muted-foreground">{check.latency_ms != null ? `${check.latency_ms}ms` : "—"}</span>
                      </div>
                    ))}
                  </Card>
                )}
              </section>

              {selectedIncidents.length > 0 && (
                <section className="mt-5">
                  <div className="mb-2 text-sm font-semibold">Incidents for {selectedService.name}</div>
                  <Card className="divide-y divide-border overflow-hidden">
                    {selectedIncidents.map((incident) => {
                      const ongoing = !incident.closed_at;
                      const duration = Math.max(
                        1,
                        Math.round(((incident.closed_at ? new Date(incident.closed_at).getTime() : Date.now()) - new Date(incident.opened_at).getTime()) / 60000),
                      );
                      return (
                        <Link key={incident.id} to={`/status/${incident.incident_number}`} onClick={() => setDetailKey(null)} className="flex min-w-0 items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-muted/40">
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", ongoing ? "bg-destructive animate-pulse" : "bg-muted-foreground")} />
                          <span className="shrink-0 font-semibold">#{incident.incident_number}</span>
                          <span className="min-w-0 flex-1 truncate text-muted-foreground">
                            {formatDateTime(incident.opened_at)} · {duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60}m`}
                            {incident.last_error ? ` · ${incident.last_error}` : ""}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </Link>
                      );
                    })}
                  </Card>
                </section>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Status;