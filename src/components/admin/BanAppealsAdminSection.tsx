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
};

export function BanAppealsAdminSection() {
  const [items, setItems] = useState<Appeal[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  async function load() {
    setLoading(true);
    let q = supabase.from("ban_appeals").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setItems((data as Appeal[]) ?? []);
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
    if (a.email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "ban-appeal-status",
          recipientEmail: a.email,
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
  );
}
