import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";

type Delivery = {
  id: string;
  recipient_email: string;
  status: string;
  error: string | null;
  message_id: string | null;
  is_test: boolean;
  created_at: string;
};

type LatestLog = {
  message_id: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  newsId: string | null;
  newsTitle?: string;
}

const statusVariant = (s: string) => {
  switch (s) {
    case "sent":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "queued":
      return "bg-primary/15 text-primary border-primary/30";
    case "failed":
    case "dlq":
    case "bounced":
    case "complained":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "suppressed":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const NewsDeliveryLogDialog = ({ open, onOpenChange, newsId, newsTitle }: Props) => {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [latest, setLatest] = useState<Record<string, LatestLog>>({});
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open || !newsId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: deliveries } = await (supabase
        .from("news_email_deliveries") as any)
        .select("id,recipient_email,status,error,message_id,is_test,created_at")
        .eq("news_id", newsId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const list = (deliveries ?? []) as Delivery[];
      setRows(list);

      const ids = [...new Set(list.map((r) => r.message_id).filter(Boolean) as string[])];
      const latestMap: Record<string, LatestLog> = {};
      if (ids.length > 0) {
        const { data: logs } = await (supabase
          .from("email_send_log") as any)
          .select("message_id,status,error_message,created_at")
          .in("message_id", ids)
          .order("created_at", { ascending: false });
        for (const l of (logs ?? []) as LatestLog[]) {
          if (!latestMap[l.message_id]) latestMap[l.message_id] = l;
        }
      }
      if (!cancelled) {
        setLatest(latestMap);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, newsId]);

  const filtered = rows.filter((r) =>
    !query.trim() ? true : r.recipient_email.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const counts = filtered.reduce(
    (acc, r) => {
      const s = latest[r.message_id ?? ""]?.status ?? r.status;
      acc.total += 1;
      if (s === "sent") acc.sent += 1;
      else if (s === "failed" || s === "dlq" || s === "bounced" || s === "complained")
        acc.failed += 1;
      else if (s === "suppressed") acc.suppressed += 1;
      else acc.pending += 1;
      return acc;
    },
    { total: 0, sent: 0, failed: 0, suppressed: 0, pending: 0 },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Email delivery log</DialogTitle>
          <DialogDescription className="truncate">
            {newsTitle ? `Recipients for "${newsTitle}"` : "All recipients for this announcement"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">Total {counts.total}</Badge>
          <Badge variant="outline" className={statusVariant("sent")}>
            Sent {counts.sent}
          </Badge>
          <Badge variant="outline" className={statusVariant("queued")}>
            Pending {counts.pending}
          </Badge>
          <Badge variant="outline" className={statusVariant("failed")}>
            Failed {counts.failed}
          </Badge>
          <Badge variant="outline" className={statusVariant("suppressed")}>
            Suppressed {counts.suppressed}
          </Badge>
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Filter by email"
            className="pl-8 h-9 bg-background/40"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[420px] rounded-md border border-border/60">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No delivery records yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Recipient</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Sent at</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const live = r.message_id ? latest[r.message_id] : undefined;
                  const status = live?.status ?? r.status;
                  const err = live?.error_message ?? r.error;
                  return (
                    <tr key={r.id} className="border-t border-border/60 align-top">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[260px]">{r.recipient_email}</span>
                          {r.is_test && (
                            <Badge variant="outline" className="text-[10px]">
                              TEST
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={statusVariant(status)}>
                            {status}
                          </Badge>
                          {err && (
                            <span className="text-[11px] text-destructive line-clamp-2 max-w-[280px]">
                              {err}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
