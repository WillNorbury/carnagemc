import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  Package,
  Database,
  Sparkle,
  Boxes,
  Server as ServerIcon,
  Palette,
  Puzzle,
  Code2,
} from "lucide-react";

const categories = [
  { to: "/discover/plugins", label: "Plugins", icon: Puzzle, count: "Server tools" },
  { to: "/discover/mods", label: "Mods", icon: Code2, count: "Client & server" },
  { to: "/discover/resource-packs", label: "Resource Packs", icon: Palette, count: "Visual overhauls" },
  { to: "/discover/data-packs", label: "Data Packs", icon: Database, count: "Vanilla tweaks" },
  { to: "/discover/shaders", label: "Shaders", icon: Sparkle, count: "Lighting & FX" },
  { to: "/discover/modpacks", label: "Modpacks", icon: Boxes, count: "Curated bundles" },
  { to: "/discover/servers", label: "Servers", icon: ServerIcon, count: "Communities" },
  { to: "/discover/plugins", label: "More", icon: Package, count: "Browse all" },
];

const trust = [
  { icon: ShieldCheck, label: "Licensed & verified" },
  { icon: Zap, label: "Instant download" },
  { icon: TrendingUp, label: "Updated daily" },
];

const Discover = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Discover — Plugins, Mods, Packs & Servers"
        description="The home for premium plugins, mods, resource packs, shaders, modpacks and servers. One marketplace. Instant delivery."
      />
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: "var(--gradient-fire)" }}
          />
          <div
            aria-hidden
            className="absolute top-24 right-10 h-40 w-56 rounded-2xl border border-primary/30 rotate-12 animate-float pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute bottom-10 left-16 h-32 w-44 rounded-2xl border border-primary/20 -rotate-12 animate-float pointer-events-none"
            style={{ animationDelay: "1.5s" }}
          />

          <div className="container relative pt-32 pb-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">
                Thousands of creations from trusted creators
              </span>
            </div>

            <h1 className="mt-8 font-display font-bold text-5xl sm:text-6xl md:text-7xl leading-[1.05]">
              Build better servers
              <br />
              <span className="text-gradient">faster than ever.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground">
              The home for premium plugins, mods, resource packs, shaders,
              modpacks and servers. One marketplace. Instant delivery.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:opacity-90">
                <Link to="/discover/plugins">
                  Browse marketplace <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/apply">Become a creator</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {trust.map((t) => (
                <div key={t.label} className="inline-flex items-center gap-2">
                  <t.icon className="h-4 w-4 text-primary" />
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="container pb-24">
          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl sm:text-3xl">
              Browse by category
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Find exactly what your server needs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map(({ to, label, icon: Icon, count }) => (
              <Link
                key={label}
                to={to}
                className="group relative rounded-xl border border-border bg-card p-5 hover-lift hover-glow overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                <div className="relative flex flex-col items-center text-center gap-2">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="font-display font-semibold">{label}</div>
                  <div className="text-xs text-muted-foreground">{count}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Discover;
