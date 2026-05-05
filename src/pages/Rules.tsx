import { useEffect } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Particles from "@/components/site/Particles";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Swords, Gavel, Scale, ShieldCheck, Ban } from "lucide-react";

const SECTIONS = [
  {
    icon: MessageSquare,
    title: "Chat Rules",
    items: [
      "No hate speech, slurs, or discrimination of any kind.",
      "No spamming, flooding, or excessive caps.",
      "English in global chat. Use language-specific channels otherwise.",
      "No advertising other servers, services, or unrelated links.",
      "Keep arguments out of chat — take it to DMs or open a ticket.",
    ],
  },
  {
    icon: Swords,
    title: "PvP Rules",
    items: [
      "No client-side modifications that grant an unfair advantage.",
      "Combat logging counts as a death and may result in further punishment.",
      "Spawn-camping outside designated PvP zones is forbidden.",
      "Teaming in solo events disqualifies all involved players.",
      "Exploiting unintended mechanics (rubberband, lag-switching) = ban.",
    ],
  },
  {
    icon: Gavel,
    title: "Punishment System",
    items: [
      "1st offense: warning or temporary mute / kick.",
      "2nd offense: 24h–7d suspension depending on severity.",
      "3rd offense: 30 day ban + economy reset.",
      "Major violations (cheating, doxxing): permanent ban, no appeal.",
      "Appeals open through the Discord ticket system.",
    ],
  },
  {
    icon: Scale,
    title: "Fair Play",
    items: [
      "No duplication, item glitches, or economy exploitation.",
      "Report bugs through staff — silently abusing them is bannable.",
      "Alt accounts may not bypass punishments under any circumstances.",
      "Account sharing is at your own risk; we do not protect compromised accounts.",
      "Be excellent to each other. The community thrives when you do.",
    ],
  },
];

const Rules = () => {
  useEffect(() => { document.title = "Rules — ZyphoraMC"; }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative pt-28 pb-14 overflow-hidden">
          <Particles count={20} />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />
          <div className="container relative text-center">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/40"><ShieldCheck className="h-3 w-3 mr-1" /> Code of Conduct</Badge>
            <h1 className="font-display text-4xl md:text-6xl font-black mb-3">Server <span className="text-gradient">Rules</span></h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These rules keep the ZyphoraMC community competitive, fair, and welcoming. By playing, you agree to follow them.
            </p>
          </div>
        </section>

        <div className="container pb-16 space-y-6 max-w-4xl">
          {SECTIONS.map((s, idx) => (
            <Card key={s.title} className="p-7 hover-glow border-border/60 group">
              <div className="flex items-start gap-5">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-primary flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-display text-xs uppercase tracking-widest text-primary">Section {String(idx + 1).padStart(2, "0")}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-4">{s.title}</h2>
                  <ul className="space-y-2.5">
                    {s.items.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="text-primary font-mono mt-0.5">{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}

          <Card className="p-7 border-destructive/40 bg-destructive/5">
            <div className="flex items-start gap-4">
              <Ban className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-bold mb-1">Zero Tolerance</h3>
                <p className="text-sm text-muted-foreground">
                  Cheating, doxxing, and DDoS threats result in immediate permanent bans across all ZyphoraMC services with no appeal.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Rules;
