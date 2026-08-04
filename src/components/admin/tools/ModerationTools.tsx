import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";

const useRows = <T,>(loader: () => Promise<T[]>, deps: unknown[] = []) => {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = async () => {
    setLoading(true);
    try {
      setRows(await loader());
    } catch (e) {
      toast.error((e as Error).message);
    }
    setLoading(false);
  };
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { rows, setRows, loading, reload };
};

export const ToolShell = ({
  title,
  description,
  onRefresh,
  children,
}: {
  title: string;
  description?: string;
  onRefresh?: () => void;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      )}
    </div>
    {children}
  </div>
);

export const Loading = () => (
  <div className="flex items-center gap-2 text-muted-foreground py-8">
    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
  </div>
);

export const Empty = ({ label }: { label: string }) => (
  <p className="text-sm text-muted-foreground py-8">{label}</p>
);

/* ------------------------------------------------------------------ */
/* Community Skripts moderation                                        */
/* ------------------------------------------------------------------ */
type SkriptRow = {
  id: string;
  name: string;
  description: string | null;
  version: string | null;
  downloads: number | null;
  published: boolean;
  created_at: string;
};

export const SkriptsModerationSection = () => {
  const [q, setQ] = useState("");
  const { rows, setRows, loading, reload } = useRows<SkriptRow>(async () => {
    const { data, error } = await supabase
      .from("user_skripts")
      .select("id,name,description,version,downloads,published,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SkriptRow[];
  });

  const filtered = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())),
    [rows, q],
  );

  const toggle = async (row: SkriptRow, published: boolean) => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, published } : r)));
    const { error } = await supabase.from("user_skripts").update({ published }).eq("id", row.id);
    if (error) {
      toast.error(error.message);
      reload();
    }
  };

  const remove = async (row: SkriptRow) => {
    if (!(await confirm({ title: `Delete "${row.name}"?`, description: "This removes the Skript for everyone." })))
      return;
    const { error } = await supabase.from("user_skripts").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    toast.success("Skript deleted");
  };

  return (
    <ToolShell
      title="Community Skripts"
      description="Unpublish or remove Skripts uploaded by members from /skripts."
      onRefresh={reload}
    >
      <Input placeholder="Search skripts…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      {loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty label="No skripts found." />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="p-3 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.version ? `v${r.version} · ` : ""}
                  {r.downloads ?? 0} downloads · {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={r.published} onCheckedChange={(v) => toggle(r, v)} />
                <Label className="text-xs">Published</Label>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </ToolShell>
  );
};

/* ------------------------------------------------------------------ */
/* Community Servers moderation                                        */
/* ------------------------------------------------------------------ */
type ServerRow = {
  id: string;
  name: string;
  slug: string;
  ip: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
};

export const ServersModerationSection = () => {
  const [q, setQ] = useState("");
  const { rows, setRows, loading, reload } = useRows<ServerRow>(async () => {
    const { data, error } = await supabase
      .from("user_servers")
      .select("id,name,slug,ip,published,featured,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ServerRow[];
  });

  const filtered = rows.filter(
    (r) => r.name.toLowerCase().includes(q.toLowerCase()) || (r.ip ?? "").includes(q),
  );

  const patch = async (row: ServerRow, p: Partial<ServerRow>) => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...p } : r)));
    const { error } = await supabase.from("user_servers").update(p).eq("id", row.id);
    if (error) {
      toast.error(error.message);
      reload();
    }
  };

  const remove = async (row: ServerRow) => {
    if (!(await confirm({ title: `Delete "${row.name}"?`, description: "This cannot be undone." }))) return;
    const { error } = await supabase.from("user_servers").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    toast.success("Server deleted");
  };

  return (
    <ToolShell
      title="Community Servers"
      description="Moderate member-submitted servers shown on /servers."
      onRefresh={reload}
    >
      <Input placeholder="Search by name or IP…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      {loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty label="No servers found." />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="p-3 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground truncate">{r.ip ?? "no IP"} · /servers/{r.slug}</div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={r.published} onCheckedChange={(v) => patch(r, { published: v })} />
                <Label className="text-xs">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={r.featured} onCheckedChange={(v) => patch(r, { featured: v })} />
                <Label className="text-xs">Featured</Label>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={`/servers/${r.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </ToolShell>
  );
};

/* ------------------------------------------------------------------ */
/* Mods moderation                                                     */
/* ------------------------------------------------------------------ */
type ModRow = {
  id: string;
  name: string;
  slug: string | null;
  author: string | null;
  category: string | null;
  published: boolean;
  featured: boolean;
};

export const ModsModerationSection = () => {
  const [q, setQ] = useState("");
  const { rows, setRows, loading, reload } = useRows<ModRow>(async () => {
    const { data, error } = await supabase
      .from("mods")
      .select("id,name,slug,author,category,published,featured")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ModRow[];
  });

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  const patch = async (row: ModRow, p: Partial<ModRow>) => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...p } : r)));
    const { error } = await supabase.from("mods").update(p).eq("id", row.id);
    if (error) {
      toast.error(error.message);
      reload();
    }
  };

  const remove = async (row: ModRow) => {
    if (!(await confirm({ title: `Delete "${row.name}"?`, description: "This cannot be undone." }))) return;
    const { error } = await supabase.from("mods").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    toast.success("Mod deleted");
  };

  return (
    <ToolShell title="Mods" description="Publish, feature or remove mods in the mod library." onRefresh={reload}>
      <Input placeholder="Search mods…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      {loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty label="No mods found." />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="p-3 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.author ?? "unknown author"}
                  {r.category ? ` · ${r.category}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={r.published} onCheckedChange={(v) => patch(r, { published: v })} />
                <Label className="text-xs">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={r.featured} onCheckedChange={(v) => patch(r, { featured: v })} />
                <Label className="text-xs">Featured</Label>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </ToolShell>
  );
};

/* ------------------------------------------------------------------ */
/* Site reviews moderation                                             */
/* ------------------------------------------------------------------ */
type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
};

export const ReviewsModerationSection = () => {
  const [names, setNames] = useState<Record<string, string>>({});
  const { rows, setRows, loading, reload } = useRows<ReviewRow>(async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id,user_id,rating,body,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ReviewRow[];
  });

  useEffect(() => {
    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (!ids.length) return;
    supabase
      .from("profiles")
      .select("id,display_name")
      .in("id", ids)
      .then(({ data }) => {
        const m: Record<string, string> = {};
        (data ?? []).forEach((p: { id: string; display_name: string | null }) => {
          m[p.id] = p.display_name ?? "Unknown";
        });
        setNames(m);
      });
  }, [rows]);

  const remove = async (row: ReviewRow) => {
    if (!(await confirm({ title: "Delete this review?", description: "This cannot be undone." }))) return;
    const { error } = await supabase.from("reviews").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    toast.success("Review deleted");
  };

  const avg = rows.length ? (rows.reduce((s, r) => s + (r.rating ?? 0), 0) / rows.length).toFixed(2) : "—";

  return (
    <ToolShell
      title="Reviews"
      description="Moderate the player reviews shown across the site."
      onRefresh={reload}
    >
      <div className="flex gap-2">
        <Badge variant="secondary">{rows.length} reviews</Badge>
        <Badge variant="secondary">Average {avg} ★</Badge>
      </div>
      {loading ? (
        <Loading />
      ) : !rows.length ? (
        <Empty label="No reviews yet." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-3 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {names[r.user_id] ?? "Player"} · {"★".repeat(Math.max(0, Math.min(5, r.rating)))}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </ToolShell>
  );
};

export { useRows };
