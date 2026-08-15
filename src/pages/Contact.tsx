import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { logWebsiteEvent } from "@/lib/logEvent";
import { Helmet } from "react-helmet-async";
import { Mail, MessageCircle, ExternalLink, Phone, Crown } from "lucide-react";

const OWNER_EMAIL = "william@norbury.com.au";

const ownerSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(4000),
});

type Method = { id: string; label: string; type: string; value: string; icon: string | null };

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10).max(4000),
});

function methodHref(m: Method) {
  if (m.type === "email") return `mailto:${m.value}`;
  if (/^https?:\/\//.test(m.value)) return m.value;
  return m.value;
}
function MethodIcon({ type }: { type: string }) {
  const Cls = "h-5 w-5";
  if (type === "email") return <Mail className={Cls} />;
  if (type === "discord") return <MessageCircle className={Cls} />;
  if (type === "phone") return <Phone className={Cls} />;
  return <ExternalLink className={Cls} />;
}

export default function Contact() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<Method[]>([]);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ email: "", reason: "", message: "" });

  useEffect(() => {
    supabase
      .from("contact_methods")
      .select("id, label, type, value, icon")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setMethods((data as Method[]) ?? []));
  }, []);

  async function submit() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const d = parsed.data;
    const { error } = await supabase.from("contact_messages").insert([{
      name: d.name,
      email: d.email,
      message: d.message,
      subject: d.subject || null,
      user_id: user?.id ?? null,
    }]);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Message sent! We'll get back to you.");
    logWebsiteEvent({
      kind: "contact_message",
      title: "New contact message",
      detail: `From ${parsed.data.name} (${parsed.data.email})${parsed.data.subject ? ` — ${parsed.data.subject}` : ""}`,
      color: 0x10b981,
    });
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  function buildOwnerMailto() {
    const parsed = ownerSchema.safeParse(ownerForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return null;
    }
    const d = parsed.data;
    const subject = `[CarnageMC] ${d.reason}`;
    const body = `Reply-to: ${d.email}\n\n${d.message}`;
    return `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function openOwnerMail() {
    const href = buildOwnerMailto();
    if (!href) return;
    window.location.href = href;
    logWebsiteEvent({
      kind: "owner_contact",
      title: "Owner mailto opened",
      detail: `Reason: ${ownerForm.reason} — from ${ownerForm.email}`,
      color: 0xf59e0b,
    });
  }



  return (
    <main className="container mx-auto p-6 max-w-3xl space-y-6">
      <Helmet>
        <title>Contact</title>
        <meta name="description" content="Get in touch with our team via email, Discord, or our contact form." />
      </Helmet>
      <header>
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="text-muted-foreground mt-2">Reach us through any of the channels below or send a message.</p>
      </header>

      {methods.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {methods.map((m) => (
            <a key={m.id} href={methodHref(m)} target={m.type === "email" ? undefined : "_blank"} rel="noopener noreferrer">
              <Card className="hover:border-primary transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <MethodIcon type={m.type} />
                  <div className="min-w-0">
                    <div className="font-medium">{m.label}</div>
                    <div className="text-sm text-muted-foreground truncate">{m.value}</div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Send a message</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} /></div>
          </div>
          <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={200} /></div>
          <div><Label>Message *</Label><Textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={4000} /></div>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Sending..." : "Send message"}</Button>
        </CardContent>
      </Card>

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" /> Email the Owner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            For direct, private matters reach the owner at{" "}
            <span className="font-medium text-foreground">{OWNER_EMAIL}</span>. Fill in your details and a reason —
            your email client will open with everything prefilled.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Your email *</Label>
              <Input type="email" value={ownerForm.email} onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })} maxLength={255} placeholder="you@example.com" />
            </div>
            <div>
              <Label>Reason *</Label>
              <Input value={ownerForm.reason} onChange={(e) => setOwnerForm({ ...ownerForm, reason: e.target.value })} maxLength={200} placeholder="e.g. Partnership inquiry" />
            </div>
          </div>
          <div>
            <Label>Message *</Label>
            <Textarea rows={5} value={ownerForm.message} onChange={(e) => setOwnerForm({ ...ownerForm, message: e.target.value })} maxLength={4000} placeholder="Write your message to the owner..." />
          </div>
          <Button onClick={openOwnerMail} className="w-full">
            <Mail className="h-4 w-4 mr-2" /> Open email to owner
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
