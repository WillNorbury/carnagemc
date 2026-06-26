import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { logWebsiteEvent } from "@/lib/logEvent";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Send } from "lucide-react";

type Method = {
  id: string;
  label: string;
  type: string;
  value: string;
  icon: string | null;
  sort_order: number;
  published: boolean;
};

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  reply_text: string | null;
  replied_at: string | null;
  created_at: string;
};

export function ContactAdminSection() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [adding, setAdding] = useState<Omit<Method, "id"> | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function load() {
    const [{ data: m }, { data: msgs }] = await Promise.all([
      supabase.from("contact_methods").select("*").order("sort_order"),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setMethods((m as Method[]) ?? []);
    setMessages((msgs as Message[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function saveNew() {
    if (!adding) return;
    if (!adding.label.trim() || !adding.value.trim()) return toast.error("Label and value required");
    const { error } = await supabase.from("contact_methods").insert([adding]);
    if (error) return toast.error(error.message);
    logWebsiteEvent({ kind: "contact_method_create", title: "Contact method added", detail: adding.label, color: 0x10b981 });
    setAdding(null);
    load();
  }
  async function updateMethod(m: Method, patch: Partial<Method>) {
    const { error } = await supabase.from("contact_methods").update(patch).eq("id", m.id);
    if (error) return toast.error(error.message);
    setMethods(methods.map((x) => x.id === m.id ? { ...x, ...patch } : x));
    logWebsiteEvent({ kind: "contact_method_update", title: "Contact method updated", detail: m.label });
  }
  async function removeMethod(m: Method) {
    if (!confirm(`Delete ${m.label}?`)) return;
    const { error } = await supabase.from("contact_methods").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    logWebsiteEvent({ kind: "contact_method_delete", title: "Contact method deleted", detail: m.label, color: 0xef4444 });
    load();
  }
  async function markHandled(msg: Message, handled: boolean) {
    const { error } = await supabase.from("contact_messages").update({ handled, handled_at: handled ? new Date().toISOString() : null }).eq("id", msg.id);
    if (error) return toast.error(error.message);
    setMessages(messages.map((x) => x.id === msg.id ? { ...x, handled } : x));
  }

  async function sendReply(msg: Message) {
    const reply = (replyDrafts[msg.id] ?? "").trim();
    if (!reply) return toast.error("Write a reply first");
    setSendingId(msg.id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const staffName = userData.user?.user_metadata?.display_name || userData.user?.user_metadata?.full_name || "CarnageMC Team";
      const { error: emailErr } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-reply",
          recipientEmail: msg.email,
          from: "CarnageMC Contact <contact@carnagemc.net>",
          idempotencyKey: `contact-reply-${msg.id}-${Date.now()}`,
          templateData: {
            recipientName: msg.name,
            originalSubject: msg.subject || "your message",
            originalMessage: msg.message,
            reply,
            staffName,
          },
        },
      });
      if (emailErr) throw emailErr;
      const { error: updErr } = await supabase
        .from("contact_messages")
        .update({ reply_text: reply, replied_at: new Date().toISOString(), handled: true, handled_at: new Date().toISOString() })
        .eq("id", msg.id);
      if (updErr) throw updErr;
      logWebsiteEvent({ kind: "contact_reply_sent", title: "Contact reply sent", detail: `${msg.email}: ${msg.subject || "(no subject)"}`, color: 0x10b981 });
      toast.success(`Reply emailed to ${msg.email} from contact@carnagemc.net`);
      setReplyDrafts((d) => ({ ...d, [msg.id]: "" }));
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to send reply");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contact methods</CardTitle>
          <Button size="sm" onClick={() => setAdding({ label: "", type: "email", value: "", icon: null, sort_order: methods.length, published: true })}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {adding && (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="grid sm:grid-cols-4 gap-2">
                <Input placeholder="Label" value={adding.label} onChange={(e) => setAdding({ ...adding, label: e.target.value })} />
                <Select value={adding.type} onValueChange={(v) => setAdding({ ...adding, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Value (email/url/...)" value={adding.value} onChange={(e) => setAdding({ ...adding, value: e.target.value })} className="sm:col-span-2" />
              </div>
              <div className="flex gap-2"><Button size="sm" onClick={saveNew}>Save</Button><Button size="sm" variant="outline" onClick={() => setAdding(null)}>Cancel</Button></div>
            </div>
          )}
          {methods.map((m) => (
            <div key={m.id} className="border rounded-lg p-3 grid sm:grid-cols-[1fr_120px_2fr_auto_auto] gap-2 items-center">
              <Input value={m.label} onChange={(e) => setMethods(methods.map((x) => x.id === m.id ? { ...x, label: e.target.value } : x))} onBlur={(e) => updateMethod(m, { label: e.target.value })} />
              <Select value={m.type} onValueChange={(v) => updateMethod(m, { type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
              <Input value={m.value} onChange={(e) => setMethods(methods.map((x) => x.id === m.id ? { ...x, value: e.target.value } : x))} onBlur={(e) => updateMethod(m, { value: e.target.value })} />
              <Switch checked={m.published} onCheckedChange={(v) => updateMethod(m, { published: v })} />
              <Button size="sm" variant="ghost" onClick={() => removeMethod(m)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {methods.length === 0 && !adding && <p className="text-muted-foreground">No contact methods yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Inbox</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {messages.length === 0 && <p className="text-muted-foreground">No messages.</p>}
          {messages.map((msg) => (
            <div key={msg.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-medium">{msg.subject || "(no subject)"}</div>
                  <div className="text-xs text-muted-foreground">{msg.name} &lt;{msg.email}&gt; · {new Date(msg.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  {msg.handled && <Badge variant="default">Handled</Badge>}
                  <label className="flex items-center gap-2 text-sm"><Switch checked={msg.handled} onCheckedChange={(v) => markHandled(msg, v)} /> Done</label>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded">{msg.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
