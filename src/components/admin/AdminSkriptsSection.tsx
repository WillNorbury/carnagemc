import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Trash2, Upload, FileCode, Loader2 } from "lucide-react";

type Skript = {
  id: string;
  name: string;
  description: string | null;
  filename: string;
  storage_path: string;
  size_bytes: number | null;
  version: string | null;
  uploaded_by: string | null;
  created_at: string;
};

const fmtBytes = (n: number | null) => {
  if (!n) return "—";
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

export const AdminSkriptsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Skript[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_skripts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    setItems((data ?? []) as Skript[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setName(""); setDescription(""); setVersion(""); setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const upload = async () => {
    if (!user) return;
    if (!file || !name.trim()) {
      toast({ title: "Missing info", description: "Name and file are required.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const path = `${user.id}/${Date.now()}-${safe}`;
      const up = await supabase.storage.from("skripts").upload(path, file, {
        contentType: file.type || "text/plain",
        upsert: false,
      });
      if (up.error) throw up.error;
      const ins = await supabase.from("admin_skripts").insert({
        name: name.trim(),
        description: description.trim() || null,
        version: version.trim() || null,
        filename: file.name,
        storage_path: path,
        size_bytes: file.size,
        uploaded_by: user.id,
      });
      if (ins.error) throw ins.error;
      toast({ title: "Skript uploaded" });
      reset();
      load();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const download = async (s: Skript) => {
    const { data, error } = await supabase.storage.from("skripts").createSignedUrl(s.storage_path, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Download failed", description: error?.message, variant: "destructive" });
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = s.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const remove = async (s: Skript) => {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    const del = await supabase.from("admin_skripts").delete().eq("id", s.id);
    if (del.error) {
      toast({ title: "Delete failed", description: del.error.message, variant: "destructive" });
      return;
    }
    await supabase.storage.from("skripts").remove([s.storage_path]);
    toast({ title: "Deleted" });
    load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload Skript
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sk-name">Name</Label>
              <Input id="sk-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anti-AFK" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sk-ver">Version (optional)</Label>
              <Input id="sk-ver" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sk-desc">Description (optional)</Label>
            <Textarea id="sk-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sk-file">Skript file (.sk)</Label>
            <Input
              id="sk-file"
              ref={fileRef}
              type="file"
              accept=".sk,text/plain"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button onClick={upload} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skripts library ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No skripts uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {items.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <FileCode className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{s.name}</span>
                      {s.version && <Badge variant="secondary">v{s.version}</Badge>}
                      <Badge variant="outline">{fmtBytes(s.size_bytes)}</Badge>
                    </div>
                    {s.description && <p className="text-sm text-muted-foreground truncate">{s.description}</p>}
                    <p className="text-xs text-muted-foreground truncate">{s.filename} · {new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => download(s)}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSkriptsSection;
