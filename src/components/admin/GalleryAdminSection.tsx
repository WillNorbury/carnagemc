import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { logWebsiteEvent } from "@/lib/logEvent";
import { Trash2, Upload, Video, Link2 } from "lucide-react";
import { confirm } from "@/lib/confirm";

type Item = {
  id: string;
  title: string | null;
  caption: string | null;
  image_url: string;
  category: string | null;
  sort_order: number;
  published: boolean;
  media_type: string | null;
  video_url: string | null;
  video_provider: string | null;
};

export function GalleryAdminSection() {
  const [items, setItems] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase
      .from("gallery_items")
      .select("*")
      .order("sort_order")
      .order("created_at", { ascending: false });
    setItems((data as Item[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("news-covers").upload(path, file, { upsert: false });
        if (upErr) { toast.error(upErr.message); continue; }
        const { data: pub } = supabase.storage.from("news-covers").getPublicUrl(path);
        const { error } = await supabase.from("gallery_items").insert([{
          image_url: pub.publicUrl,
          title: file.name.replace(/\.[^.]+$/, ""),
          caption: null,
          category: null,
          published: true,
          sort_order: 0,
          media_type: "image",
        }]);
        if (error) toast.error(error.message);
      }
      logWebsiteEvent({ kind: "gallery_upload", title: "Gallery images added", detail: `${files.length} image(s)`, color: 0x10b981 });
      toast.success("Uploaded");
      load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function detectProvider(url: string): string | null {
    if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
    if (/twitch\.tv/.test(url)) return "twitch";
    return null;
  }

  async function addVideo() {
    const url = videoUrl.trim();
    if (!url) { toast.error("Paste a video URL"); return; }
    const provider = detectProvider(url);
    if (!provider) { toast.error("Only YouTube and Twitch URLs are supported"); return; }
    setAddingVideo(true);
    // YouTube thumbnail
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    const thumb = ytMatch ? `https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg` : "";
    const { error } = await supabase.from("gallery_items").insert([{
      image_url: thumb || "video",
      title: provider === "youtube" ? "YouTube clip" : "Twitch clip",
      caption: null,
      category: null,
      published: true,
      sort_order: 0,
      media_type: "video",
      video_url: url,
      video_provider: provider,
    }]);
    setAddingVideo(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Video added");
    setVideoUrl("");
    logWebsiteEvent({ kind: "gallery_video_add", title: "Gallery video added", detail: url, color: 0x8b5cf6 });
    load();
  }

  async function update(it: Item, patch: Partial<Item>) {
    const { error } = await supabase.from("gallery_items").update(patch).eq("id", it.id);
    if (error) return toast.error(error.message);
    setItems(items.map((x) => x.id === it.id ? { ...x, ...patch } : x));
    logWebsiteEvent({ kind: "gallery_update", title: "Gallery item updated", detail: it.title ?? it.id });
  }

  async function remove(it: Item) {
    if (!(await confirm("Delete this item?"))) return;
    const { error } = await supabase.from("gallery_items").delete().eq("id", it.id);
    if (error) return toast.error(error.message);
    logWebsiteEvent({ kind: "gallery_delete", title: "Gallery item deleted", detail: it.title ?? it.id, color: 0xef4444 });
    load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Input ref={fileRef} type="file" accept="image/*" multiple onChange={onUpload} disabled={uploading} className="max-w-md" />
            <span className="text-sm text-muted-foreground"><Upload className="h-4 w-4 inline mr-1" />{uploading ? "Uploading..." : "Upload images"}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste a YouTube or Twitch clip URL…"
              className="max-w-md"
              onKeyDown={(e) => e.key === "Enter" && addVideo()}
            />
            <Button size="sm" onClick={addVideo} disabled={addingVideo}>
              <Video className="h-4 w-4 mr-1.5" /> Add video
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it) => {
          const isVideo = it.media_type === "video";
          return (
            <Card key={it.id}>
              <CardContent className="p-3 space-y-2">
                <div className="relative">
                  <img src={it.image_url} alt={it.title ?? ""} className="w-full aspect-video object-cover rounded" />
                  {isVideo && (
                    <Badge className="absolute top-2 right-2"><Video className="h-3 w-3 mr-1" /> Video</Badge>
                  )}
                </div>
                <div><Label className="text-xs">Title</Label><Input value={it.title ?? ""} onChange={(e) => setItems(items.map((x) => x.id === it.id ? { ...x, title: e.target.value } : x))} onBlur={(e) => update(it, { title: e.target.value })} /></div>
                <div><Label className="text-xs">Caption</Label><Input value={it.caption ?? ""} onChange={(e) => setItems(items.map((x) => x.id === it.id ? { ...x, caption: e.target.value } : x))} onBlur={(e) => update(it, { caption: e.target.value })} /></div>
                {isVideo && (
                  <div><Label className="text-xs">Video URL</Label><Input value={it.video_url ?? ""} onChange={(e) => setItems(items.map((x) => x.id === it.id ? { ...x, video_url: e.target.value } : x))} onBlur={(e) => update(it, { video_url: e.target.value })} /></div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Category</Label><Input value={it.category ?? ""} onChange={(e) => setItems(items.map((x) => x.id === it.id ? { ...x, category: e.target.value } : x))} onBlur={(e) => update(it, { category: e.target.value })} /></div>
                  <div><Label className="text-xs">Order</Label><Input type="number" value={it.sort_order} onChange={(e) => setItems(items.map((x) => x.id === it.id ? { ...x, sort_order: Number(e.target.value) || 0 } : x))} onBlur={(e) => update(it, { sort_order: it.sort_order })} /></div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={it.published} onCheckedChange={(v) => update(it, { published: v })} /> Published</label>
                  <Button size="sm" variant="ghost" onClick={() => remove(it)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {items.length === 0 && <p className="text-muted-foreground col-span-full">No items yet.</p>}
      </div>
    </div>
  );
}
