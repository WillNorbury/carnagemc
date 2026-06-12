import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { z } from "zod";
import { logWebsiteEvent } from "@/lib/logEvent";
import { Helmet } from "react-helmet-async";

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
  const [form, setForm] = useState({
    minecraft_username: "",
    discord_tag: "",
    email: "",
    ban_reason: "",
    appeal_text: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [mine, setMine] = useState<Appeal[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("ban_appeals")
      .select("id, minecraft_username, status, admin_response, created_at, appeal_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMine((data as Appeal[]) ?? []));
  }, [user]);

  async function submit() {
    const parsed = appealSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const payload = {
      ...parsed.data,
      email: parsed.data.email || null,
      user_id: user?.id ?? null,
    };
    const { error } = await supabase.from("ban_appeals").insert([payload]);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Appeal submitted. We'll review it soon.");
    logWebsiteEvent({
      kind: "ban_appeal_new",
      title: "New ban appeal",
      detail: `${parsed.data.minecraft_username} submitted an appeal`,
      color: 0xf59e0b,
    });
    setForm({ minecraft_username: "", discord_tag: "", email: "", ban_reason: "", appeal_text: "" });
    if (user) {
      const { data } = await supabase
        .from("ban_appeals")
        .select("id, minecraft_username, status, admin_response, created_at, appeal_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMine((data as Appeal[]) ?? []);
    }
  }

  return (
    <main className="container mx-auto p-6 max-w-3xl space-y-6">
      <Helmet>
        <title>Ban Appeals</title>
        <meta name="description" content="Appeal a ban from the server. Submit your case for review." />
      </Helmet>
      <header>
        <h1 className="text-3xl font-bold">Ban Appeals</h1>
        <p className="text-muted-foreground mt-2">
          Banned and think it's a mistake? Submit an appeal below. Be honest and detailed.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Submit an Appeal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit appeal"}</Button>
        </CardContent>
      </Card>

      {user && mine.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Your appeals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {mine.map((a) => (
              <div key={a.id} className="border rounded-lg p-3 space-y-2">
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
          </CardContent>
        </Card>
      )}
    </main>
  );
}
