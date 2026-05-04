import { useEffect } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Gift } from "lucide-react";

const SITES = [
  { name: "MinecraftServers.org", url: "https://minecraftservers.org/", reward: "1 vote crate key" },
  { name: "MinecraftMP", url: "https://minecraft-mp.com/", reward: "1 vote crate key" },
  { name: "PlanetMinecraft", url: "https://www.planetminecraft.com/", reward: "1 vote crate key" },
  { name: "TopG", url: "https://topg.org/minecraft-servers/", reward: "1 vote crate key" },
];

const Vote = () => {
  useEffect(() => {
    document.title = "Vote — ZyphoraMC";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-28 pb-16">
        <header className="mb-10 text-center max-w-2xl mx-auto">
          <Gift className="h-10 w-10 mx-auto text-primary mb-3" />
          <h1 className="text-4xl font-bold tracking-tight">Vote for ZyphoraMC</h1>
          <p className="text-muted-foreground mt-2">
            Vote daily on the sites below to support the server and earn in-game rewards.
            Run <code className="text-foreground">/vote</code> in-game to claim.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {SITES.map((s) => (
            <Card key={s.name} className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">Reward: {s.reward}</p>
              </div>
              <Button asChild size="sm">
                <a href={s.url} target="_blank" rel="noreferrer noopener">
                  Vote <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Vote;
