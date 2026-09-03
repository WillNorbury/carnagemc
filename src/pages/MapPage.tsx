import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, ExternalLink, Compass } from "lucide-react";

type MapCfg = { enabled?: boolean; url?: string; provider?: string };

export default function MapPage() {
  const [cfg, setCfg] = useState<MapCfg | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("value")
      .eq("key", "map")
      .maybeSingle()
      .then(({ data }) => {
        setCfg((data?.value as MapCfg) ?? null);
        setLoading(false);
      });
  }, []);

  const live = !!cfg?.enabled && !!cfg?.url;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Live Server Map — Warden Network</title>
        <meta
          name="description"
          content="Browse the Warden Network world in real time: player bases, claimed regions, spawn and the wider Lifesteal map."
        />
        <link rel="canonical" href="https://carnagemc.net/map" />
      </Helmet>
      <Navbar />
      <main className="flex-1 w-full">
        {live ? (
          <div className="h-[calc(100vh-4rem)] w-full">
            <iframe
              src={cfg!.url}
              title="Warden Network live world map"
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-20">
            <div className="text-[10px] font-mono tracking-widest uppercase text-primary mb-2">World</div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">Live server map</h1>
            <p className="text-muted-foreground mb-8">
              A real-time, explorable render of the Lifesteal world — bases, claims, spawn and terrain, updated as
              players build.
            </p>

            <Card className="p-8 text-center">
              <div className="h-14 w-14 rounded-xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
                <MapIcon className="h-7 w-7" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2">
                {loading ? "Loading…" : "Coming soon"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The map isn't live yet. Once BlueMap is running on the server it will render right here, full screen.
              </p>
            </Card>

            <Card className="mt-6 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <h3 className="font-display font-bold">Server-side setup (for staff)</h3>
              </div>
              <ol className="text-sm text-muted-foreground space-y-3 list-decimal pl-5">
                <li>
                  Install <strong>BlueMap</strong> on the Paper backend server (it's a single plugin jar, Folia-friendly
                  and far lighter on the client than Dynmap).
                </li>
                <li>
                  In <code className="font-mono">plugins/BlueMap/webserver.conf</code> enable the built-in webserver and
                  set a port (e.g. <code className="font-mono">8100</code>).
                </li>
                <li>
                  Point a subdomain such as <code className="font-mono">map.carnagemc.net</code> at that host and put it
                  behind HTTPS — browsers block insecure iframes on an HTTPS site.
                </li>
                <li>
                  Let the first full render finish (it can take a while on a large world), then come back here.
                </li>
                <li>
                  In the admin panel, add a <code className="font-mono">map</code> site-content entry with{" "}
                  <code className="font-mono">{`{ "enabled": true, "url": "https://map.carnagemc.net" }`}</code> and this
                  page turns into the full-screen map automatically.
                </li>
              </ol>
              <Button asChild variant="outline" size="sm">
                <a href="/admin?tab=content">
                  Open admin <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </a>
              </Button>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
