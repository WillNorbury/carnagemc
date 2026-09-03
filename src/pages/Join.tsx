import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Monitor, Gamepad2, Smartphone, HelpCircle } from "lucide-react";

type Platform = "java" | "bedrock" | "console";

const TABS: { id: Platform; label: string; Icon: typeof Monitor }[] = [
  { id: "java", label: "Java (PC)", Icon: Monitor },
  { id: "bedrock", label: "Bedrock / Mobile", Icon: Smartphone },
  { id: "console", label: "Xbox / Switch / PS", Icon: Gamepad2 },
];

export default function Join() {
  const [ip, setIp] = useState("play.carnagemc.net");
  const [bedrockIp, setBedrockIp] = useState("play.carnagemc.net");
  const [bedrockPort, setBedrockPort] = useState("25577");
  const [tab, setTab] = useState<Platform>("java");

  useEffect(() => {
    supabase
      .from("site_content")
      .select("value")
      .eq("key", "server")
      .maybeSingle()
      .then(({ data }) => {
        const v = data?.value as Record<string, string> | null;
        if (v?.ip) setIp(v.ip);
        if (v?.bedrockIp && v.bedrockIp !== "Soon") setBedrockIp(v.bedrockIp);
        if (v?.bedrockPort && v.bedrockPort !== "Soon") setBedrockPort(v.bedrockPort);
      });
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <li className="relative pl-12 pb-8 last:pb-0 border-l border-border last:border-transparent ml-4">
      <span className="absolute -left-4 top-0 h-8 w-8 rounded-full bg-primary/15 border border-primary/40 text-primary font-display font-bold flex items-center justify-center text-sm">
        {n}
      </span>
      <h3 className="font-display font-bold mb-1">{title}</h3>
      <div className="text-sm text-muted-foreground space-y-2">{children}</div>
    </li>
  );

  const CopyRow = ({ label, value }: { label: string; value: string }) => (
    <button
      onClick={() => copy(value, label)}
      className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-secondary/60 border border-border hover:border-primary/60 transition text-left"
    >
      <span className="min-w-0">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="block font-mono font-bold truncate">{value}</span>
      </span>
      <span className="flex items-center gap-1.5 text-primary text-xs uppercase tracking-wider">
        <Copy className="h-4 w-4" /> Copy
      </span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>How to Join Warden Network — Java, Bedrock & Console</title>
        <meta
          name="description"
          content="Step-by-step guide to joining the Warden Network Minecraft Lifesteal server on Java, Bedrock, mobile, Xbox, Switch and PlayStation."
        />
        <link rel="canonical" href="https://carnagemc.net/join" />
      </Helmet>
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="text-[10px] font-mono tracking-widest uppercase text-primary mb-2">Get started</div>
        <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">How to join Warden Network</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Pick your platform below. Java and Bedrock players share the same world — console players need one
          extra step because Minecraft blocks custom servers by default.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          <CopyRow label="Java IP" value={ip} />
          <CopyRow label="Bedrock IP" value={bedrockIp} />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(({ id, label, Icon }) => (
            <Button
              key={id}
              variant={tab === id ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(id)}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
            </Button>
          ))}
        </div>

        <Card className="p-6 md:p-8">
          {tab === "java" && (
            <ol className="list-none">
              <Step n={1} title="Launch Minecraft: Java Edition">
                <p>Use version <strong>1.21 or newer</strong>. Any 1.21.x release works — we run Paper behind a Velocity proxy.</p>
              </Step>
              <Step n={2} title="Open Multiplayer → Add Server">
                <p>Server name can be anything. In the address field paste:</p>
                <code className="inline-block font-mono text-foreground bg-secondary/60 px-2 py-1 rounded">{ip}</code>
              </Step>
              <Step n={3} title="Join and pick your kit">
                <p>Double-click the server in your list. You'll spawn at hub — run <code className="font-mono">/play</code> to drop into Lifesteal.</p>
              </Step>
            </ol>
          )}

          {tab === "bedrock" && (
            <ol className="list-none">
              <Step n={1} title="Open Minecraft (Windows, iOS, Android)">
                <p>Bedrock Edition 1.21+ is required. Make sure you're signed into your Microsoft account.</p>
              </Step>
              <Step n={2} title="Play → Servers → Add Server">
                <p>Scroll to the bottom of the Servers tab and tap <strong>Add Server</strong>.</p>
              </Step>
              <Step n={3} title="Enter the address and port">
                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <CopyRow label="Server address" value={bedrockIp} />
                  <CopyRow label="Port" value={bedrockPort} />
                </div>
              </Step>
              <Step n={4} title="Save and join">
                <p>The server will appear in your Servers list permanently. Tap it to connect.</p>
              </Step>
            </ol>
          )}

          {tab === "console" && (
            <ol className="list-none">
              <Step n={1} title="Why the extra step">
                <p>
                  Xbox, Switch and PlayStation only allow the four Microsoft "featured" servers by default. To reach
                  any community server you route your console's DNS through a free relay — this is safe, reversible,
                  and does not modify your console or your account.
                </p>
              </Step>
              <Step n={2} title="Change your console's DNS">
                <p>
                  Go to <strong>Settings → Network → Advanced Settings → DNS Settings → Manual</strong> and set the
                  primary DNS to a Minecraft server relay (BedrockConnect and similar free services publish current
                  addresses). Leave the secondary DNS as-is, then restart Minecraft.
                </p>
              </Step>
              <Step n={3} title="Open the Servers tab">
                <p>
                  Join any of the featured servers (Lifeboat, Mineplex, etc.). Instead of that server you'll see a
                  server-list menu from the relay.
                </p>
              </Step>
              <Step n={4} title="Add Warden Network">
                <p>Choose <strong>Add Server</strong> in that menu and enter:</p>
                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <CopyRow label="Server address" value={bedrockIp} />
                  <CopyRow label="Port" value={bedrockPort} />
                </div>
              </Step>
              <Step n={5} title="Reverting">
                <p>Set your DNS back to <strong>Automatic</strong> at any time to undo the change completely.</p>
              </Step>
            </ol>
          )}
        </Card>

        <Card className="mt-6 p-6 flex items-start gap-4">
          <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-display font-bold mb-1">Still can't connect?</p>
            <p className="text-muted-foreground">
              Check the live <a className="text-primary hover:underline" href="/status">server status</a> first, then open a{" "}
              <a className="text-primary hover:underline" href="/support">support ticket</a> or ask in{" "}
              <a className="text-primary hover:underline" href="/discord">Discord</a> and staff will help you out.
            </p>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
