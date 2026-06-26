import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AtSign, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";

export type AllowedFromRow = {
  id: string;
  email: string;
  display_name: string | null;
  active: boolean;
  created_at: string;
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AllowedFromAddressesAdminSection = ({
  onChanged,
}: {
  onChanged?: () => void;
}) => {
  const [rows, setRows] = useState<AllowedFromRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("allowed_from_addresses" as any)
      .select("id,email,display_name,active,created_at")
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) toast.error(error.message);
    else setRows((data as any) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const e = email.trim().toLowerCase();
    if (!emailRe.test(e)) return toast.error("Enter a valid email");
    setSaving(true);
    const { error } = await (supabase.from("allowed_from_addresses" as any) as any).insert({
      email: e,
      display_name: displayName.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setEmail("");
    setDisplayName("");
    toast.success("Sender added");
    load();
    onChanged?.();
  };

  const toggleActive = async (row: AllowedFromRow) => {
    const { error } = await (supabase.from("allowed_from_addresses" as any) as any)
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    load();
    onChanged?.();
  };

  const remove = async (row: AllowedFromRow) => {
    if (!(await confirm({ title: `Remove ${row.email}?`, destructive: true }))) return;
    const { error } = await (supabase.from("allowed_from_addresses" as any) as any)
      .delete()
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
    onChanged?.();
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AtSign className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Allowed Sender Addresses</h2>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Manage which From addresses can be used to send broadcasts. The provider must already have the
        sending domain verified — adding an address here doesn't verify DNS for that domain.
      </p>

      <div className="grid gap-3 md:grid-cols-[1fr,1fr,auto] items-end">
        <div className="space-y-1">
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="name@notify.carnagemc.net"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Display name (optional)</Label>
          <Input
            placeholder="CarnageMC Updates"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <Button onClick={add} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Add
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No sender addresses yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Display name</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-mono">{r.email}</td>
                  <td className="py-2 pr-3">{r.display_name ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={r.active} onCheckedChange={() => toggleActive(r)} />
                      <Badge variant={r.active ? "default" : "outline"}>{r.active ? "Active" : "Disabled"}</Badge>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

// Build the canonical RFC 5322 "Display <email>" string used as the From header.
export const formatFromAddress = (email: string, displayName: string | null): string => {
  const e = email.trim();
  const dn = (displayName ?? "").trim();
  if (!dn) return e;
  // Quote display name if it contains special chars
  const needsQuote = /[",@<>()\\[\]:;]/.test(dn);
  const safeDn = needsQuote ? `"${dn.replace(/"/g, '\\"')}"` : dn;
  return `${safeDn} <${e}>`;
};

export default AllowedFromAddressesAdminSection;
