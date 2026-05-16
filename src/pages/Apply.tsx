import { useEffect, useMemo, useState } from "react";
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
import {
  ShieldCheck,
  Hammer,
  Youtube,
  Loader2,
  ClipboardList,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { SEO } from "@/components/site/SEO";
import { cn } from "@/lib/utils";

type AppType = "staff" | "builder" | "youtuber";

const TYPES: { key: AppType; label: string; desc: string; icon: any }[] = [
  { key: "staff", label: "Staff", desc: "Help moderate, support players, and keep the server safe.", icon: ShieldCheck },
  { key: "builder", label: "Builder", desc: "Design and build spawns, hubs, and event arenas.", icon: Hammer },
  { key: "youtuber", label: "Content Creator", desc: "Stream or create videos featuring XyloMC.", icon: Youtube },
];

const STEPS = ["Role", "About you", "Your story", "Review"] as const;

const mcUsernameSchema = z.string().trim().regex(/^[A-Za-z0-9_]{3,16}$/, "Invalid Minecraft username");
const aboutSchema = z.object({
  mc_username: mcUsernameSchema,
  discord: z.string().trim().max(64).optional().or(z.literal("")),
  age: z.string().trim().refine((v) => v === "" || (/^\d+$/.test(v) && +v >= 10 && +v <= 99), "Age 10–99"),
  timezone: z.string().trim().max(64).optional().or(z.literal("")),
});
const storySchema = z.object({
  experience: z.string().trim().max(2000).optional().or(z.literal("")),
  why: z.string().trim().min(30, "Tell us a bit more (min 30 chars)").max(2000),
  portfolio_url: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
});

const Apply = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
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

  const selected = useMemo(() => TYPES.find((t) => t.key === type)!, [type]);

  const next = () => {
    if (step === 1) {
      const r = aboutSchema.safeParse(form);
      if (!r.success) return toast.error(r.error.issues[0].message);
    }
    if (step === 2) {
      const r = storySchema.safeParse(form);
      if (!r.success) return toast.error(r.error.issues[0].message);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!user) return;
    const a = aboutSchema.safeParse(form);
    if (!a.success) {
      setStep(1);
      return toast.error(a.error.issues[0].message);
    }
    const s = storySchema.safeParse(form);
    if (!s.success) {
      setStep(2);
      return toast.error(s.error.issues[0].message);
    }
    setSubmitting(true);
    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      type,
      mc_username: a.data.mc_username,
      discord: a.data.discord || null,
      age: a.data.age ? parseInt(a.data.age, 10) : null,
      timezone: a.data.timezone || null,
      experience: s.data.experience || null,
      why: s.data.why,
      portfolio_url: s.data.portfolio_url || null,
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Apply — Join the XyloMC Team"
        description="Apply to join the XyloMC team as Staff, Builder, or Content Creator. Help shape the server and earn exclusive perks."
        path="/apply"
      />
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
            Help shape XyloMC. Pick a role and tell us about yourself.
          </p>
        </header>

        {/* Stepper */}
        <ol className="flex items-center justify-between mb-8 gap-2">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="flex-1 flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-full grid place-items-center text-xs font-bold border transition",
                    done && "bg-primary border-primary text-primary-foreground",
                    active && "border-primary text-primary",
                    !done && !active && "border-border text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs sm:text-sm truncate",
                    active ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1 mx-1", done ? "bg-primary" : "bg-border")} />
                )}
              </li>
            );
          })}
        </ol>

        <Card className="p-6 space-y-5">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display font-bold text-lg">Choose a role</h2>
                <p className="text-sm text-muted-foreground">Pick the application that fits you best.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = type === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setType(t.key)}
                      className={cn(
                        "text-left p-4 rounded-xl border transition",
                        active
                          ? "border-primary bg-primary/10 shadow-elegant"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 mb-2", active ? "text-primary" : "text-muted-foreground")} />
                      <div className="font-display font-bold">{t.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display font-bold text-lg">About you</h2>
                <p className="text-sm text-muted-foreground">Basic details so we can reach out.</p>
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
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display font-bold text-lg">Your story</h2>
                <p className="text-sm text-muted-foreground">Tell us why you'd be a great fit.</p>
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
                    {type === "builder"
                      ? "Portfolio URL (Imgur, Planet Minecraft, etc.)"
                      : "Channel URL (YouTube, Twitch, TikTok)"}
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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display font-bold text-lg">Review & submit</h2>
                <p className="text-sm text-muted-foreground">Make sure everything looks right.</p>
              </div>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Row label="Role" value={selected.label} />
                <Row label="Minecraft" value={form.mc_username} />
                <Row label="Discord" value={form.discord || "—"} />
                <Row label="Age" value={form.age || "—"} />
                <Row label="Timezone" value={form.timezone || "—"} />
                {form.portfolio_url && <Row label="Portfolio" value={form.portfolio_url} />}
              </dl>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Why</div>
                <p className="text-sm whitespace-pre-wrap rounded-md border border-border p-3 bg-muted/30">
                  {form.why || "—"}
                </p>
              </div>
              {form.experience && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Experience</div>
                  <p className="text-sm whitespace-pre-wrap rounded-md border border-border p-3 bg-muted/30">
                    {form.experience}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={back} disabled={step === 0 || submitting}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} size="lg">
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting} size="lg" className="glow">
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit application
              </Button>
            )}
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
    <dd className="font-medium break-words">{value}</dd>
  </div>
);

export default Apply;
