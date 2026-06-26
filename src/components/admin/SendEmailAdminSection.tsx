import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Send, ShieldAlert, History, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type AuditRow = {
  id: string;
  sender_email: string | null;
  category: string;
  from_address: string | null;
  subject: string;
  total_recipients: number;
  queued_count: number;
  failed_count: number;
  test_email: string | null;
  created_at: string;
};

type Category = "all" | "admins" | "owners" | "test";

const FROM_OPTIONS = [
  { label: "noreply@carnagemc.net", value: "CarnageMC <noreply@carnagemc.net>" },
  { label: "updates@carnagemc.net", value: "CarnageMC Updates <updates@carnagemc.net>" },
  { label: "william@carnagemc.net", value: "William @ CarnageMC <william@carnagemc.net>" },
];

export const SendEmailAdminSection = ({ isOwner }: { isOwner: boolean }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [from, setFrom] = useState(FROM_OPTIONS[2].value);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    const { data, error } = await supabase
      .from("admin_broadcast_logs")
      .select("id,sender_email,category,from_address,subject,total_recipients,queued_count,failed_count,test_email,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setLoadingLogs(false);
    if (!error && data) setLogs(data as AuditRow[]);
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const send = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    if (category === "test" && !testEmail.trim()) {
      toast.error("Enter a test recipient email");
      return;
    }
    if (ownerOnlyCat && !isOwner) {
      toast.error("Only owners can send to this category");
      return;
    }

    setSending(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("admin-send-broadcast", {
      body: {
        subject: subject.trim(),
        message: message.trim(),
        category,
        from,
        testEmail: category === "test" ? testEmail.trim() : undefined,
      },
    });
    setSending(false);

    if (error || !data?.ok) {
      const msg = (data as any)?.error || error?.message || "Failed to send";
      setResult({ ok: false, msg });
      toast.error(msg);
      return;
    }
    const ok = `Queued ${data.queued}/${data.total} (${data.category})`;
    setResult({ ok: true, msg: ok });
    toast.success(ok);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Send Email</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Broadcast a one-off email to a group of users. Sends through the existing transactional email pipeline (suppression list respected).
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="admins" disabled={!isOwner}>
                  Admins {!isOwner && "(Owner only)"}
                </SelectItem>
                <SelectItem value="owners" disabled={!isOwner}>
                  Owner Only {!isOwner && "(Owner only)"}
                </SelectItem>
                <SelectItem value="test">Test (single email)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FROM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {category === "test" && (
          <div className="space-y-2">
            <Label>Test recipient email</Label>
            <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        )}

        <div className="space-y-2">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Email subject" />
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            maxLength={10000}
            placeholder="Write your message here. Line breaks are preserved."
          />
          <p className="text-xs text-muted-foreground">{message.length}/10000 characters</p>
        </div>

        {ownerOnlyCat && !isOwner && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Owner only</AlertTitle>
            <AlertDescription>This category can only be sent by the project owner.</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert variant={result.ok ? "default" : "destructive"}>
            <AlertTitle>{result.ok ? "Sent" : "Error"}</AlertTitle>
            <AlertDescription>{result.msg}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button onClick={send} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send Email
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SendEmailAdminSection;
