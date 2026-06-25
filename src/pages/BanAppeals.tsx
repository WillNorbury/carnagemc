import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";
import { logWebsiteEvent } from "@/lib/logEvent";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Plus } from "lucide-react";

const appealSchema = z.object({
  minecraft_username: z.string().trim().min(1).max(64),
  discord_tag: z.string().trim().max(64).optional(),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  ban_reason: z.string().trim().max(500).optional(),
  appeal_text: z.string().trim().min(20, "Please write at least 20 characters").max(4000),
});

type Appeal = {
  id: string;
  minecraft_username: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  appeal_text: string;
};

export default function BanAppeals() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    minecraft_username: "",
    discord_tag: "",
    email: "",
    ban_reason: "",
    appeal_text: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [mine, setMine] = useState<Appeal[]>([]);

  async function refresh() {
    if (!user) return;
    const { data } = await supabase
      .from("ban_appeals")
      .select("id, minecraft_username, status, admin_response, created_at, appeal_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMine((data as Appeal[]) ?? []);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user?.email && !form.email) setForm((f) => ({ ...f, email: user.email ?? "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function submit() {
    const parsed = appealSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const d = parsed.data;
    const { error } = await supabase.from("ban_appeals").insert([{
      minecraft_username: d.minecraft_username,
      appeal_text: d.appeal_text,
      discord_tag: d.discord_tag || null,
      ban_reason: d.ban_reason || null,
      email: d.email || null,
      user_id: user?.id ?? null,
    }]);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Appeal submitted. We'll review it soon.");
    logWebsiteEvent({
      kind: "ban_appeal_new",
      title: "New ban appeal",
      detail: `${d.minecraft_username} submitted an appeal`,
      color: 0xf59e0b,
    });
    // Notify admins via email
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "ban-appeal-admin",
        templateData: {
          minecraftUsername: d.minecraft_username,
          discordTag: d.discord_tag,
          email: d.email,
          banReason: d.ban_reason,
          appealText: d.appeal_text,
        },
      },
    }).catch(() => {});
    // Confirmation email to the appellant (if provided)
    if (d.email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "ban-appeal-received",
          recipientEmail: d.email,
          templateData: {
            minecraftUsername: d.minecraft_username,
            appealText: d.appeal_text,
          },
        },
      }).catch(() => {});
    }
    setForm({ minecraft_username: "", discord_tag: "", email: "", ban_reason: "", appeal_text: "" });
    setOpen(false);
    refresh();
  }

  return (
    <main className="container mx-auto p-6 max-w-4xl space-y-10">
      <Helmet>
        <title>Punishment Appeals</title>
        <meta name="description" content="Appeal active bans, mutes, or blacklists on your account and track staff decisions." />
      </Helmet>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Punishment Appeals</h1>
          <p className="text-muted-foreground mt-2">
            Appeal active bans, mutes, or blacklists on your account and track staff decisions.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Appeal
        </Button>
      </header>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Active punishments</h2>
          <p className="text-sm text-muted-foreground">Only active bans, mutes, and blacklists can be appealed.</p>
        </div>
        <div className="rounded-xl border bg-card/40 py-14 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-full border-2 border-emerald-500/60 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="font-semibold">No active appealable punishments</div>
          <div className="text-sm text-muted-foreground">There is nothing appealable on this account.</div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Your appeals</h2>
          <p className="text-sm text-muted-foreground">Recent appeal submissions and staff responses.</p>
        </div>
        {mine.length === 0 ? (
          <div className="rounded-xl border bg-card/40 py-14 text-center text-muted-foreground">
            No appeals submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {mine.map((a) => (
              <div key={a.id} className="border rounded-xl p-4 space-y-2 bg-card/40">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{a.minecraft_username}</span>
                  <Badge variant={a.status === "approved" ? "default" : a.status === "denied" ? "destructive" : "secondary"}>{a.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                <p className="text-sm whitespace-pre-wrap">{a.appeal_text}</p>
                {a.admin_response && (
                  <div className="text-sm border-l-2 border-primary pl-3">
                    <div className="text-xs text-muted-foreground mb-1">Staff response</div>
                    {a.admin_response}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Appeal</DialogTitle>
            <DialogDescription>Be honest and detailed. Staff will review and respond.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Minecraft username *</Label>
                <Input value={form.minecraft_username} onChange={(e) => setForm({ ...form, minecraft_username: e.target.value })} maxLength={64} />
              </div>
              <div>
                <Label>Discord tag</Label>
                <Input value={form.discord_tag} onChange={(e) => setForm({ ...form, discord_tag: e.target.value })} maxLength={64} />
              </div>
              <div>
                <Label>Email (optional)</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
              </div>
              <div>
                <Label>Ban reason (if known)</Label>
                <Input value={form.ban_reason} onChange={(e) => setForm({ ...form, ban_reason: e.target.value })} maxLength={500} />
              </div>
            </div>
            <div>
              <Label>Your appeal *</Label>
              <Textarea rows={8} value={form.appeal_text} onChange={(e) => setForm({ ...form, appeal_text: e.target.value })} maxLength={4000} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit appeal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
