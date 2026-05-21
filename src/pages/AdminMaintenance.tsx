import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Wrench } from "lucide-react";

type Config = { enabled: boolean; title: string; message: string };

const DEFAULT: Config = {
  enabled: false,
  title: "We'll be right back",
  message: "XyloMC is undergoing scheduled maintenance. Check back soon!",
};

const AdminMaintenance = () => {
  const { user, isAdmin, loading } = useAuth();
  const [cfg, setCfg] = useState<Config>(DEFAULT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Maintenance — Admin · XyloMC";
    supabase
      .from("site_content")
      .select("value")
      .eq("key", "maintenance")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setCfg({ ...DEFAULT, ...(data.value as any) });
      });
  }, []);

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "maintenance", value: cfg as any });
    if (error) toast.error(error.message);
    else toast.success(cfg.enabled ? "Maintenance mode ON" : "Maintenance mode OFF");
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Back to admin</Link>
          </Button>
          <h1 className="text-3xl font-bold">Maintenance Mode</h1>
          <p className="text-muted-foreground">Take the site offline for everyone except admins.</p>
        </div>

        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
            <Wrench className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Enable maintenance mode</div>
              <div className="text-xs text-muted-foreground">
                Visitors see a branded maintenance page. Admins still have full access.
              </div>
            </div>
            <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
          </div>

          <div>
            <Label>Title</Label>
            <Input value={cfg.title} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              value={cfg.message}
              onChange={(e) => setCfg({ ...cfg, message: e.target.value })}
              rows={4}
            />
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default AdminMaintenance;
