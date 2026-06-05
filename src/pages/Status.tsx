import { useEffect, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2 } from "lucide-react";

type Range = 7 | 30 | 365;

const RANGES: { label: string; value: Range }[] = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "365 days", value: 365 },
];

const SERVICES = [
  { name: "Website", desc: "Main site & dashboard" },
  { name: "Minecraft Server", desc: "play.havocsmp.net" },
  { name: "API & Database", desc: "Backend services" },
  { name: "Discord Bot", desc: "Community automation" },
];

const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const DayGrid = ({ days }: { days: number }) => {
  const today = new Date();
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return d;
  });

  // Sizing per range
  const sizeClass =
    days === 7
      ? "h-10 w-10 rounded-md"
      : days === 30
      ? "h-6 w-3 rounded-sm"
      : "h-5 w-[5px] rounded-[2px]";

  const gapClass = days === 7 ? "gap-2" : days === 30 ? "gap-1" : "gap-[2px]";

  return (
    <div className={`flex flex-wrap ${gapClass}`}>
      {cells.map((d, i) => (
        <div
          key={i}
          className={`${sizeClass} bg-primary/80 hover:bg-primary transition-colors cursor-pointer`}
          title={`${formatDate(d)} — Operational`}
        />
      ))}
    </div>
  );
};

const Status = () => {
  const [range, setRange] = useState<Range>(30);

  useEffect(() => {
    document.title = "Status — HavocSMP";
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/40">
              <Activity className="h-3 w-3 mr-1" /> System Status
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-3">
              All Systems <span className="text-gradient">Operational</span>
            </h1>
            <p className="text-muted-foreground">Live uptime overview for all HavocSMP services.</p>
          </div>

          {/* Overall status banner */}
          <Card className="p-6 mb-8 border-primary/30 bg-primary/5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-lg">All services operational</div>
              <div className="text-sm text-muted-foreground">
                100% uptime across the selected window.
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-2xl font-display font-black text-gradient">100%</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Uptime</div>
            </div>
          </Card>

          {/* Range selector */}
          <div className="flex items-center justify-end gap-2 mb-4">
            {RANGES.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant={range === r.value ? "default" : "outline"}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>

          {/* Services list */}
          <div className="space-y-4">
            {SERVICES.map((s) => (
              <Card key={s.name} className="p-5 hover-glow">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="font-display font-bold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                  <Badge variant="secondary" className="text-primary border-primary/40 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse mr-1.5" />
                    Operational
                  </Badge>
                </div>
                <DayGrid days={range} />
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                  <span>{range} days ago</span>
                  <span>100% uptime</span>
                  <span>Today</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Status;
