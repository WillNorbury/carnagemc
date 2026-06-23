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
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Package,
  Server as ServerIcon,
  Sparkles,
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
  const ip = item && isServer ? getServerIp(item) : null;
  const url = item ? item.download_url || item.external_url : null;
  const isExternal = item ? !item.download_url && !!item.external_url : false;

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
                ) : url ? (
                  <Button asChild className="w-full">
                    <a
                      href={url}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      {...(isExternal ? {} : { download: "" })}
                    >
                      {isExternal ? (
                        <><ExternalLink className="h-4 w-4 mr-1" /> Visit</>
                      ) : (
                        <><Download className="h-4 w-4 mr-1" /> Download</>
                      )}
                    </a>
                  </Button>

                ) : (
                  <Button disabled className="w-full">Unavailable</Button>
                )}

                {item.external_url && !isServer && item.download_url && (
                  <Button asChild variant="outline" className="w-full" size="sm">
                    <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" /> Visit website
                    </a>
                  </Button>
                )}
              </Card>

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
