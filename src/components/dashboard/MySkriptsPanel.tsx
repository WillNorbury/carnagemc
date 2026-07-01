import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileCode, ExternalLink, Trash2, Loader2 } from "lucide-react";

type Skript = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  version: string | null;
  category: string | null;
  icon_url: string | null;
  published: boolean;
  meta: any;
  updated_at: string;
};

export default function MySkriptsPanel({ userId }: { userId: string }) {
  const [items, setItems] = useState<Skript[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("discover_items")
      .select("id, slug, name, description, version, category, icon_url, published, meta, updated_at")
      .eq("user_id", userId)
      .eq("kind", "skript")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Skript[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const remove = async (s: Skript) => {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("discover_items").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Skript deleted");
    load();
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold text-lg">My Skripts</h2>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href="#create-skript">
            <FileCode className="h-4 w-4 mr-1" /> Upload skript
          </a>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven't uploaded any skripts yet. Use the Upload Skript form below to publish one.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => {
            const price = Number(s.meta?.price ?? 0);
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                {s.icon_url ? (
                  <img
                    src={s.icon_url}
                    alt=""
                    className="h-10 w-10 rounded-md object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                    <FileCode className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold truncate">{s.name}</span>
                    {!s.published && (
                      <Badge variant="outline" className="text-amber-400 border-amber-400/40">Draft</Badge>
                    )}
                    {s.version && <span className="text-xs text-muted-foreground">v{s.version}</span>}
                    <Badge
                      variant="outline"
                      className={price > 0 ? "text-emerald-400 border-emerald-400/40" : "text-primary border-primary/40"}
                    >
                      {price > 0 ? `$${price.toFixed(2)}` : "Free"}
                    </Badge>
                    {s.category && (
                      <Badge variant="secondary">{s.category}</Badge>
                    )}
                  </div>
                  {s.description && (
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {s.published && s.slug && (
                    <Button asChild size="icon" variant="ghost" aria-label="View">
                      <Link to={`/skript/${s.slug}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(s)}
                    aria-label="Delete"
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
    </Card>
  );
}
