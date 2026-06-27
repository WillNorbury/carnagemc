import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Flag, Loader2, Trash2, ExternalLink, RefreshCw, CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ReportStatus = "open" | "in_review" | "resolved" | "rejected";

type Report = {
  id: string;
  reporter_id: string | null;
  target_type: string;
  target_id: string | null;
  target_label: string | null;
  target_url: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
};

const STATUS_OPTIONS: ReportStatus[] = ["open", "in_review", "resolved", "rejected"];

const statusVariant = (s: ReportStatus) => {
  switch (s) {
    case "open":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "in_review":
      return "bg-sky-500/20 text-sky-400 border-sky-500/40";
    case "resolved":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    case "rejected":
      return "bg-muted text-muted-foreground border-border";
  }
};

export const ReportsAdminSection = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [reporters, setReporters] = useState<Record<string, { display_name: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportStatus | "all">("open");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [editing, setEditing] = useState<Report | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Report[];
    setReports(rows);
    const ids = Array.from(new Set(rows.map((r) => r.reporter_id).filter(Boolean))) as string[];
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      const map: Record<string, { display_name: string | null }> = {};
      (profiles ?? []).forEach((p: any) => {
        map[p.id] = { display_name: p.display_name };
      });
      setReporters(map);
    } else {
      setReporters({});
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const from = dateRange?.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null;
    const toRaw = dateRange?.to ?? dateRange?.from;
    const to = toRaw ? new Date(toRaw).setHours(23, 59, 59, 999) : null;
    return reports.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (from || to) {
        const t = new Date(r.created_at).getTime();
        if (from && t < from) return false;
        if (to && t > to) return false;
      }
      return true;
    });
  }, [reports, filter, dateRange]);

  const counts = useMemo(() => {
    const from = dateRange?.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null;
    const toRaw = dateRange?.to ?? dateRange?.from;
    const to = toRaw ? new Date(toRaw).setHours(23, 59, 59, 999) : null;
    const inRange = reports.filter((r) => {
      if (!from && !to) return true;
      const t = new Date(r.created_at).getTime();
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    });
    const c: Record<string, number> = { all: inRange.length };
    STATUS_OPTIONS.forEach((s) => (c[s] = 0));
    inRange.forEach((r) => {
      c[r.status] = (c[r.status] ?? 0) + 1;
    });
    return c;
  }, [reports, dateRange]);

  const updateStatus = async (r: Report, status: ReportStatus) => {
    const patch: Partial<Report> = { status };
    if (status === "resolved" || status === "rejected") {
      patch.resolved_at = new Date().toISOString() as any;
      const { data: u } = await supabase.auth.getUser();
      patch.resolved_by = u.user?.id ?? null;
    } else {
      patch.resolved_at = null;
      patch.resolved_by = null;
    }
    const { error } = await supabase.from("user_reports").update(patch).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status.replace("_", " ")}`);
    load();
  };

  const saveNotes = async () => {
    if (!editing) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("user_reports")
      .update({ admin_notes: notesDraft })
      .eq("id", editing.id);
    setSavingNotes(false);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
    setEditing(null);
    load();
  };

  const remove = async (r: Report) => {
    const ok = await confirm({
      title: "Delete report?",
      description: "This permanently removes the report.",
      confirmText: "Delete",
    });
    if (!ok) return;
    const { error } = await supabase.from("user_reports").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Report deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(["open", "in_review", "resolved", "rejected", "all"] as const).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={filter === k ? "default" : "outline"}
              onClick={() => setFilter(k)}
            >
              {k === "all" ? "All" : k.replace("_", " ")}
              <span className="ml-2 text-xs opacity-80">{counts[k] ?? 0}</span>
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading reports…
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Flag className="h-8 w-8 mx-auto mb-2 opacity-70" />
          <p className="font-medium text-foreground">No reports {filter !== "all" ? `with status “${filter.replace("_", " ")}”` : "yet"}.</p>
          <p className="text-sm">When users report content, it'll show up here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const reporter = r.reporter_id ? reporters[r.reporter_id] : null;
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={statusVariant(r.status)}>
                        {r.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline">{r.target_type}</Badge>
                      {r.target_label && (
                        <span className="text-sm font-medium truncate">{r.target_label}</span>
                      )}
                      {r.target_url && (
                        <a
                          href={r.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          open <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Reason: </span>
                      <span className="text-muted-foreground">{r.reason}</span>
                    </div>
                    {r.details && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {r.details}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Reported by{" "}
                      <span className="text-foreground">
                        {reporter?.display_name ?? (r.reporter_id ? r.reporter_id.slice(0, 8) : "anonymous")}
                      </span>{" "}
                      · {new Date(r.created_at).toLocaleString()}
                    </div>
                    {r.admin_notes && (
                      <div className="text-xs rounded-md border bg-secondary/30 p-2 mt-2">
                        <span className="font-medium text-foreground">Notes: </span>
                        <span className="text-muted-foreground whitespace-pre-wrap">{r.admin_notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={r.status} onValueChange={(v) => updateStatus(r, v as ReportStatus)}>
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(r);
                        setNotesDraft(r.admin_notes ?? "");
                      }}
                    >
                      Notes
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin notes</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={6}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Internal notes about this report (visible only to admins)…"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveNotes} disabled={savingNotes}>
              {savingNotes && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsAdminSection;
