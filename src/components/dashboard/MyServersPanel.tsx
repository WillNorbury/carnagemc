import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Server as ServerIcon, Loader2, Trash2, Eye, EyeOff, ExternalLink, Image as ImageIcon, X, Plus, Pencil, Save } from "lucide-react";

type Row = {
  id: string;
  name: string;
  slug: string;
  ip: string;
  port: number | null;
  description: string | null;
  long_description: string | null;
  version: string | null;
  tags: string[];
  icon_url: string | null;
  website_url: string | null;
  discord_url: string | null;
  published: boolean;
  created_at: string;
};

const MyServersPanel = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [version, setVersion] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [iconUploading, setIconUploading] = useState(false);
  const iconRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_servers" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(((data as unknown) ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const reset = () => {
    setName(""); setIp(""); setPort(""); setDescription(""); setLongDescription(""); setVersion("");
    setTagsInput(""); setWebsiteUrl(""); setDiscordUrl(""); setIconUrl(""); setEditingId(null);
    if (iconRef.current) iconRef.current.value = "";
  };

  const startEdit = (r: Row) => {
    setEditingId(r.id);
    setName(r.name);
    setIp(r.ip);
    setPort(r.port ? String(r.port) : "");
    setDescription(r.description ?? "");
    setLongDescription(r.long_description ?? "");
    setVersion(r.version ?? "");
    setTagsInput((r.tags ?? []).join(", "));
    setWebsiteUrl(r.website_url ?? "");
    setDiscordUrl(r.discord_url ?? "");
    setIconUrl(r.icon_url ?? "");
    setOpen(true);
    if (typeof window !== "undefined") window.scrollTo({ top: window.scrollY, behavior: "auto" });
  };


  const uploadIcon = async (f: File) => {
    if (!user) return;
    setIconUploading(true);
    try {
      const safe = f.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const path = `${user.id}/server-icons/${Date.now()}-${safe}`;
      const up = await supabase.storage.from("plugin-screenshots").upload(path, f, {
        contentType: f.type || "image/png",
      });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("plugin-screenshots").getPublicUrl(path);
      setIconUrl(pub.publicUrl);
    } catch (e: any) {
      toast.error(e.message ?? "Icon upload failed");
    } finally {
      setIconUploading(false);
      if (iconRef.current) iconRef.current.value = "";
    }
  };

  const submit = async () => {
    if (!user) return;
    if (!name.trim() || !ip.trim()) return toast.error("Server name and IP are required");
    setSaving(true);
    const payload: any = {
      name: name.trim(),
      ip: ip.trim(),
      port: port.trim() ? Number(port) : null,
      description: description.trim() || null,
      long_description: longDescription.trim() || null,
      version: version.trim() || null,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      website_url: websiteUrl.trim() || null,
      discord_url: discordUrl.trim() || null,
      icon_url: iconUrl || null,
    };
    const { error } = editingId
      ? await supabase.from("user_servers" as any).update(payload).eq("id", editingId)
      : await supabase.from("user_servers" as any).insert({ ...payload, user_id: user.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Server updated" : "Server added to /servers");
    reset();
    setOpen(false);
    load();
  };


  const togglePublished = async (r: Row) => {
    const { error } = await supabase
      .from("user_servers" as any)
      .update({ published: !r.published } as any)
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete server "${r.name}"?`)) return;
    const { error } = await supabase.from("user_servers" as any).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  if (!user) return null;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ServerIcon className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold text-lg">My Servers</h2>
          <Badge variant="outline">{items.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/servers"><ExternalLink className="h-4 w-4 mr-1" /> View /servers</Link>
          </Button>
          <Button size="sm" onClick={() => { if (open) { reset(); setOpen(false); } else { reset(); setOpen(true); } }}>
            {open ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {open ? "Cancel" : "Add server"}
          </Button>
        </div>
      </div>

      {open && (
        <div className="rounded-lg border border-border/70 p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Server name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="CarnageMC" />
            </div>
            <div>
              <Label>Server IP *</Label>
              <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="play.carnagemc.net" />
            </div>
            <div>
              <Label>Port (optional)</Label>
              <Input type="number" value={port} onChange={(e) => setPort(e.target.value)} placeholder="25565" />
            </div>
            <div>
              <Label>Version</Label>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.21" />
            </div>
            <div>
              <Label>Website URL</Label>
              <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <Label>Discord URL</Label>
              <Input value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)} placeholder="https://discord.gg/…" />
            </div>
          </div>
          <div>
            <Label>Gamemodes / tags (comma separated)</Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Survival, SMP, Economy" />
          </div>
          <div>
            <Label>Short description</Label>
            <Input
              value={description}
              maxLength={160}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One-line pitch shown on the servers list"
            />
            <p className="text-[11px] text-muted-foreground mt-1">{description.length}/160 — shown on cards and search results.</p>
          </div>
          <div>
            <Label>Full description</Label>
            <Textarea
              rows={5}
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Markdown supported — shown on your server page"
            />
          </div>

          <div>
            <Label>Icon</Label>
            <div className="flex items-center gap-3">
              {iconUrl ? (
                <img src={iconUrl} alt="" className="h-12 w-12 rounded-md object-cover border border-border" />
              ) : (
                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <input
                ref={iconRef}
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={(e) => e.target.files?.[0] && uploadIcon(e.target.files[0])}
              />
              {iconUploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editingId && (
              <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancel edit</Button>
            )}
            <Button onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : editingId ? <Save className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Add server"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">You haven't listed a server yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
              {r.icon_url ? (
                <img src={r.icon_url} alt="" className="h-10 w-10 rounded-md object-cover border border-border" />
              ) : (
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <ServerIcon className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{r.name}</span>
                  <Badge variant={r.published ? "default" : "outline"} className="text-[10px]">
                    {r.published ? "Published" : "Hidden"}
                  </Badge>
                </div>
                <div className="text-xs font-mono text-muted-foreground truncate">
                  {r.port ? `${r.ip}:${r.port}` : r.ip}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => togglePublished(r)} title={r.published ? "Unpublish" : "Publish"}>
                {r.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MyServersPanel;
