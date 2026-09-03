import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { parseMcText } from "@/lib/mcColors";
import { Loader2, Save, Server } from "lucide-react";

type Settings = {
  id: string;
  server_ip: string;
  motd: string;
  motd_color: string;
};

const ANIMATION_NAME = "Server";

const buildLines = (s: Pick<Settings, "server_ip" | "motd" | "motd_color">) => {
  const color = s.motd_color?.trim() || "#ff3b30";
  const lines: string[] = [];
  if (s.motd.trim()) lines.push(`<${color}>&l${s.motd.trim()}`);
  if (s.server_ip.trim()) lines.push(`<${color}>&lIP &8• &f${s.server_ip.trim()}`);
  return lines.length ? lines : ["<#ff3b30>&lWelcome"];
};

export function ServerPanelAdminSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<Settings | null>(null);
  const [serverIp, setServerIp] = useState("");
  const [motd, setMotd] = useState("");
  const [motdColor, setMotdColor] = useState("#ff3b30");

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
        setMotdColor(data.motd_color ?? "#ff3b30");
      }
      setLoading(false);
    })();
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
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
            <Input id="server-ip" value={serverIp} onChange={(e) => setServerIp(e.target.value)} placeholder="play.carnagemc.net" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-motd">MOTD</Label>
            <Input id="server-motd" value={motd} onChange={(e) => setMotd(e.target.value)} placeholder="Welcome to CarnageMC" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-motd-color">MOTD color</Label>
            <div className="flex items-center gap-3">
              <input
                id="server-motd-color"
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(motdColor) ? motdColor : "#ff3b30"}
                onChange={(e) => setMotdColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border bg-background"
              />
              <Input value={motdColor} onChange={(e) => setMotdColor(e.target.value)} placeholder="#ff3b30" className="max-w-[160px]" />
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
