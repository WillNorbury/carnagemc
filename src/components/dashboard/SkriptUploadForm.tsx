import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { z } from "zod";
import { FileCode, Loader2, Upload, X } from "lucide-react";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  version: z.string().trim().max(32).optional(),
  description: z.string().trim().max(280).optional(),
  long_description: z.string().trim().max(8000).optional(),
  category: z.string().trim().max(60).optional(),
  tags: z.string().trim().max(200).optional(),
  price: z.coerce.number().min(0).max(9999).optional(),
  skript_version: z.string().trim().max(20).optional(),
  mc_version: z.string().trim().max(40).optional(),
  addons: z.string().trim().max(200).optional(),
  icon_url: z.string().trim().url().or(z.literal("")).optional(),
  banner_url: z.string().trim().url().or(z.literal("")).optional(),
  external_url: z.string().trim().url().or(z.literal("")).optional(),
  screenshots: z.string().trim().max(2000).optional(),
});

type Props = {
  /** Where to go after a successful publish. Defaults to /discover/skripts */
  successHref?: string;
  /** Called after a successful publish (e.g. to refresh a parent list). */
  onSuccess?: () => void;
  /** Compact: skip cancel button and tighten spacing for embedded use. */
  compact?: boolean;
};

const SkriptUploadForm = ({ successHref = "/discover/skripts", onSuccess, compact }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pricing, setPricing] = useState<"free" | "paid">("free");
  const [f, setF] = useState({
    name: "",
    version: "",
    description: "",
    long_description: "",
    category: "Utility",
    tags: "",
    price: "0",
    skript_version: "2.9",
    mc_version: "1.21",
    addons: "",
    icon_url: "",
    banner_url: "",
    external_url: "",
    screenshots: "",
    published: true,
  });

  const pickFile = (file: File | null) => {
    if (!file) return setFile(null);
    if (!/\.sk$/i.test(file.name)) {
      toast.error("Only .sk files are accepted");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5 MB)");
      return;
    }
    setFile(file);
  };

  const reset = () => {
    setFile(null);
    setF({
      name: "", version: "", description: "", long_description: "",
      category: "Utility", tags: "", price: "0", skript_version: "2.9",
      mc_version: "1.21", addons: "", icon_url: "", banner_url: "",
      external_url: "", screenshots: "", published: true,
    });
  };

  const submit = async () => {
    if (!user) return;
    if (!file) {
      toast.error("Please attach a .sk file");
      return;
    }
    const priceForSubmit = pricing === "free" ? "0" : (f.price || "0");
    const parsed = formSchema.safeParse({ ...f, price: priceForSubmit });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      toast.error(first ?? "Please check the form");
      return;
    }
    const v = parsed.data;

    setSubmitting(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const path = `${user.id}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage
        .from("skripts")
        .upload(path, file, { upsert: false, contentType: "text/plain" });
      if (upErr) throw upErr;

      const tags = (v.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
      const screenshots = (v.screenshots ?? "")
        .split(/[\n,]+/).map((s) => s.trim())
        .filter((s) => /^https?:\/\//i.test(s)).slice(0, 8);
      const addons = (v.addons ?? "").split(",").map((a) => a.trim()).filter(Boolean);

      const meta = {
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        price: Number(v.price ?? 0),
        skript_version: v.skript_version || null,
        mc_version: v.mc_version || null,
        addons,
        screenshots,
      };

      const { error: insErr } = await supabase.from("discover_items").insert({
        kind: "skript",
        user_id: user.id,
        name: v.name,
        description: v.description || null,
        long_description: v.long_description || null,
        author: null,
        version: v.version || null,
        category: v.category || null,
        tags,
        icon_url: v.icon_url || null,
        banner_url: v.banner_url || null,
        external_url: v.external_url || null,
        download_url: null,
        meta,
        published: f.published,
      });
      if (insErr) throw insErr;

      toast.success("Skript listing created");
      reset();
      onSuccess?.();
      if (successHref) navigate(successHref);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {/* File picker */}
      <div>
        <Label>Skript file (.sk) *</Label>
        <div
          className="mt-1 rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center cursor-pointer hover:border-primary/50 transition"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0] ?? null); }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".sk,text/plain"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileCode className="h-6 w-6 text-primary" />
              <div className="text-left">
                <div className="font-medium text-sm">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-muted-foreground">
              <Upload className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm">Click or drag a .sk file here</div>
              <div className="text-xs mt-1">Max 5 MB</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Name *</Label>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} placeholder="EpicEconomy" />
        </div>
        <div>
          <Label>Version</Label>
          <Input value={f.version} onChange={(e) => setF({ ...f, version: e.target.value })} placeholder="1.0.0" maxLength={32} />
        </div>
      </div>

      <div>
        <Label>Short description</Label>
        <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={280} placeholder="One-line summary shown on listings" />
      </div>

      <div>
        <Label>Long description</Label>
        <Textarea rows={6} value={f.long_description} onChange={(e) => setF({ ...f, long_description: e.target.value })} maxLength={8000} placeholder="Features, install steps, commands, permissions…" />
      </div>

      <div className="rounded-md border border-border p-3">
        <Label className="mb-2 block">Pricing *</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPricing("free")}
            className={`rounded-md border p-3 text-left transition ${pricing === "free" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
          >
            <div className="font-display font-bold text-sm">Free</div>
            <div className="text-xs text-muted-foreground">Anyone can download for free.</div>
          </button>
          <button
            type="button"
            onClick={() => setPricing("paid")}
            className={`rounded-md border p-3 text-left transition ${pricing === "paid" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
          >
            <div className="font-display font-bold text-sm">Paid</div>
            <div className="text-xs text-muted-foreground">Users must purchase to download.</div>
          </button>
        </div>
        {pricing === "paid" && (
          <div className="mt-3 grid sm:grid-cols-[160px_1fr] gap-3 items-end">
            <div>
              <Label>Price (USD) *</Label>
              <Input inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="4.99" />
            </div>
            <p className="text-xs text-muted-foreground">Buyers will be charged this amount at checkout.</p>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Economy" />
        </div>
        <div>
          <Label>Tags (comma-sep.)</Label>
          <Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="economy, gui, shop" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <Label>Skript version</Label>
          <Input value={f.skript_version} onChange={(e) => setF({ ...f, skript_version: e.target.value })} placeholder="2.9" />
        </div>
        <div>
          <Label>MC version(s)</Label>
          <Input value={f.mc_version} onChange={(e) => setF({ ...f, mc_version: e.target.value })} placeholder="1.20 – 1.21" />
        </div>
        <div>
          <Label>Required addons</Label>
          <Input value={f.addons} onChange={(e) => setF({ ...f, addons: e.target.value })} placeholder="SkBee, TuSKe" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Icon URL</Label>
          <Input value={f.icon_url} onChange={(e) => setF({ ...f, icon_url: e.target.value })} placeholder="https://…/icon.png" />
        </div>
        <div>
          <Label>Banner URL</Label>
          <Input value={f.banner_url} onChange={(e) => setF({ ...f, banner_url: e.target.value })} placeholder="https://…/banner.png" />
        </div>
      </div>

      <div>
        <Label>Screenshot URLs (one per line)</Label>
        <Textarea rows={3} value={f.screenshots} onChange={(e) => setF({ ...f, screenshots: e.target.value })} placeholder={"https://…/shot1.png\nhttps://…/shot2.png"} />
      </div>

      <div>
        <Label>External link (docs / discord)</Label>
        <Input value={f.external_url} onChange={(e) => setF({ ...f, external_url: e.target.value })} placeholder="https://discord.gg/…" />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <div>
          <div className="text-sm font-medium">Publish immediately</div>
          <div className="text-xs text-muted-foreground">Off = saved as draft, visible only to you.</div>
        </div>
        <Switch checked={f.published} onCheckedChange={(v) => setF({ ...f, published: v })} />
      </div>

      {!f.published && (
        <Badge variant="outline" className="text-amber-400 border-amber-400/40">Will be saved as draft</Badge>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={submit} disabled={submitting}>
          {submitting ? (
            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Publishing…</>
          ) : (
            <><Upload className="h-4 w-4 mr-1" /> Publish skript</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SkriptUploadForm;
