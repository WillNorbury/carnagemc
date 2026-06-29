import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, ShieldOff } from "lucide-react";

type PunType = "bans" | "mutes" | "kicks" | "warnings";

type Item = {
  id: number;
  uuid: string;
  username: string | null;
  reason: string | null;
  issued_by: string | null;
  issued_at: string | null;
  expires_at: string | null;
  permanent: boolean;
  active: boolean;
  removed_by: string | null;
  removed_at: string | null;
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

export const PunishmentsAdminSection = () => {
  const [type, setType] = useState<PunType>("bans");
  const [player, setPlayer] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [silent, setSilent] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("punishments-lookup", {
        body: {
          action: "list",
          type,
          player: player.trim() || undefined,
          from: from ? new Date(from).toISOString() : undefined,
          to: to ? new Date(to).toISOString() : undefined,
          active_only: activeOnly,
          limit: 200,
        },
      });
      if (error) throw error;
      setItems((data as any)?.items ?? []);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [type]);

  const unban = async (item: Item) => {
    if (type !== "bans" && type !== "mutes") return;
    const action = type === "bans" ? "unban" : "unmute";
    if (!confirm(`${action} ${item.username ?? item.uuid}${silent ? " (silent -s)" : ""}?`)) return;
    setActingId(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("punishments-lookup", {
        body: { action, id: item.id, silent },
      });
      if (error) throw error;
      toast({ title: `${action} succeeded`, description: `Punishment #${item.id} removed${silent ? " silently" : ""}.` });
      await load();
    } catch (e: any) {
      toast({ title: `${action} failed`, description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as PunType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bans">Bans</SelectItem>
              <SelectItem value="mutes">Mutes</SelectItem>
              <SelectItem value="kicks">Kicks</SelectItem>
              <SelectItem value="warnings">Warnings</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Player (name or UUID)</Label>
          <Input value={player} onChange={(e) => setPlayer(e.target.value)} placeholder="Notch" />
        </div>
        <div className="space-y-1">
          <Label>From</Label>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>To</Label>
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={load} disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Search
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        {(type === "bans" || type === "mutes") && (
          <label className="flex items-center gap-2">
            <Switch checked={activeOnly} onCheckedChange={setActiveOnly} />
            Active only
          </label>
        )}
        <label className="flex items-center gap-2">
          <Switch checked={silent} onCheckedChange={setSilent} />
          Silent (<code>-s</code>) when removing
        </label>
        <span className="text-muted-foreground">{items.length} result{items.length === 1 ? "" : "s"}</span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Issued by</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !loading && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No punishments match the filters.</TableCell></TableRow>
            )}
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-mono text-xs">
                  <div className="font-sans text-sm">{it.username ?? "—"}</div>
                  <div className="text-muted-foreground">{it.uuid}</div>
                </TableCell>
                <TableCell className="max-w-[260px] truncate" title={it.reason ?? ""}>{it.reason ?? "—"}</TableCell>
                <TableCell>{it.issued_by ?? "—"}</TableCell>
                <TableCell className="text-xs">{fmt(it.issued_at)}</TableCell>
                <TableCell className="text-xs">{it.permanent ? <Badge variant="destructive">Permanent</Badge> : fmt(it.expires_at)}</TableCell>
                <TableCell>
                  {it.active ? <Badge>Active</Badge> : <Badge variant="secondary">Removed</Badge>}
                  {!it.active && it.removed_by && (
                    <div className="text-xs text-muted-foreground mt-1">by {it.removed_by}</div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {(type === "bans" || type === "mutes") && it.active && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => unban(it)}
                      disabled={actingId === it.id}
                    >
                      {actingId === it.id ? <Loader2 className="animate-spin" /> : <ShieldOff />}
                      {type === "bans" ? "Unban" : "Unmute"}{silent ? " -s" : ""}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
