import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { GlassCard, PageHero, Reveal } from "@/components/site/ui-kit";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type ContentSection = { id: string; heading: string; body: string[] };

type PageRow = {
  slug: string;
  title: string;
  highlight: string;
  eyebrow: string;
  intro: string;
  seo_description: string;
  icon: string;
  updated_label: string;
  sections: ContentSection[];
};

const getIcon = (name?: string | null) => {
  const Fallback = Icons.BookOpen;
  if (!name) return Fallback;
  const Comp = (Icons as unknown as Record<string, unknown>)[name];
  return (typeof Comp === "function" || typeof Comp === "object") && Comp
    ? (Comp as typeof Icons.BookOpen)
    : Fallback;
};

const ContentPage = ({ slug }: { slug: string }) => {
  const [page, setPage] = useState<PageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("site_pages")
      .select("slug,title,highlight,eyebrow,intro,seo_description,icon,updated_label,sections")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setPage(
          data
            ? ({
                ...data,
                sections: Array.isArray(data.sections) ? (data.sections as unknown as ContentSection[]) : [],
              } as PageRow)
            : null,
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const sections = useMemo(() => page?.sections ?? [], [page]);

  useEffect(() => {
    if (!sections.length) return;
    setActive(sections[0].id);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  const Icon = getIcon(page?.icon);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${page ? `${page.title} ${page.highlight}`.trim() : "Page"} — Warden Network`}
        description={page?.seo_description || "Warden Network Minecraft network."}
        path={`/${slug}`}
      />
      <Navbar />
      <main className="flex-1">
        {loading ? (
          <div className="container pt-28 pb-24 space-y-6">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !page ? (
          <div className="container pt-32 pb-24 text-center">
            <h1 className="font-display text-4xl font-black mb-3">Page not found</h1>
            <p className="text-muted-foreground mb-6">This page hasn't been published yet.</p>
            <Link to="/" className="text-primary underline underline-offset-4">
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <PageHero
              eyebrow={
                <>
                  <Icon className="h-3 w-3 mr-1" /> {page.eyebrow}
                </>
              }
              title={page.title}
              highlight={page.highlight}
              description={page.intro}
            >
              {page.updated_label && (
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Last updated · {page.updated_label}
                </p>
              )}
            </PageHero>

            <div className="container pb-24 grid lg:grid-cols-[240px_1fr] gap-10 items-start">
              <nav aria-label="Sections" className="hidden lg:block lg:sticky lg:top-24">
                <ul className="space-y-1 border-l border-border/60">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={cn(
                          "block border-l-2 -ml-px px-4 py-1.5 text-sm transition-colors",
                          active === s.id
                            ? "border-primary text-primary font-medium"
                            : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {s.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-6 min-w-0">
                {sections.map((s, i) => (
                  <Reveal key={s.id} delay={i * 40}>
                    <GlassCard id={s.id} className="p-6 md:p-8 scroll-mt-24">
                      <h2 className="font-display text-2xl font-black mb-4">{s.heading}</h2>
                      <div className="space-y-4">
                        {(s.body ?? []).map((p, j) => (
                          <p key={j} className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            {p}
                          </p>
                        ))}
                      </div>
                    </GlassCard>
                  </Reveal>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ContentPage;
