import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import { fetchFeatures, type Feature } from "@/lib/features";

const Features = () => {
  const nav = useNavigate();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures().then((f) => {
      setFeatures(f);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Features — ZyphoraMC"
        description="Explore every system that powers ZyphoraMC: lifesteal PvP, custom enchants, player economy, ranked seasons, weekly events, and more."
        path="/features"
      />
      <Navbar />
      <main className="flex-1 container pt-28 pb-20">
        <header className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="mb-4 text-primary border-primary/40">
            <Sparkles className="h-3 w-3 mr-1" /> Server Features
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl font-black mb-4">
            Built for <span className="text-gradient">Legends</span>
          </h1>
          <p className="text-muted-foreground md:text-lg">
            Every system, every detail — engineered to make your gameplay matter.
          </p>
        </header>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading features…</p>
        ) : features.length === 0 ? (
          <p className="text-center text-muted-foreground">No features published yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card
                key={f.slug}
                role="button"
                tabIndex={0}
                onClick={() => nav(`/features/${f.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    nav(`/features/${f.slug}`);
                  }
                }}
                className="group relative p-6 hover-lift hover-glow border-border/60 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.08), transparent)" }}
                />
                <div className="relative">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-primary flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display font-bold text-lg mb-2">{f.title}</h2>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                  <div className="mt-4 inline-flex items-center text-xs text-primary">
                    Learn more <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Features;
