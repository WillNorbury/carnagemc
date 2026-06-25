import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PageLoader from "@/components/site/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Package,
  Server as ServerIcon,
  Sparkles,
  XCircle,
} from "lucide-react";


type DiscoverItem = {
  id: string;
  kind: string;
  name: string;
  slug: string | null;
  description: string | null;
  long_description: string | null;
  author: string | null;
  version: string | null;
  icon_url: string | null;
  banner_url: string | null;
  category: string | null;
  tags: string[];
  featured: boolean;
  download_url: string | null;
  external_url: string | null;
  meta: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

const KIND_META: Record<
  string,
  { kind: string; label: string; browseTo: string; browseLabel: string }
> = {
  "resource-pack": {
    kind: "resource_pack",
    label: "Resource Pack",
    browseTo: "/discover/resource-packs",
    browseLabel: "Resource Packs",
  },
  "data-pack": {
    kind: "data_pack",
    label: "Data Pack",
    browseTo: "/discover/data-packs",
    browseLabel: "Data Packs",
  },
  shader: {
    kind: "shader",
    label: "Shader",
    browseTo: "/discover/shaders",
    browseLabel: "Shaders",
  },
  modpack: {
    kind: "modpack",
    label: "Modpack",
    browseTo: "/discover/modpacks",
    browseLabel: "Modpacks",
  },
  server: {
    kind: "server",
    label: "Server",
    browseTo: "/discover/servers",
    browseLabel: "Servers",
  },
  skript: {
    kind: "skript",
    label: "Skript",
    browseTo: "/discover/skripts",
    browseLabel: "Skripts",
  },
};

const getServerIp = (it: DiscoverItem): string | null => {
  const m = it.meta || {};
  return (m.ip || m.address || m.host || it.download_url || null) as string | null;
};

type Props = { urlKind: keyof typeof KIND_META };

const DiscoverItemDetail = ({ urlKind }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const meta = KIND_META[urlKind];
  const [item, setItem] = useState<DiscoverItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!slug) {
        setLoading(false);
        return;
      }
      const { data } = await (supabase.from("discover_items" as any) as any)
        .select(
          "id, kind, name, slug, description, long_description, author, version, icon_url, banner_url, category, tags, featured, download_url, external_url, meta, created_at, updated_at",
        )
        .eq("kind", meta.kind)
        .eq("published", true)
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
      if (cancelled) return;
      setItem((data ?? null) as DiscoverItem | null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, meta.kind]);

  useEffect(() => {
    document.title = item ? `${item.name} — ${meta.label}` : `${meta.label}`;
  }, [item, meta.label]);

  const isServer = meta.kind === "server";
  const isSkript = meta.kind === "skript";
  const ip = item && isServer ? getServerIp(item) : null;
  const storagePath = item?.meta?.storage_path as string | undefined;
  const price = (() => {
    const p = item?.meta?.price;
    const n = typeof p === "number" ? p : parseFloat(p ?? "0");
    return isFinite(n) ? n : 0;
  })();
  const screenshots: string[] = Array.isArray(item?.meta?.screenshots)
    ? (item!.meta!.screenshots as string[]).filter((s) => typeof s === "string")
    : [];
  const specs: { label: string; value: string }[] = item
    ? [
        item.version ? { label: "Version", value: `v${item.version}` } : null,
        item.meta?.skript_version
          ? { label: "Skript", value: String(item.meta.skript_version) }
          : null,
        item.meta?.mc_version
          ? { label: "Minecraft", value: String(item.meta.mc_version) }
          : null,
        item.category ? { label: "Category", value: item.category } : null,
        Array.isArray(item.meta?.addons) && item.meta!.addons.length > 0
          ? { label: "Addons", value: (item.meta!.addons as string[]).join(", ") }
          : null,
        item.meta?.file_size
          ? {
              label: "File size",
              value: `${(Number(item.meta.file_size) / 1024).toFixed(1)} KB`,
            }
          : null,
      ].filter(Boolean) as { label: string; value: string }[]
    : [];
  const url = item ? item.download_url || item.external_url : null;
  const hasDownloadable = !!(item && (item.download_url || storagePath));
  const isExternal = item ? !item.download_url && !storagePath && !!item.external_url : false;

  const copyIp = async () => {
    if (!ip) return;
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      toast.success(`Copied ${ip}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const [dlState, setDlState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [dlProgress, setDlProgress] = useState<number | null>(null); // 0-100, null = indeterminate
  const [dlError, setDlError] = useState<string | null>(null);

  const filenameFromUrl = (u: string) => {
    try {
      const p = new URL(u).pathname;
      const last = decodeURIComponent(p.split("/").pop() || "");
      return last || `${item?.slug ?? "download"}`;
    } catch {
      return `${item?.slug ?? "download"}`;
    }
  };

  const startDownload = async () => {
    if (isExternal) return;
    let dlUrl = url;
    if (storagePath) {
      const { data, error } = await supabase.storage
        .from("skripts")
        .createSignedUrl(storagePath, 60, {
          download: (item?.meta?.file_name as string) || `${item?.slug ?? "skript"}.sk`,
        });
      if (error || !data?.signedUrl) {
        toast.error("Could not generate download link");
        return;
      }
      dlUrl = data.signedUrl;
    }
    if (!dlUrl) return;
    setDlState("loading");
    setDlError(null);
    setDlProgress(null);
    try {
      const res = await fetch(dlUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const totalHeader = res.headers.get("content-length");
      const total = totalHeader ? parseInt(totalHeader, 10) : 0;
      if (total > 0) setDlProgress(0);

      const preferredName =
        (item?.meta?.file_name as string) || filenameFromUrl(dlUrl);

      const reader = res.body?.getReader();
      if (!reader) {
        const blob = await res.blob();
        triggerSave(blob, preferredName);
        setDlState("done");
        setDlProgress(100);
        setTimeout(() => setDlState("idle"), 1500);
        return;
      }
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            setDlProgress(Math.min(99, Math.round((received / total) * 100)));
          }
        }
      }
      const blob = new Blob(chunks as BlobPart[]);
      triggerSave(blob, preferredName);
      setDlProgress(100);
      setDlState("done");
      setTimeout(() => setDlState("idle"), 1500);
    } catch (e: any) {
      setDlError(e?.message ?? "Download failed");
      setDlState("error");
      toast.error("Download failed", { description: e?.message });
    }
  };

  const triggerSave = (blob: Blob, filename: string) => {
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      <PageLoader loading={loading} label={`Loading ${meta.label.toLowerCase()}`} />
      <Navbar />
      <main className="container pt-24 pb-16">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link to={meta.browseTo}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to {meta.browseLabel}
            </Link>
          </Button>
        </div>

        {!loading && !item ? (
          <Card className="p-10 text-center text-muted-foreground">
            {meta.label} not found.
          </Card>
        ) : item ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {item.banner_url && (
                <img
                  src={item.banner_url}
                  alt=""
                  className="w-full max-h-80 object-cover rounded-lg border border-border"
                />
              )}

              <div className="flex items-start gap-4">
                {item.icon_url ? (
                  <img
                    src={item.icon_url}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                    {isServer ? (
                      <ServerIcon className="h-10 w-10 text-primary" />
                    ) : (
                      <Package className="h-10 w-10 text-primary" />
                    )}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display font-bold text-3xl">{item.name}</h1>
                    {item.featured && <Sparkles className="h-5 w-5 text-primary" />}
                  </div>
                  {item.author && (
                    <p className="text-sm text-muted-foreground mt-1">
                      by <span className="text-foreground/80">{item.author}</span>
                    </p>
                  )}
                  {item.description && (
                    <p className="text-muted-foreground mt-2">{item.description}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {item.version && (
                  <Badge variant="outline" className="font-normal">v{item.version}</Badge>
                )}
                {item.category && (
                  <Badge variant="secondary" className="font-normal">{item.category}</Badge>
                )}
                {item.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs font-normal">{t}</Badge>
                ))}
              </div>

              {screenshots.length > 0 && (
                <Card className="p-4">
                  <h2 className="font-display font-semibold text-lg mb-3">Gallery</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {screenshots.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video overflow-hidden rounded-md border border-border hover:border-primary/50 transition"
                      >
                        <img
                          src={src}
                          alt={`${item.name} screenshot ${i + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {item.long_description && (
                <Card className="p-6">
                  <h2 className="font-display font-semibold text-lg mb-3">About</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {item.long_description}
                  </p>
                </Card>
              )}
            </div>

            <aside className="space-y-4">
              {!isServer && (
                <Card className="p-5">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Price
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-3xl">
                      {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                    </span>
                    {price > 0 && (
                      <span className="text-xs text-muted-foreground">USD</span>
                    )}
                  </div>
                </Card>
              )}

              <Card className="p-5 space-y-4">
                {isServer ? (
                  <>
                    {ip ? (
                      <div className="space-y-2">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Server IP
                        </div>
                        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
                          <ServerIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <code className="flex-1 font-mono text-sm truncate">{ip}</code>
                        </div>
                        <Button className="w-full" onClick={copyIp}>
                          {copied ? (
                            <><Check className="h-4 w-4 mr-1" /> Copied</>
                          ) : (
                            <><Copy className="h-4 w-4 mr-1" /> Copy IP</>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button disabled className="w-full">Unavailable</Button>
                    )}
                  </>
                ) : hasDownloadable ? (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={startDownload}
                      disabled={dlState === "loading"}
                      variant={dlState === "error" ? "destructive" : "default"}
                    >
                      {dlState === "loading" ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          {dlProgress !== null ? `Downloading ${dlProgress}%` : "Downloading…"}
                        </>
                      ) : dlState === "done" ? (
                        <><Check className="h-4 w-4 mr-1" /> Downloaded</>
                      ) : dlState === "error" ? (
                        <><XCircle className="h-4 w-4 mr-1" /> Retry download</>
                      ) : (
                        <><Download className="h-4 w-4 mr-1" /> Download</>
                      )}
                    </Button>
                    {dlState === "loading" && dlProgress !== null && (
                      <Progress value={dlProgress} className="h-1.5" />
                    )}
                    {dlState === "loading" && dlProgress === null && (
                      <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
                        <div className="h-full w-1/3 animate-pulse bg-primary" />
                      </div>
                    )}
                    {dlState === "error" && dlError && (
                      <p className="text-xs text-destructive">{dlError}</p>
                    )}
                  </div>
                ) : isExternal && url ? (
                  <Button asChild className="w-full">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" /> Visit
                    </a>
                  </Button>
                ) : (
                  <Button disabled className="w-full">Unavailable</Button>
                )}

                {item.external_url && !isServer && hasDownloadable && (
                  <Button asChild variant="outline" className="w-full" size="sm">
                    <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" /> Visit website
                    </a>
                  </Button>
                )}
              </Card>

              {specs.length > 0 && (
                <Card className="p-5 space-y-2 text-sm">
                  <h3 className="font-display font-semibold mb-1">Specifications</h3>
                  {specs.map((s) => (
                    <div key={s.label} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="text-right text-foreground/90 truncate max-w-[60%]">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </Card>
              )}


              <Card className="p-5 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Updated {new Date(item.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Created {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            </aside>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default DiscoverItemDetail;
