import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { FEATURES, featureBySlug } from "@/lib/features";

const FeatureDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  const feature = featureBySlug(slug);

  if (!feature) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEO title="Feature not found — ZyphoraMC" description="The feature you're looking for doesn't exist." path="/features" />
        <Navbar />
        <main className="flex-1 container pt-28 pb-20 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Feature not found</h1>
          <p className="text-muted-foreground mb-6">That feature doesn't exist or has been renamed.</p>
          <Button onClick={() => nav("/features")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to features
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const idx = FEATURES.findIndex((f) => f.slug === feature.slug);
  const prev = idx > 0 ? FEATURES[idx - 1] : null;
  const next = idx < FEATURES.length - 1 ? FEATURES[idx + 1] : null;
  const Icon = feature.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${feature.title} — ZyphoraMC Features`}
        description={feature.desc}
        path={`/features/${feature.slug}`}
        type="article"
      />
      <Navbar />
      <main className="flex-1 container pt-28 pb-20 max-w-4xl">
        <Link
          to="/features"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> All features
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-4 mb-5">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 text-primary flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2 text-primary border-primary/40">
                Feature
              </Badge>
              <h1 className="font-display text-3xl md:text-5xl font-black leading-tight">{feature.title}</h1>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">{feature.desc}</p>
        </header>

        <Card className="p-6 md:p-8 mb-8 border-border/60">
          <h2 className="font-display font-bold text-xl mb-3">About this feature</h2>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{feature.long}</p>
        </Card>

        {feature.highlights.length > 0 && (
          <Card className="p-6 md:p-8 mb-10 border-border/60">
            <h2 className="font-display font-bold text-xl mb-4">Highlights</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {feature.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {prev ? (
            <Card
              role="button"
              tabIndex={0}
              onClick={() => nav(`/features/${prev.slug}`)}
              className="p-5 hover-lift cursor-pointer border-border/60"
            >
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1 flex items-center">
                <ArrowLeft className="h-3 w-3 mr-1" /> Previous
              </div>
              <div className="font-display font-bold">{prev.title}</div>
            </Card>
          ) : (
            <div />
          )}
          {next ? (
            <Card
              role="button"
              tabIndex={0}
              onClick={() => nav(`/features/${next.slug}`)}
              className="p-5 hover-lift cursor-pointer border-border/60 sm:text-right"
            >
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1 sm:justify-end flex items-center">
                Next <ArrowRight className="h-3 w-3 ml-1" />
              </div>
              <div className="font-display font-bold">{next.title}</div>
            </Card>
          ) : (
            <div />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FeatureDetail;
