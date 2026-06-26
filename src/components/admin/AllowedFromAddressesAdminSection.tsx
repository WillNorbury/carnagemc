import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AtSign, Check, Loader2, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

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

  const validate = (e: string, dn: string): { emailErr: string | null; dnErr: string | null } => {
    let emailErr: string | null = null;
    let dnErr: string | null = null;
    const v = e.trim().toLowerCase();
    if (!v) emailErr = "Email is required";
    else if (v.length > 254) emailErr = "Email is too long (max 254 chars)";
    else if (!emailRe.test(v)) emailErr = "Enter a valid email address";
    else if (rows.some((r) => r.email.toLowerCase() === v))
      emailErr = "This email is already in the whitelist";
    if (dn.trim().length > 120) dnErr = "Display name is too long (max 120 chars)";
    return { emailErr, dnErr };
  };

  const add = async () => {
    const { emailErr, dnErr } = validate(email, displayName);
    setEmailError(emailErr);
    setDisplayNameError(dnErr);
    if (emailErr || dnErr) return;
    const e = email.trim().toLowerCase();
    setSaving(true);
    const { error } = await (supabase.from("allowed_from_addresses" as any) as any).insert({
      email: e,
      display_name: displayName.trim() || null,
    });
    setSaving(false);
    if (error) {
      const msg = error.message || "Failed to add";
      if (/duplicate|unique/i.test(msg)) setEmailError("This email is already in the whitelist");
      else if (/email_format/i.test(msg)) setEmailError("Email format rejected by server");
      else if (/display_name_len/i.test(msg)) setDisplayNameError("Display name too long");
      else toast.error(msg);
      return;
    }
    setEmail("");
    setDisplayName("");
    setEmailError(null);
    setDisplayNameError(null);
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
            aria-invalid={!!emailError}
            className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            onBlur={() => {
              const { emailErr } = validate(email, displayName);
              setEmailError(emailErr);
            }}
          />
          {emailError && <p className="text-xs text-destructive">{emailError}</p>}
        </div>
        <div className="space-y-1">
          <Label>Display name (optional)</Label>
          <Input
            placeholder="CarnageMC Updates"
            value={displayName}
            aria-invalid={!!displayNameError}
            className={displayNameError ? "border-destructive focus-visible:ring-destructive" : ""}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (displayNameError) setDisplayNameError(null);
            }}
          />
          {displayNameError && <p className="text-xs text-destructive">{displayNameError}</p>}
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
