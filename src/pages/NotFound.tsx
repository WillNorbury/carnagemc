import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/site/ui-kit";
import { Home, ScrollText, Activity, LifeBuoy, Search } from "lucide-react";

const QUICK_LINKS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/gamemodes", label: "Game Modes", icon: ScrollText },
  { to: "/status", label: "Server Status", icon: Activity },
  { to: "/support", label: "Support", icon: LifeBuoy },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Page Not Found — CarnageMC"
        description="This CarnageMC page doesn't exist. Jump back to the homepage, game modes, server status, or support."
        path={location.pathname}
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-20">
        <div className="w-full max-w-2xl text-center">
          <p className="eyebrow text-primary mb-4">Error 404</p>
          <h1 className="font-display text-6xl sm:text-8xl font-black tracking-tight text-gradient mb-4">
            404
          </h1>
          <p className="text-lg font-display font-bold mb-2">This page got carved up.</p>
          <p className="text-muted-foreground mb-8 break-all text-sm">
            Nothing lives at <span className="font-mono text-foreground">{location.pathname}</span>
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Button asChild size="lg">
              <Link to="/">Back to Home</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/sitemap">
                <Search className="h-4 w-4 mr-2" /> Browse all pages
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <GlassCard className="p-4 h-full flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-semibold">{label}</span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
