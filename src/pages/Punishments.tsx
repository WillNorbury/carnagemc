import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Ban, MicOff, Footprints, AlertTriangle, Search, Shield, Clock, ExternalLink, ShieldOff, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Punishment = {
  id: number;
  uuid: string;
  reason: string | null;
  issued_by: string | null;
  removed_by: string | null;
  removed_reason: string | null;
  removed_at: string | null;
  issued_at: string | null;
  expires_at: string | null;
  permanent: boolean;
  active: boolean;
  ip_ban: boolean;
  server: string | null;
};

type LookupResponse = {
  player: { uuid: string; username: string | null };
  counts: Record<string, number>;
  bans: Punishment[];
  mutes: Punishment[];
  kicks: Punishment[];
  warnings: Punishment[];
};

const KIND_META = {
  bans: { label: "Bans", icon: Ban, color: "text-destructive" },
  mutes: { label: "Mutes", icon: MicOff, color: "text-orange-400" },
  kicks: { label: "Kicks", icon: Footprints, color: "text-yellow-400" },
  warnings: { label: "Warnings", icon: AlertTriangle, color: "text-amber-400" },
} as const;

function fmt(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

function StatusBadge({ p }: { p: Punishment }) {
  if (p.removed_at) return <Badge variant="secondary">Removed</Badge>;
  if (!p.active) return <Badge variant="outline">Inactive</Badge>;
  if (p.permanent) return <Badge variant="destructive">Permanent</Badge>;
  if (p.expires_at && new Date(p.expires_at) < new Date()) return <Badge variant="outline">Expired</Badge>;
  return <Badge className="bg-primary">Active</Badge>;
}

function PunishmentRow({ p }: { p: Punishment }) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium break-words">{p.reason || <span className="text-muted-foreground italic">No reason provided</span>}</div>
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" /> {p.issued_by ?? "Console"}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmt(p.issued_at)}</span>
            {p.expires_at && !p.permanent && <span>Until: {fmt(p.expires_at)}</span>}
            {p.permanent && <span>Permanent</span>}
            {p.ip_ban && <Badge variant="outline" className="h-4 px-1 text-[10px]">IP</Badge>}
            {p.server && <span>Server: {p.server}</span>}
          </div>
          {p.removed_at && (
            <div className="text-xs text-muted-foreground mt-1">
              Removed by <span className="text-foreground">{p.removed_by ?? "Console"}</span> on {fmt(p.removed_at)}
              {p.removed_reason ? ` — ${p.removed_reason}` : ""}
            </div>
          )}
        </div>
        <StatusBadge p={p} />
      </div>
    </Card>
  );
}

const Punishments = () => {
  const { player } = useParams();
  const nav = useNavigate();
  const [query, setQuery] = useState(player ?? "");
  const [data, setData] = useState<LookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!player) { setData(null); return; }
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchOnce = async (isInitial: boolean) => {
      if (isInitial) { setLoading(true); setError(null); }
      try {
        const fnUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/punishments-lookup?player=${encodeURIComponent(player)}&_=${Date.now()}`;
        const r = await fetch(fnUrl, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
          cache: "no-store",
        });
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) { setError(j?.error ?? "Lookup failed"); if (isInitial) setData(null); }
        else { setData(j as LookupResponse); setError(null); }
      } catch (e: any) {
        if (!cancelled && isInitial) setError(e?.message ?? "Network error");
      } finally {
        if (!cancelled && isInitial) setLoading(false);
      }
    };

    fetchOnce(true);
    timer = setInterval(() => fetchOnce(false), 1000);
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [player]);

  const total = useMemo(() => data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0, [data]);
  const headTitle = player ? `${data?.player.username ?? player} — Punishment History` : "Punishment Lookup";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={`${headTitle} — CarnageMC`} description="Public ban, mute, kick, and warning history for any player on the network." />
      <Navbar />
      <main className="container pt-24 pb-16 max-w-4xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl md:text-4xl font-bold">Punishment Lookup</h1>
          <p className="text-muted-foreground mt-1">Search any player by Minecraft username or UUID to view their full network history.</p>
        </div>

        <form
          className="flex gap-2 mb-8"
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            if (q) nav(`/punishments/${encodeURIComponent(q)}`);
          }}
        >
          <Input
            placeholder="Username or UUID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="font-mono"
          />
          <Button type="submit"><Search className="h-4 w-4 mr-1" /> Lookup</Button>
        </form>

        {!player && (
          <Card className="p-8 text-center text-muted-foreground">
            Enter a username or UUID above to view their punishment history.
          </Card>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )}

        {error && !loading && (
          <Card className="p-6 border-destructive/40">
            <div className="font-medium text-destructive">Lookup failed</div>
            <div className="text-sm text-muted-foreground mt-1">{error}</div>
          </Card>
        )}

        {data && !loading && (
          <>
            <Card className="p-5 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={`https://crafatar.com/avatars/${data.player.uuid}?size=64&overlay`}
                  alt={data.player.username ?? data.player.uuid}
                  className="h-16 w-16 rounded-md border border-border"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-bold truncate">
                    {data.player.username ?? "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono break-all">{data.player.uuid}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(["bans","mutes","kicks","warnings"] as const).map((k) => (
                      <Badge key={k} variant="outline" className="text-xs">
                        {data.counts[k] ?? 0} {KIND_META[k].label.toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
                <a
                  href={`https://namemc.com/profile/${data.player.uuid}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  NameMC <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </Card>

            {total === 0 ? (
              <Card className="p-8 text-center">
                <Shield className="h-10 w-10 mx-auto text-primary mb-2" />
                <div className="font-medium">Clean record</div>
                <div className="text-sm text-muted-foreground">No punishments on file.</div>
              </Card>
            ) : (
              <Tabs defaultValue="bans">
                <TabsList className="grid grid-cols-4 w-full">
                  {(["bans","mutes","kicks","warnings"] as const).map((k) => {
                    const Icon = KIND_META[k].icon;
                    return (
                      <TabsTrigger key={k} value={k} className="text-xs">
                        <Icon className={`h-3 w-3 mr-1 ${KIND_META[k].color}`} />
                        {KIND_META[k].label} ({data.counts[k] ?? 0})
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {(["bans","mutes","kicks","warnings"] as const).map((k) => (
                  <TabsContent key={k} value={k} className="space-y-3 mt-4">
                    {data[k].length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8">No {KIND_META[k].label.toLowerCase()} on record.</div>
                    ) : data[k].map((p) => <PunishmentRow key={`${k}-${p.id}`} p={p} />)}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Punishments;
