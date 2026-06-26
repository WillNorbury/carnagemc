import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Mail, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Variant = "approved" | "rejected" | "pending";

const DEFAULTS: Record<Variant, { subject: string; body: string }> = {
  approved: {
    subject: "Your CarnageMC {{applicationType}} application was approved",
    body: `Hi **{{mcUsername}}**,

Great news — your **{{applicationType}}** application has been **approved**! 🎉

{{reviewerNotes}}

Open your dashboard: {{dashboardUrl}}`,
  },
  rejected: {
    subject: "Update on your CarnageMC {{applicationType}} application",
    body: `Hi **{{mcUsername}}**,

Thanks for applying for **{{applicationType}}**. After review, we're unable to move forward with your application at this time.

{{reviewerNotes}}

You're welcome to reapply in the future.`,
  },
  pending: {
    subject: "Your CarnageMC {{applicationType}} application is being reviewed",
    body: `Hi **{{mcUsername}}**,

Your **{{applicationType}}** application is currently under review. We'll follow up as soon as a decision is made.

{{reviewerNotes}}`,
  },
};

interface Row {
  id?: string;
  template_name: string;
  variant: Variant;
  subject: string;
  body_markdown: string;
  enabled: boolean;
}

export const ApplicationStatusEmailEditor = () => {
  const [tab, setTab] = useState<Variant>("approved");
  const [rows, setRows] = useState<Record<Variant, Row>>({} as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_template_overrides")
      .select("*")
      .eq("template_name", "application-status");
    if (error) toast.error(error.message);
    const next: Record<Variant, Row> = {} as any;
    (["approved", "rejected", "pending"] as Variant[]).forEach((v) => {
      const found = (data ?? []).find((r: any) => r.variant === v);
      next[v] = found ?? {
        template_name: "application-status",
        variant: v,
        subject: DEFAULTS[v].subject,
        body_markdown: DEFAULTS[v].body,
        enabled: false,
      };
    });
    setRows(next);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateField = (v: Variant, patch: Partial<Row>) =>
    setRows((r) => ({ ...r, [v]: { ...r[v], ...patch } }));

  const save = async (v: Variant) => {
    setSaving(true);
    const row = rows[v];
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      template_name: "application-status",
      variant: v,
      subject: row.subject,
      body_markdown: row.body_markdown,
      enabled: row.enabled,
      updated_by: u?.user?.id ?? null,
    };
    const { error } = await supabase
      .from("email_template_overrides")
      .upsert(payload, { onConflict: "template_name,variant" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Saved ${v} template`);
    load();
  };

  const reset = (v: Variant) =>
    updateField(v, { subject: DEFAULTS[v].subject, body_markdown: DEFAULTS[v].body });

  if (loading) {
    return (
      <Card className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading email templates…
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4" />
        <div className="font-display font-bold">Application status emails</div>
      </div>
      <p className="text-xs text-muted-foreground">
        Edit the subject and body sent to applicants when their application is approved, rejected, or set back to
        pending. Toggle <strong>Use custom template</strong> off to fall back to the built-in design. Available
        variables: <code>{"{{mcUsername}}"}</code>, <code>{"{{applicationType}}"}</code>, <code>{"{{status}}"}</code>,{" "}
        <code>{"{{reviewerNotes}}"}</code>, <code>{"{{dashboardUrl}}"}</code>. Body supports Markdown.
      </p>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Variant)}>
        <TabsList>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
        {(["approved", "rejected", "pending"] as Variant[]).map((v) => {
          const row = rows[v];
          if (!row) return null;
          return (
            <TabsContent key={v} value={v} className="space-y-3 pt-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`enabled-${v}`}
                    checked={row.enabled}
                    onCheckedChange={(c) => updateField(v, { enabled: c })}
                  />
                  <Label htmlFor={`enabled-${v}`} className="text-sm">Use custom template</Label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => reset(v)}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset to default
                  </Button>
                  <Button size="sm" onClick={() => save(v)} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Save
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Subject</Label>
                <Input
                  value={row.subject}
                  onChange={(e) => updateField(v, { subject: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Body (Markdown)</Label>
                <Textarea
                  value={row.body_markdown}
                  onChange={(e) => updateField(v, { body_markdown: e.target.value })}
                  className="font-mono text-xs min-h-[260px]"
                />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </Card>
  );
};
