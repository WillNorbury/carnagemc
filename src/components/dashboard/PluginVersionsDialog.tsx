import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Download, Plus } from "lucide-react";

type PluginVersion = {
  id: string;
  plugin_id: string;
  version: string;
  changelog: string | null;
  jar_path: string | null;
  jar_filename: string | null;
  jar_size: number | null;
  download_url: string | null;
  created_at: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pluginId: string;
  pluginName: string;
  userId: string;
  onChanged?: () => void;
};

export default function PluginVersionsDialog({
  open,
  onOpenChange,
  pluginId,
  pluginName,
  userId,
  onChanged,
}: Props) {
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [jarPath, setJarPath] = useState<string | null>(null);
  const [jarFilename, setJarFilename] = useState<string | null>(null);
  const [jarSize, setJarSize] = useState<number | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const jarRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("plugin_versions" as any) as any)
      .select("*")
      .eq("plugin_id", pluginId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setVersions((data ?? []) as PluginVersion[]);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      load();
      setVersion("");
      setChangelog("");
      setJarPath(null);
      setJarFilename(null);
      setJarSize(null);
      setDownloadUrl("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pluginId]);

  const uploadJar = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".jar")) {
      toast.error("Only .jar files are allowed");
      return;
    }
    setUploading(true);
    const path = `${userId}/${pluginId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("plugin-jars").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: "application/java-archive",
    });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("plugin-jars").getPublicUrl(path);
    setJarPath(path);
    setJarFilename(file.name);
    setJarSize(file.size);
    setDownloadUrl(pub.publicUrl);
    setUploading(false);
    toast.success("Jar uploaded");
  };

  const addVersion = async () => {
    if (!version.trim()) {
      toast.error("Version is required");
      return;
    }
    if (!jarPath && !downloadUrl.trim()) {
      toast.error("Upload a .jar or provide a download URL");
      return;
    }
    setSaving(true);
    const { error } = await (supabase.from("plugin_versions" as any) as any).insert({
      plugin_id: pluginId,
      version: version.trim(),
      changelog: changelog.trim() || null,
      jar_path: jarPath,
      jar_filename: jarFilename,
      jar_size: jarSize,
      download_url: downloadUrl.trim() || null,
      created_by: userId,
    });
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    // Sync plugin's main fields to the new latest version
    const { error: updErr } = await supabase
      .from("plugins")
      .update({
        version: version.trim(),
        jar_path: jarPath,
        jar_filename: jarFilename,
        jar_size: jarSize,
        download_url: downloadUrl.trim() || null,
      })
      .eq("id", pluginId);
    if (updErr) toast.error(updErr.message);

    toast.success(`Version ${version.trim()} added`);
    setVersion("");
    setChangelog("");
    setJarPath(null);
    setJarFilename(null);
    setJarSize(null);
    setDownloadUrl("");
    if (jarRef.current) jarRef.current.value = "";
    setSaving(false);
    load();
    onChanged?.();
  };

  const removeVersion = async (v: PluginVersion) => {
    if (!confirm(`Delete version ${v.version}? This cannot be undone.`)) return;
    if (v.jar_path) {
      await supabase.storage.from("plugin-jars").remove([v.jar_path]);
    }
    const { error } = await (supabase.from("plugin_versions" as any) as any)
      .delete()
      .eq("id", v.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Version deleted");
    load();
    onChanged?.();
  };

  const getUrl = (v: PluginVersion) => {
    if (v.download_url) return v.download_url;
    if (v.jar_path) {
      const { data } = supabase.storage.from("plugin-jars").getPublicUrl(v.jar_path);
      return data.publicUrl;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Versions — {pluginName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <h3 className="font-display font-bold text-sm">Add new version</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="v-num">Version *</Label>
                <Input
                  id="v-num"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.1.0"
                  maxLength={32}
                />
              </div>
              <div>
                <Label htmlFor="v-url">Download URL (optional)</Label>
                <Input
                  id="v-url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="v-changelog">Changelog</Label>
              <Textarea
                id="v-changelog"
                rows={3}
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="What's new in this version..."
                maxLength={2000}
              />
            </div>
            <div>
              <Label>Jar file</Label>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <input
                  ref={jarRef}
                  type="file"
                  accept=".jar"
                  hidden
                  onChange={(e) => e.target.files?.[0] && uploadJar(e.target.files[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => jarRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  Upload .jar
                </Button>
                {jarFilename && (
                  <span className="text-xs text-muted-foreground">
                    {jarFilename}
                    {jarSize ? ` · ${(jarSize / 1024 / 1024).toFixed(2)} MB` : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={addVersion} disabled={saving || uploading}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add version
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm mb-2">Version history</h3>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No versions yet. Add the first one above.
              </p>
            ) : (
              <div className="space-y-2">
                {versions.map((v, i) => {
                  const url = getUrl(v);
                  return (
                    <div
                      key={v.id}
                      className="rounded-lg border border-border/60 p-3 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold">v{v.version}</span>
                          {i === 0 && <Badge>Latest</Badge>}
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {v.changelog && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">
                            {v.changelog}
                          </p>
                        )}
                        {v.jar_filename && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {v.jar_filename}
                            {v.jar_size ? ` · ${(v.jar_size / 1024 / 1024).toFixed(2)} MB` : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {url && (
                          <Button size="icon" variant="ghost" asChild aria-label="Download">
                            <a href={url} target="_blank" rel="noopener noreferrer" download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeVersion(v)}
                          aria-label="Delete version"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
