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
import { FileCode, Upload, Loader2, Trash2, ExternalLink, Eye, EyeOff, Download } from "lucide-react";

type Skript = {
  id: string;
  name: string;
  description: string | null;
  filename: string;
  storage_path: string;
  size_bytes: number | null;
  version: string | null;
  tags: string[];
  downloads: number;
  published: boolean;
  created_at: string;
};

const fmtBytes = (n: number | null) => {
  if (!n) return "—";
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const MySkriptsPanel = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Skript[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_skripts" as any)
      .select("*")
      .eq("uploaded_by", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(((data as unknown) ?? []) as Skript[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const reset = () => {
    setName(""); setDescription(""); setVersion(""); setTagsInput(""); setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const upload = async () => {
    if (!user) return;
    if (!file || !name.trim()) {
      toast.error("Name and file are required");
      return;
    }
    setUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const path = `${user.id}/${Date.now()}-${safe}`;
      const up = await supabase.storage.from("user-skripts").upload(path, file, {
        contentType: file.type || "text/plain",
        upsert: false,
      });
      if (up.error) throw up.error;
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const ins = await supabase.from("user_skripts" as any).insert({
        name: name.trim(),
        description: description.trim() || null,
        version: version.trim() || null,
        tags,
        filename: file.name,
        storage_path: path,
        size_bytes: file.size,
        uploaded_by: user.id,
      });
      if (ins.error) throw ins.error;
      toast.success("Skript uploaded");
      reset();
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const togglePublished = async (sk: Skript) => {
    const { error } = await supabase
      .from("user_skripts" as any)
      .update({ published: !sk.published })
      .eq("id", sk.id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((s) => (s.id === sk.id ? { ...s, published: !s.published } : s)));
  };

  const remove = async (sk: Skript) => {
    if (!confirm(`Delete "${sk.name}"? This cannot be undone.`)) return;
    const del = await supabase.from("user_skripts" as any).delete().eq("id", sk.id);
    if (del.error) return toast.error(del.error.message);
    await supabase.storage.from("user-skripts").remove([sk.storage_path]);
    toast.success("Deleted");
    setItems((prev) => prev.filter((s) => s.id !== sk.id));
  };

  const download = async (sk: Skript) => {
    const { data, error } = await supabase.storage
      .from("user-skripts")
      .createSignedUrl(sk.storage_path, 60);
    if (error || !data?.signedUrl) return toast.error(error?.message ?? "Download failed");
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = sk.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Card id="skripts" className="p-6 scroll-mt-24">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <FileCode className="h-5 w-5 text-orange-400" /> My Skripts
          </h2>
          <p className="text-sm text-muted-foreground">Share .sk files with the community.</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/skripts"><ExternalLink className="h-4 w-4 mr-1" /> Browse /skripts</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border/70 bg-background/40 p-4 mb-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sk-name">Name</Label>
            <Input id="sk-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anti-AFK" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sk-ver">Version (optional)</Label>
            <Input id="sk-ver" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
          </div>
        </div>
        <div className="space-y-1.5 mt-3">
          <Label htmlFor="sk-desc">Description (optional)</Label>
          <Textarea id="sk-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="grid gap-3 md:grid-cols-2 mt-3">
          <div className="space-y-1.5">
            <Label htmlFor="sk-tags">Tags (comma separated)</Label>
            <Input id="sk-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="utility, anti-afk" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sk-file">Skript file (.sk)</Label>
            <Input
              id="sk-file"
              ref={fileRef}
              type="file"
              accept=".sk,text/plain"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <Button onClick={upload} disabled={uploading} className="mt-4">
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload Skript
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">You haven't uploaded any skripts yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
              <FileCode className="h-5 w-5 text-orange-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{s.name}</span>
                  {s.version && <Badge variant="secondary" className="text-[10px]">v{s.version}</Badge>}
                  <Badge variant="outline" className="text-[10px]">{fmtBytes(s.size_bytes)}</Badge>
                  {!s.published && <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/40">Hidden</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {s.filename} · {s.downloads} downloads · {new Date(s.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => download(s)} title="Download">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => togglePublished(s)} title={s.published ? "Hide" : "Publish"}>
                {s.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(s)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MySkriptsPanel;
