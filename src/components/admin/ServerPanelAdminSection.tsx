import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { parseMcText } from "@/lib/mcColors";
import { Loader2, RefreshCw, Save, Server, Signal, Users, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Settings = {
  id: string;
  server_ip: string;
  motd: string;
  motd_color: string;
};

const ANIMATION_NAME = "Server";

type LiveStatus = {
  ok: boolean;
  ip?: string;
  online?: boolean;
  players?: number;
  max?: number;
  version?: string | null;
  motd?: string;
  latency_ms?: number | null;
  uptime_pct?: number | null;
  checked_at?: string;
  error?: string;
};

const buildLines = (s: Pick<Settings, "server_ip" | "motd" | "motd_color">) => {
  const color = s.motd_color?.trim() || "#0082A2";
  const lines: string[] = [];
  if (s.motd.trim()) lines.push(`<${color}>&l${s.motd.trim()}`);
  if (s.server_ip.trim()) lines.push(`<${color}>&lIP &8• &f${s.server_ip.trim()}`);
  return lines.length ? lines : ["<#0082A2>&lWelcome"];
};

export function ServerPanelAdminSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<Settings | null>(null);
  const [serverIp, setServerIp] = useState("");
  const [motd, setMotd] = useState("");
  const [motdColor, setMotdColor] = useState("#0082A2");
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const refreshStatus = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("server-panel-status", { body: {} });
      if (error) throw error;
      setStatus(data as LiveStatus);
      if ((data as LiveStatus)?.motd) setMotd((data as LiveStatus).motd as string);
    } catch (e) {
      setStatus({ ok: false, error: e instanceof Error ? e.message : "Status check failed" });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("server_panel_settings")
        .select("id, server_ip, motd, motd_color")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) toast({ title: "Failed to load settings", description: error.message, variant: "destructive" });
      if (data) {
        setRow(data as Settings);
        setServerIp(data.server_ip ?? "");
        setMotd(data.motd ?? "");
        setMotdColor(data.motd_color ?? "#0082A2");
      }
      setLoading(false);
      void refreshStatus();
    })();
    const t = setInterval(() => void refreshStatus(), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { server_ip: serverIp.trim(), motd: motd.trim(), motd_color: motdColor };

      let id = row?.id;
      if (id) {
        const { error } = await supabase.from("server_panel_settings").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("server_panel_settings")
          .insert(payload)
          .select("id, server_ip, motd, motd_color")
          .single();
        if (error) throw error;
        id = data.id;
        setRow(data as Settings);
      }

      // Keep the /tab animation in sync
      const lines = buildLines(payload);
      const { data: existing, error: findErr } = await supabase
        .from("tab_animations")
        .select("id")
        .eq("name", ANIMATION_NAME)
        .is("user_id", null)
        .maybeSingle();
      if (findErr) throw findErr;

      if (existing) {
        const { error } = await supabase
          .from("tab_animations")
          .update({ lines, published: true })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tab_animations")
          .insert({ name: ANIMATION_NAME, lines, change_interval: 2500, published: true });
        if (error) throw error;
      }

      toast({ title: "Saved", description: "Server details updated and /tab animations synced." });
      void refreshStatus();
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-10">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading server panel…
      </div>
    );
  }

  const preview = buildLines({ server_ip: serverIp, motd, motd_color: motdColor });

  const statBox = (label: string, value: string, Icon: typeof Users) => (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Live server status
              {status?.ok && (
                <Badge variant={status.online ? "default" : "destructive"}>
                  {status.online ? "Online" : "Offline"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {status?.checked_at
                ? `Last checked ${new Date(status.checked_at).toLocaleTimeString()} • auto-refreshes every minute`
                : "Pinging the configured server IP…"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refreshStatus()} disabled={checking}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {status && !status.ok ? (
            <p className="text-sm text-destructive">{status.error ?? "Unable to reach the server."}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {statBox("Players online", status ? `${status.players ?? 0}/${status.max ?? 0}` : "—", Users)}
              {statBox("Ping", status?.latency_ms != null ? `${status.latency_ms} ms` : "—", Signal)}
              {statBox("Uptime (30d)", status?.uptime_pct != null ? `${status.uptime_pct}%` : "—", Activity)}
            </div>
          )}
          {status?.version && (
            <p className="mt-3 text-xs text-muted-foreground">Version: {status.version}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" /> Server details
          </CardTitle>
          <CardDescription>Set the public IP and MOTD. Saving updates the /tab animations automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-ip">Server IP</Label>
            <Input id="server-ip" value={serverIp} onChange={(e) => setServerIp(e.target.value)} placeholder="play.warden.rip" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-motd">MOTD</Label>
            <Input id="server-motd" value={motd} onChange={(e) => setMotd(e.target.value)} placeholder="Welcome to Warden Network" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-motd-color">MOTD color</Label>
            <div className="flex items-center gap-3">
              <input
                id="server-motd-color"
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(motdColor) ? motdColor : "#0082A2"}
                onChange={(e) => setMotdColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border bg-background"
              />
              <Input value={motdColor} onChange={(e) => setMotdColor(e.target.value)} placeholder="#0082A2" className="max-w-[160px]" />
            </div>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save & sync /tab
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <CardDescription>How these lines appear in the TAB list animation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm space-y-2">
            {preview.map((line, i) => (
              <div key={i}>{parseMcText(line)}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
