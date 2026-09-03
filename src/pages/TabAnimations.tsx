import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { parseMcText } from "@/lib/mcColors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Save, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

const buildYaml = (groups: TabAnimation[]): string =>
  groups
    .map(
      (g) =>
        `${g.name}:\n  change-interval: ${g.change_interval}\n  texts:\n${g.lines
          .map((l) => `  - "${l}"`)
          .join("\n")}`,
    )
    .join("\n\n");

const downloadYaml = (groups: TabAnimation[], filename = "animations.yml") => {
  if (groups.length === 0) {
    toast.error("No animation groups to export");
    return;
  }
  const yaml = buildYaml(groups) + "\n";
  const blob = new Blob([yaml], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Downloaded animations.yml");
};
import { confirm } from "@/lib/confirm";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

type TabAnimation = {
  id: string;
  name: string;
  change_interval: number;
  lines: string[];
  sort_order: number;
  user_id?: string | null;
};

export const AnimatedLine = ({ anim }: { anim: TabAnimation }) => {
  const frames = anim.lines.length ? anim.lines : [""];
  const [rawIdx, setIdx] = useState(0);
  const idx = rawIdx % frames.length;

  useEffect(() => {
    setIdx(0);
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
      {parseMcText(frames[idx], `${anim.id}-${idx}-`) || " "}
    </div>
  );
};

const McPreview = ({ groups }: { groups: TabAnimation[] }) => (
  <div className="rounded-lg border border-border bg-black/80 p-6 shadow-xl">
    <div className="mx-auto w-fit min-w-[280px] rounded bg-[#1a1a1a]/90 px-6 py-4 space-y-1">
      {groups.map((g) => (
        <AnimatedLine key={g.id} anim={g} />
      ))}
    </div>
  </div>
);

type Draft = {
  id?: string;
  name: string;
  change_interval: number;
  linesText: string;
};

const emptyDraft = (): Draft => ({ name: "My Links", change_interval: 2500, linesText: "" });

const draftToAnim = (d: Draft): TabAnimation => ({
  id: d.id ?? "draft",
  name: d.name,
  change_interval: d.change_interval,
  lines: d.linesText.split("\n").filter((l) => l.trim().length > 0),
  sort_order: 0,
});

const MyLinksEditor = ({ user }: { user: User }) => {
  const [mine, setMine] = useState<TabAnimation[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase.from("tab_animations" as any) as any)
      .select("id,name,change_interval,lines,sort_order,user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else
      setMine(
        ((data ?? []) as any[]).map((r) => ({
          ...r,
          lines: Array.isArray(r.lines) ? r.lines.filter((l: any) => typeof l === "string") : [],
        })),
      );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const save = async () => {
    if (!draft) return;
    const lines = draft.linesText.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      toast.error("Add at least one text line");
      return;
    }
    setSaving(true);
    const payload = {
      name: draft.name.trim() || "My Links",
      change_interval: Math.max(250, Number(draft.change_interval) || 2500),
      lines,
      user_id: user.id,
      published: false,
      updated_at: new Date().toISOString(),
    };
    const q = draft.id
      ? (supabase.from("tab_animations" as any) as any).update(payload).eq("id", draft.id)
      : (supabase.from("tab_animations" as any) as any).insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(draft.id ? "Links updated" : "Links created");
      setDraft(null);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!(await confirm("Delete this link animation?"))) return;
    const { error } = await (supabase.from("tab_animations" as any) as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Your Links</h2>
          <p className="text-sm text-muted-foreground">
            Create your own animated link lines. Only you can see them.
          </p>
        </div>
        {!draft && (
          <Button onClick={() => setDraft(emptyDraft())} className="gap-2">
            <Plus className="h-4 w-4" /> Create
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {mine.length > 0 && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadYaml(mine, "my-animations.yml")}>
                  <Download className="h-4 w-4" /> Download animations.yml
                </Button>
              </div>
              <McPreview groups={mine} />
              {mine.map((g) => (
                <div key={g.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{g.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      change-interval: {g.change_interval} • {g.lines.length} frame{g.lines.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraft({
                          id: g.id,
                          name: g.name,
                          change_interval: g.change_interval,
                          linesText: g.lines.join("\n"),
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(g.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mine.length === 0 && !draft && (
            <p className="text-muted-foreground text-sm mb-6">
              You haven't created any links yet — hit <strong>Create</strong> to make your first animated group.
            </p>
          )}

          {draft && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="my-name">Name</Label>
                  <Input
                    id="my-name"
                    value={draft.name}
                    maxLength={60}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="my-interval">change-interval (ms)</Label>
                  <Input
                    id="my-interval"
                    type="number"
                    min={250}
                    step={100}
                    value={draft.change_interval}
                    onChange={(e) => setDraft({ ...draft, change_interval: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="my-texts">texts (one frame per line)</Label>
                <Textarea
                  id="my-texts"
                  rows={5}
                  className="font-mono text-sm"
                  placeholder={'<#00748c>&lDISCORD &8• &fdiscord.example.net\n<#006371>&lWEBSITE &8• &fexample.net'}
                  value={draft.linesText}
                  onChange={(e) => setDraft({ ...draft, linesText: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Supports &amp; codes (&amp;l, &amp;7…), hex like &lt;#00748c&gt; or &amp;#00748c. Max 200 chars per line.
                </p>
              </div>

              {draft.linesText.trim() && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Live preview</p>
                  <McPreview groups={[draftToAnim(draft)]} />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={save} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {draft.id ? "Save changes" : "Create links"}
                </Button>
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

const TabAnimations = () => {
  const [rows, setRows] = useState<TabAnimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      const [{ data: animationData }, { data: serverSettings }] = await Promise.all([
        (supabase.from("tab_animations" as any) as any)
          .select("id,name,change_interval,lines,sort_order")
          .eq("published", true)
          .is("user_id", null)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("server_panel_settings")
          .select("server_ip, motd, motd_color")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      const animations = ((animationData ?? []) as any[]).map((r) => ({
        ...r,
        lines: Array.isArray(r.lines) ? r.lines.filter((l: any) => typeof l === "string") : [],
      }));
      const settings = serverSettings as { server_ip?: string; motd?: string; motd_color?: string } | null;
      const serverLines = settings
        ? [
            settings.motd?.trim() ? `<${settings.motd_color || "#ff3b30"}>&l${settings.motd.trim()}` : "",
            settings.server_ip?.trim() ? `<${settings.motd_color || "#ff3b30"}>&lIP &8• &f${settings.server_ip.trim()}` : "",
          ].filter(Boolean)
        : [];
      const synced = animations.some((animation) => animation.name === "Server")
        ? animations.map((animation) => animation.name === "Server" && serverLines.length ? { ...animation, lines: serverLines } : animation)
        : animations;
      setRows(synced);
      setLoading(false);
    })();
  }, []);

  const groups = useMemo(() => rows, [rows]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Tab Animations | Warden Network</title>
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
            <div className="flex items-center justify-end">
              <Button variant="outline" className="gap-2" onClick={() => downloadYaml(groups)}>
                <Download className="h-4 w-4" /> Download animations.yml
              </Button>
            </div>
            <McPreview groups={groups} />

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

        {user ? (
          <MyLinksEditor user={user} />
        ) : (
          <section className="mt-14 rounded-lg border border-border bg-card p-5 text-center">
            <h2 className="text-xl font-bold mb-1">Create your own links</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to build your own animated TAB link groups with a live preview.
            </p>
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TabAnimations;
