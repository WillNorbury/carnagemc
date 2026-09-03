import { useEffect, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { GlassCard, PageHero, Reveal } from "@/components/site/ui-kit";
import { cn } from "@/lib/utils";
import { ScrollText } from "lucide-react";

export type LegalSection = { id: string; heading: string; body: string[] };

export type LegalDoc = {
  path: string;
  eyebrow: string;
  title: string;
  highlight: string;
  intro: string;
  seoDescription: string;
  updated: string;
  sections: LegalSection[];
};

const LegalPage = ({ doc }: { doc: LegalDoc }) => {
  const [active, setActive] = useState(doc.sections[0]?.id ?? "");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    doc.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [doc]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={`${doc.title} ${doc.highlight} — Warden Network`} description={doc.seoDescription} path={doc.path} />
      <Navbar />
      <main className="flex-1">
        <PageHero
          eyebrow={
            <>
              <ScrollText className="h-3 w-3 mr-1" /> {doc.eyebrow}
            </>
          }
          title={doc.title}
          highlight={doc.highlight}
          description={doc.intro}
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Last updated · {doc.updated}
          </p>
        </PageHero>

        <div className="container pb-24 grid lg:grid-cols-[240px_1fr] gap-10 items-start">
          <nav aria-label="Sections" className="hidden lg:block lg:sticky lg:top-24">
            <ul className="space-y-1 border-l border-border/60">
              {doc.sections.map((s) => (
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
            {doc.sections.map((s, i) => (
              <Reveal key={s.id} delay={i * 40}>
                <GlassCard id={s.id} className="p-6 md:p-8 scroll-mt-24">
                  <h2 className="font-display text-2xl font-black mb-4">{s.heading}</h2>
                  <div className="space-y-4">
                    {s.body.map((p, j) => (
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
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
