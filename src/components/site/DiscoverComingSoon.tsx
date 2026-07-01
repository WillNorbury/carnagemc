import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";

const DISCOVER_TABS = [
  { label: "Mods", to: "/mods", enabled: true },
  { label: "Resource Packs", to: "/resource-packs", enabled: true },
  { label: "Data Packs", to: "/data-packs", enabled: true },
  { label: "Shaders", to: "/shaders", enabled: true },
  { label: "Modpacks", to: "/modpacks", enabled: true },
  { label: "Plugins", to: "/plugins", enabled: true },
  { label: "Servers", to: "/servers", enabled: true },
];

type Section = { title: string; items: string[] };

type Props = {
  title: string;
  searchPlaceholder: string;
  sections: Section[];
};

const DiscoverComingSoon = ({ title, searchPlaceholder, sections }: Props) => {
  useEffect(() => {
    document.title = `${title} — CarnageMC`;
  }, [title]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16">
        {/* Discover tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex flex-wrap gap-1 p-1 rounded-full border border-border bg-card/60">
            {DISCOVER_TABS.map((t) => (
              <NavLink
                key={t.label}
                to={t.to}
                end
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/40"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            {sections.map((s) => (
              <Card key={s.title} className="p-4">
                <h3 className="font-display font-semibold mb-3">{s.title}</h3>
                <ul className="space-y-1.5">
                  {s.items.map((i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground/70 cursor-not-allowed"
                    >
                      {i}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </aside>

          {/* Main */}
          <section className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                disabled
                className="pl-9"
              />
            </div>

            <Card className="p-12 flex flex-col items-center justify-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-semibold">
                {title} are coming soon
              </h2>
              <p className="text-muted-foreground max-w-md">
                We're working on bringing {title.toLowerCase()} to CarnageMC. Check
                back soon to browse, search, and download.
              </p>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DiscoverComingSoon;
