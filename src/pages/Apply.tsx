import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { z } from "zod";
import { ShieldCheck, Hammer, Youtube, Loader2, ClipboardList } from "lucide-react";

type AppType = "staff" | "builder" | "youtuber";

const TYPES: { key: AppType; label: string; desc: string; icon: any }[] = [
  { key: "staff", label: "Staff", desc: "Help moderate, support players, and keep the server safe.", icon: ShieldCheck },
  { key: "builder", label: "Builder", desc: "Design and build spawns, hubs, and event arenas.", icon: Hammer },
  { key: "youtuber", label: "Content Creator", desc: "Stream or create videos featuring ZyphoraMC.", icon: Youtube },
];

const schema = z.object({
  mc_username: z.string().trim().regex(/^[A-Za-z0-9_]{3,16}$/, "Invalid Minecraft username"),
  discord: z.string().trim().max(64).optional().or(z.literal("")),
  age: z.coerce.number().int().min(10).max(99).optional().or(z.nan()),
  timezone: z.string().trim().max(64).optional().or(z.literal("")),
  experience: z.string().trim().max(2000).optional().or(z.literal("")),
  why: z.string().trim().min(30, "Tell us a bit more (min 30 chars)").max(2000),
  portfolio_url: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
});

const Apply = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<AppType>("staff");
  const [form, setForm] = useState({
    mc_username: "",
    discord: "",
    age: "",
    timezone: "",
    experience: "",
    why: "",
    portfolio_url: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Apply — ZyphoraMC";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    supabase
      .from("profiles")
      .select("mc_username")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.mc_username) setForm((f) => ({ ...f, mc_username: data.mc_username! }));
      });
  }, [user, authLoading, navigate]);

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first.message);
      return;
    }
    setSubmitting(true);
    const v = parsed.data;
    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      type,
      mc_username: v.mc_username,
      discord: v.discord || null,
      age: v.age && !Number.isNaN(v.age) ? v.age : null,
      timezone: v.timezone || null,
      experience: v.experience || null,
      why: v.why,
      portfolio_url: v.portfolio_url || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted! We'll review it soon.");
    navigate("/dashboard");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  const selected = TYPES.find((t) => t.key === type)!;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container pt-28 pb-16 max-w-3xl">
        <header className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3 text-primary border-primary/40">
            <ClipboardList className="h-3 w-3 mr-1" /> Applications Open
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-black mb-2">
            Join the <span className="text-gradient">Team</span>
          </h1>
          <p className="text-muted-foreground">
            Help shape ZyphoraMC. Pick a role and tell us about yourself.
          </p>
        </header>

        {/* Type picker */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`text-left p-4 rounded-xl border transition ${
                  active
                    ? "border-primary bg-primary/10 shadow-elegant"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <div className="font-display font-bold">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
              </button>
            );
          })}
        </div>

        <Card className="p-6 space-y-5">
          <div>
            <h2 className="font-display font-bold text-lg">{selected.label} Application</h2>
            <p className="text-sm text-muted-foreground">{selected.desc}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mc">Minecraft username *</Label>
              <Input
                id="mc"
                value={form.mc_username}
                onChange={(e) => setForm({ ...form, mc_username: e.target.value })}
                placeholder="Notch"
                maxLength={16}
              />
            </div>
            <div>
              <Label htmlFor="discord">Discord username</Label>
              <Input
                id="discord"
                value={form.discord}
                onChange={(e) => setForm({ ...form, discord: e.target.value })}
                placeholder="user#0000"
                maxLength={64}
              />
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={10}
                max={99}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="18"
              />
            </div>
            <div>
              <Label htmlFor="tz">Timezone</Label>
              <Input
                id="tz"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                placeholder="UTC, EST, PST..."
                maxLength={64}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="exp">Relevant experience</Label>
            <Textarea
              id="exp"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              placeholder="Past servers, communities, projects..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div>
            <Label htmlFor="why">Why do you want to join? *</Label>
            <Textarea
              id="why"
              value={form.why}
              onChange={(e) => setForm({ ...form, why: e.target.value })}
              placeholder="Tell us what motivates you..."
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1">{form.why.length}/2000</p>
          </div>

          {(type === "builder" || type === "youtuber") && (
            <div>
              <Label htmlFor="portfolio">
                {type === "builder" ? "Portfolio URL (Imgur, Planet Minecraft, etc.)" : "Channel URL (YouTube, Twitch, TikTok)"}
              </Label>
              <Input
                id="portfolio"
                value={form.portfolio_url}
                onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                placeholder="https://..."
                maxLength={500}
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={submit} disabled={submitting} size="lg" className="glow">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit application
            </Button>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Apply;
