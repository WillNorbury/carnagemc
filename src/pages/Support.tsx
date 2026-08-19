import { useEffect, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Particles from "@/components/site/Particles";
import { SEO } from "@/components/site/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ServerStatusWidget from "@/components/site/ServerStatusWidget";
import { LifeBuoy, MessageCircle, Mail, Send, BookOpen, Wallet, KeyRound, Wrench, Ticket as TicketIcon, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logWebsiteEvent } from "@/lib/logEvent";

const FALLBACK_FAQS = [
  { question: "How do I link my Minecraft account?", answer: "Run /link in-game to receive a one-time code, then use it on the website's profile page to bind your accounts." },
  { question: "I bought a rank but didn't receive it. What do I do?", answer: "Purchases sync within 5 minutes. If 30 minutes have passed, open a support ticket with your transaction ID." },
  { question: "Can I appeal a ban or mute?", answer: "Yes — submit a ban appeal from the appeals page with your username, punishment ID, and full statement." },
  { question: "How do voting rewards work?", answer: "Vote on each listed site once per day. Rewards auto-deliver in-game. Use /vote to claim missed rewards within 24h." },
  { question: "How do I report a player?", answer: "Use /report <player> <reason> in-game, or open a ticket with screenshots and clips. False reports are punishable." },
];

const TOPICS = [
  { icon: KeyRound, title: "Account & Login", desc: "Linking, 2FA, recovery, password resets." },
  { icon: Wallet, title: "Store & Payments", desc: "Ranks, refunds, missing purchases, currency." },
  { icon: Wrench, title: "Bugs & Issues", desc: "Lag, crashes, broken features, exploits." },
  { icon: BookOpen, title: "Gameplay Help", desc: "Commands, custom enchants, economy, events." },
];

type Faq = { question: string; answer: string };

const Support = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [faqs, setFaqs] = useState<Faq[]>(FALLBACK_FAQS);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("faqs" as any) as any)
        .select("question,answer,sort_order,created_at")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .limit(8);
      const list = (data as Faq[]) ?? [];
      if (list.length) setFaqs(list);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      email: f.email || user.email || "",
      name: f.name || (user.user_metadata as any)?.display_name || user.email?.split("@")[0] || "",
    }));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 10) {
      toast.error("Please add your name, email, and a message of at least 10 characters.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert([
      {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || "Support request",
        message: form.message.trim(),
        user_id: user?.id ?? null,
      },
    ]);
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm({ name: user?.email ? form.name : "", email: user?.email ?? "", subject: "", message: "" });
    toast.success("Message sent — our team replies within 24 hours.");
    logWebsiteEvent({
      kind: "contact_message",
      title: "New support message",
      detail: `From ${form.name} (${form.email})${form.subject ? ` — ${form.subject}` : ""}`,
      color: 0x10b981,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Support & Help Center — CarnageMC"
        description="Get help with your CarnageMC account, store purchases, bugs, and gameplay. Browse FAQs, check live server status, or open a support ticket."
        path="/support"
      />
      <Navbar />
      <main className="flex-1">
        <section className="relative pt-28 pb-14 overflow-hidden">
          <Particles count={20} />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />
          <div className="container relative text-center">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/40"><LifeBuoy className="h-3 w-3 mr-1" /> We're Here to Help</Badge>
            <h1 className="font-display text-4xl md:text-6xl font-black mb-3">Get <span className="text-gradient">Support</span></h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Find answers fast or talk to a human. Our team responds within 24 hours.</p>
          </div>
        </section>

        <div className="container pb-16 space-y-16">
          <section className="max-w-3xl mx-auto -mt-4">
            <ServerStatusWidget />
          </section>

          {/* Quick contact tiles */}
          <section className="grid md:grid-cols-3 gap-4">
            <Card className="p-7 border-primary/40 hover-lift hover-glow relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ background: "var(--gradient-fire)" }} />
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                    <TicketIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">Submit a Ticket</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Trackable + private</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Open a support ticket and chat directly with our staff. Track every reply.</p>
                <Button asChild className="w-full glow">
                  <Link to="/tickets">Open Tickets</Link>
                </Button>
              </div>
            </Card>
            <Card className="p-7 border-border hover-lift hover-glow">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Community Help</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Fastest response</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Browse the knowledge base and player guides for instant answers to common questions.</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/faq">Browse the FAQ</Link>
              </Button>
            </Card>
            <Card className="p-7 border-border hover-lift hover-glow">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-lg bg-secondary text-primary flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Contact the Team</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Within 24 hours</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">For billing, privacy, or formal requests — send the team a direct message.</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/contact">Contact Page</Link>
              </Button>
            </Card>
          </section>

          {/* Common topics */}
          <section>
            <div className="text-center mb-8">
              <div className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Browse Topics</div>
              <h2 className="font-display text-3xl font-bold">Common Help Topics</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TOPICS.map((t) => (
                <Card key={t.title} className="p-5 hover-lift hover-glow text-center">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-primary flex items-center justify-center mb-3">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold mb-1">{t.title}</h3>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ + Form */}
          <section className="grid lg:grid-cols-2 gap-6">
            <Card className="p-7">
              <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">FAQ</div>
              <h2 className="font-display text-2xl font-bold mb-5">Frequently Asked</h2>
              <Accordion type="single" collapsible>
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-semibold">{f.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line">{f.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <Button asChild variant="ghost" className="mt-4 px-0 text-primary">
                <Link to="/faq">See all answers <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </Card>

            <Card className="p-7 border-primary/30">
              <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Ask a Question</div>
              <h2 className="font-display text-2xl font-bold mb-1">Send a Message</h2>
              <p className="text-sm text-muted-foreground mb-5">
                {user ? "We'll reply to your account email." : "Not signed in? You can still reach us here."}
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Missing rank, bug report, account help…" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                  <p className="text-xs text-muted-foreground mt-1">{form.message.trim().length}/10 characters minimum</p>
                </div>
                <Button type="submit" disabled={sending} className="w-full glow">
                  <Send className="h-4 w-4 mr-2" /> {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
