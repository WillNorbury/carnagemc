import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";

type Entry = {
  id: string;
  user_id: string | null;
  username: string;
  email: string | null;
  action: string;
  reason: string | null;
  notes: string | null;
  actor_id: string | null;
  actor_name: string | null;
  occurred_at: string;
};

const ACTIONS = ["deleted", "banned", "suspended", "restored"] as const;

const actionStyle = (a: string) =>
  a === "deleted"
    ? "bg-destructive/15 text-destructive border-destructive/30"
    : a === "banned"
      ? "bg-primary/15 text-primary border-primary/30"
      : a === "suspended"
        ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
        : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";

export const AccountRemovalsAdminSection = () => {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [action, setAction] = useState<string>("all");
  const [moderator, setModerator] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // new entry
  const [form, setForm] = useState({
    username: "",
    email: "",
    action: "deleted",
    reason: "",
    notes: "",
    actor_name: "",
    occurred_at: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("account_removal_log")
      .select("*")
      .order("occurred_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Entry[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const moderators = useMemo(
    () => Array.from(new Set(rows.map((r) => r.actor_name).filter(Boolean) as string[])).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (action !== "all" && r.action !== action) return false;
      if (moderator !== "all" && (r.actor_name ?? "") !== moderator) return false;
      if (from && new Date(r.occurred_at) < new Date(from)) return false;
      if (to && new Date(r.occurred_at) > new Date(`${to}T23:59:59`)) return false;
      if (!needle) return true;
      return [r.username, r.email, r.reason, r.notes, r.actor_name]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(needle));
    });
  }, [rows, q, action, moderator, from, to]);

  const add = async () => {
    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }
    setAdding(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("account_removal_log").insert({
      username: form.username.trim(),
      email: form.email.trim() || null,
      action: form.action,
      reason: form.reason.trim() || null,
      notes: form.notes.trim() || null,
      actor_id: auth?.user?.id ?? null,
      actor_name: form.actor_name.trim() || auth?.user?.email || null,
      occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : new Date().toISOString(),
    });
    setAdding(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Entry logged");
    setForm({ username: "", email: "", action: "deleted", reason: "", notes: "", actor_name: "", occurred_at: "" });
    load();
  };

  const remove = async (row: Entry) => {
    const ok = await confirm({
      title: "Delete log entry?",
      description: `Remove the ${row.action} record for "${row.username}"?`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("account_removal_log").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      setRows((r) => r.filter((x) => x.id !== row.id));
      toast.success("Deleted");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Log an account removal</h3>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Username</Label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Player / account name" />
          </div>
          <div className="space-y-1">
            <Label>Email (optional)</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
          </div>
          <div className="space-y-1">
            <Label>Date</Label>
            <Input type="datetime-local" value={form.occurred_at} onChange={(e) => setForm({ ...form, occurred_at: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Action</Label>
            <div className="flex flex-wrap gap-1">
              {ACTIONS.map((a) => (
                <Button
                  key={a}
                  type="button"
                  size="sm"
                  variant={form.action === a ? "default" : "outline"}
                  onClick={() => setForm({ ...form, action: a })}
                  className="capitalize"
                >
                  {a}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Reason</Label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Cheating, requested deletion…" />
          </div>
          <div className="space-y-1">
            <Label>Moderator (defaults to you)</Label>
            <Input value={form.actor_name} onChange={(e) => setForm({ ...form, actor_name: e.target.value })} placeholder="Staff name" />
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <Button onClick={add} disabled={adding}>
          {adding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Add entry
        </Button>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1 md:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Username, reason, notes…" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant={action === "all" ? "default" : "outline"} onClick={() => setAction("all")}>All actions</Button>
            {ACTIONS.map((a) => (
              <Button key={a} size="sm" variant={action === a ? "default" : "outline"} className="capitalize" onClick={() => setAction(a)}>
                {a}
              </Button>
            ))}
          </div>
          {moderators.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant={moderator === "all" ? "default" : "outline"} onClick={() => setModerator("all")}>All moderators</Button>
              {moderators.map((m) => (
                <Button key={m} size="sm" variant={moderator === m ? "default" : "outline"} onClick={() => setModerator(m)}>
                  {m}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {filtered.length} of {rows.length} entries
        </div>

        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No entries match these filters.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border/60 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{r.username}</span>
                    <Badge variant="outline" className={`capitalize ${actionStyle(r.action)}`}>{r.action}</Badge>
                    {r.email && <span className="text-xs text-muted-foreground">{r.email}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>{new Date(r.occurred_at).toLocaleString()}</span>
                    <span>By: {r.actor_name ?? "System"}</span>
                    {r.reason && <span>Reason: {r.reason}</span>}
                  </div>
                  {r.notes && <div className="text-xs mt-1 break-words">{r.notes}</div>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AccountRemovalsAdminSection;
