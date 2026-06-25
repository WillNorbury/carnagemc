import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { logWebsiteEvent } from "@/lib/logEvent";
import { useAuth } from "@/lib/auth";

type Appeal = {
  id: string;
  user_id: string | null;
  minecraft_username: string;
  discord_tag: string | null;
  email: string | null;
  ban_reason: string | null;
  appeal_text: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  account_email?: string | null;
};

export function BanAppealsAdminSection() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appeal[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [testEmail, setTestEmail] = useState<string>("");
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email && !testEmail) setTestEmail(user.email);
  }, [user, testEmail]);

  async function sendTest(kind: "received" | "status" | "admin") {
    const recipient = testEmail.trim();
    if (!recipient) return toast.error("Enter a recipient email");
    setTesting(kind);
    const stamp = Date.now();
    const common = {
      minecraftUsername: "TestPlayer",
      discordTag: "tester#0001",
      banReason: "Test ban reason",
      appealText: "This is a test appeal body to verify the email template renders correctly.",
      appealUrl: `${window.location.origin}/appeal`,
    };
    let templateName: string;
    let templateData: Record<string, unknown>;
    if (kind === "received") {
      templateName = "ban-appeal-received";
      templateData = common;
    } else if (kind === "status") {
      templateName = "ban-appeal-status";
      templateData = {
        ...common,
        status: "approved",
        adminResponse: "Thanks for your patience — this is a test status update.",
      };
    } else {
      templateName = "ban-appeal-admin";
      templateData = {
        ...common,
        email: recipient,
        adminUrl: `${window.location.origin}/admin?tab=ban-appeals`,
      };
    }
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName,
        recipientEmail: recipient,
        idempotencyKey: `test-${templateName}-${stamp}`,
        templateData,
      },
    });
    setTesting(null);
    if (error) return toast.error(error.message ?? "Failed to send test email");
    toast.success(`Test "${templateName}" queued to ${recipient}`);
  }


  async function load() {
    setLoading(true);
    let q = supabase.from("ban_appeals").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    const rows = (data as Appeal[]) ?? [];
    // Fetch account emails for appeals that didn't include one but have a linked user
    const missing = Array.from(new Set(rows.filter(r => !r.email && r.user_id).map(r => r.user_id as string)));
    const emailMap: Record<string, string | null> = {};
    await Promise.all(missing.map(async (uid) => {
      const { data: em } = await supabase.rpc("admin_get_user_email", { _user_id: uid });
      emailMap[uid] = (em as string | null) ?? null;
    }));
    setItems(rows.map(r => ({ ...r, account_email: r.user_id ? emailMap[r.user_id] ?? null : null })));
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function update(a: Appeal, status: string) {
    const admin_response = drafts[a.id] ?? a.admin_response ?? null;
    const { error } = await supabase
      .from("ban_appeals")
      .update({ status, admin_response, reviewed_at: new Date().toISOString() })
      .eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success(`Appeal ${status}`);
    logWebsiteEvent({
      kind: `ban_appeal_${status}`,
      title: `Ban appeal ${status}`,
      detail: `${a.minecraft_username}: ${admin_response ?? "(no response)"}`,
      color: status === "approved" ? 0x10b981 : status === "denied" ? 0xef4444 : 0x6b7280,
    });
    const notifyEmail = a.email || a.account_email;
    if (notifyEmail) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "ban-appeal-status",
          recipientEmail: notifyEmail,
          idempotencyKey: `ban-appeal-${a.id}-${status}`,
          templateData: {
            minecraftUsername: a.minecraft_username,
            status,
            adminResponse: admin_response,
            appealUrl: `${window.location.origin}/appeal`,
          },
        },
      }).catch(() => {});
    }
    load();
  }

  return (
    <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Test appeal email hooks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Sends a sample of each ban-appeal email template to the address below. Uses the live email queue — check your inbox (and spam) to confirm delivery.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" disabled={!!testing} onClick={() => sendTest("received")}>
              {testing === "received" ? <Loader2 className="h-3 w-3 animate-spin" /> : "New appeal"}
            </Button>
            <Button size="sm" variant="outline" disabled={!!testing} onClick={() => sendTest("status")}>
              {testing === "status" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Status change"}
            </Button>
            <Button size="sm" variant="outline" disabled={!!testing} onClick={() => sendTest("admin")}>
              {testing === "admin" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Admin alert"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ban Appeals</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-muted-foreground">Loading...</p>}
        {!loading && items.length === 0 && <p className="text-muted-foreground">No appeals.</p>}
        {items.map((a) => (
          <div key={a.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="font-medium">{a.minecraft_username}</div>
                <div className="text-xs text-muted-foreground">
                  {a.discord_tag && <>Discord: {a.discord_tag} · </>}
                  {a.email && <>Email: {a.email} · </>}
                  {!a.email && a.account_email && <>Account email: {a.account_email} · </>}
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
              <Badge variant={a.status === "approved" ? "default" : a.status === "denied" ? "destructive" : "secondary"}>{a.status}</Badge>
            </div>
            {a.ban_reason && <p className="text-sm"><span className="text-muted-foreground">Reason:</span> {a.ban_reason}</p>}
            <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded">{a.appeal_text}</p>
            <Textarea
              placeholder="Response to user..."
              value={drafts[a.id] ?? a.admin_response ?? ""}
              onChange={(e) => setDrafts({ ...drafts, [a.id]: e.target.value })}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => update(a, "approved")}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => update(a, "denied")}>Deny</Button>
              <Button size="sm" variant="outline" onClick={() => update(a, "pending")}>Mark pending</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
    </div>
  );
}
