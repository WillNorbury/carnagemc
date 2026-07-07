import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Puzzle, Download, Clock } from "lucide-react";

type FavRow = {
  plugin_id: string;
  created_at: string;
  plugin: {
    id: string;
    name: string;
    slug: string | null;
    short_id: string;
    icon_url: string | null;
    description: string | null;
  } | null;
};

type DownloadRow = {
  plugin_id: string;
  last_downloaded: string;
  download_count: number;
  plugin?: FavRow["plugin"];
};

const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 30) return `${Math.floor(d)}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

export default function MyFavoritePluginsPanel({ userId }: { userId: string }) {
  const [favs, setFavs] = useState<FavRow[]>([]);
  const [dls, setDls] = useState<DownloadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [favRes, dlRes]: any = await Promise.all([
      (supabase.from("plugin_favorites" as any) as any)
        .select("plugin_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.rpc("get_my_recent_plugin_downloads" as any, { _limit: 8 }),
    ]);

    const favRows = (favRes.data ?? []) as { plugin_id: string; created_at: string }[];
    const dlRows = (dlRes.data ?? []) as { plugin_id: string; last_downloaded: string; download_count: number }[];

    const ids = Array.from(new Set([...favRows.map(r => r.plugin_id), ...dlRows.map(r => r.plugin_id)]));
    const pluginMap: Record<string, FavRow["plugin"]> = {};
    if (ids.length) {
      const { data: plugins } = await supabase
        .from("plugins")
        .select("id, name, slug, short_id, icon_url, description")
        .in("id", ids);
      (plugins ?? []).forEach((p: any) => { pluginMap[p.id] = p; });
    }

    setFavs(favRows.map(r => ({ ...r, plugin: pluginMap[r.plugin_id] ?? null })));
    setDls(dlRows.map(r => ({ ...r, plugin: pluginMap[r.plugin_id] ?? null })));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  const unfavorite = async (plugin_id: string) => {
    setFavs(prev => prev.filter(f => f.plugin_id !== plugin_id));
    await supabase.rpc("toggle_plugin_favorite" as any, { _plugin_id: plugin_id });
  };

  const linkFor = (p: FavRow["plugin"]) => `/plugin/${p?.slug ?? p?.short_id}`;

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      {/* Favorites */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-rose-400 fill-rose-400" />
          <h3 className="font-display font-bold">My Favorite Plugins</h3>
          <span className="text-xs text-muted-foreground ml-1">({favs.length})</span>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : favs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing favorited yet. Tap the ♥ on a plugin to save it here.
          </p>
        ) : (
          <ul className="space-y-2">
            {favs.map(f => f.plugin && (
              <li key={f.plugin_id} className="flex items-center gap-3 p-2 rounded-md border border-border/60 hover:border-orange-500/40 transition">
                <Link to={linkFor(f.plugin)} className="flex items-center gap-3 flex-1 min-w-0">
                  {f.plugin.icon_url ? (
                    <img src={f.plugin.icon_url} alt="" className="h-9 w-9 rounded object-cover border border-border" />
                  ) : (
                    <div className="h-9 w-9 rounded bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                      <Puzzle className="h-4 w-4 text-orange-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{f.plugin.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Saved {timeAgo(f.created_at)}
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => unfavorite(f.plugin_id)}
                  aria-label="Remove favorite"
                  className="h-8 w-8 text-rose-400 hover:text-rose-300"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Recent downloads */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold">Recently Downloaded</h3>
          <span className="text-xs text-muted-foreground ml-1">({dls.length})</span>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : dls.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Downloads you make while signed in will show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {dls.map(d => d.plugin && (
              <li key={d.plugin_id}>
                <Link
                  to={linkFor(d.plugin)}
                  className="flex items-center gap-3 p-2 rounded-md border border-border/60 hover:border-orange-500/40 transition"
                >
                  {d.plugin.icon_url ? (
                    <img src={d.plugin.icon_url} alt="" className="h-9 w-9 rounded object-cover border border-border" />
                  ) : (
                    <div className="h-9 w-9 rounded bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                      <Puzzle className="h-4 w-4 text-orange-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{d.plugin.name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 font-mono">
                      <Clock className="h-3 w-3" /> {timeAgo(d.last_downloaded)}
                      <span>·</span>
                      <span>{d.download_count}×</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
