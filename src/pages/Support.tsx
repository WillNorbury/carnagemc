import { useEffect, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Particles from "@/components/site/Particles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ServerStatusWidget from "@/components/site/ServerStatusWidget";
import { LifeBuoy, MessageCircle, Mail, Send, BookOpen, Wallet, KeyRound, Wrench, Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const FAQS = [
  { q: "How do I link my Minecraft account?", a: "Run /link in-game to receive a one-time code, then use it on the website's profile page to bind your accounts." },
  { q: "I bought a rank but didn't receive it. What do I do?", a: "Purchases sync within 5 minutes. If 30 minutes have passed, open a ticket in Discord with your transaction ID." },
  { q: "Can I appeal a ban or mute?", a: "Yes — use the #appeals channel on Discord. Provide your username, the punishment ID, and your full statement." },
  { q: "How do voting rewards work?", a: "Vote on each listed site once per day. Rewards auto-deliver in-game. Use /vote to claim missed rewards within 24h." },
  { q: "Are cracked / non-premium accounts allowed?", a: "Yes. XyloID secures cracked accounts with mandatory 2FA. Premium accounts skip 2FA after first login." },
  { q: "How do I report a player?", a: "Use /report <player> <reason> in-game, or open a ticket in Discord with screenshots/clips. False reports are punishable." },
];

const TOPICS = [
  { icon: KeyRound, title: "Account & Login", desc: "Linking, 2FA, recovery, password resets." },
  { icon: Wallet, title: "Store & Payments", desc: "Ranks, refunds, missing purchases, currency." },
  { icon: Wrench, title: "Bugs & Issues", desc: "Lag, crashes, broken features, exploits." },
  { icon: BookOpen, title: "Gameplay Help", desc: "Commands, custom enchants, economy, events." },
];

const Support = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => { document.title = "Support — XyloMC"; }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill out all required fields.");
      return;
    }
    setSending(true);
    // Simulate send (no backend mailer wired). Could be replaced with a Cloud function.
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setForm({ name: "", email: "", subject: "", message: "" });
    toast.success("Message sent. Our team will get back to you within 24 hours.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          {/* Live server status */}
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
                  <h3 className="font-display font-bold text-lg">Discord Support</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Fastest response</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Open a ticket in our #support channel for instant help from staff and the community.</p>
              <Button asChild className="w-full glow">
                <a href="https://discord.xylomc.net" target="_blank" rel="noreferrer">Join Discord</a>
              </Button>
            </Card>
            <Card className="p-7 border-border hover-lift hover-glow">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-lg bg-secondary text-primary flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Email Us</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Within 24 hours</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">For billing, privacy, or formal requests — reach us directly by email.</p>
              <Button asChild variant="outline" className="w-full">
                <a href="mailto:support@xylomc.net">support@xylomc.net</a>
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
                {FAQS.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            <Card className="p-7 border-primary/30">
              <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Contact Form</div>
              <h2 className="font-display text-2xl font-bold mb-5">Send a Message</h2>
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
                  <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
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
