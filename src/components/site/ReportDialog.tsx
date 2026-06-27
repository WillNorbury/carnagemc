import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Flag } from "lucide-react";
import { toast } from "sonner";
import { submitReport, type ReportTargetType } from "@/lib/reports";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const REASONS = [
  "Spam or misleading",
  "Inappropriate content",
  "Harassment or hate",
  "Malware or unsafe download",
  "Copyright/IP violation",
  "Impersonation",
  "Other",
];

type Props = {
  targetType: ReportTargetType;
  targetId?: string | null;
  targetLabel?: string | null;
  targetUrl?: string | null;
  trigger?: ReactNode;
  /** Use when triggered externally (e.g. from a dropdown). */
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
};

const ReportDialog = ({
  targetType,
  targetId,
  targetLabel,
  targetUrl,
  trigger,
  open: openProp,
  onOpenChange,
}: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openState, setOpenState] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? !!openProp : openState;
  const setOpen = (o: boolean) => {
    if (!isControlled) setOpenState(o);
    onOpenChange?.(o);
  };

  const [reason, setReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setReason("");
    setCustomReason("");
    setDetails("");
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Sign in to submit a report");
      navigate("/auth");
      return;
    }
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!finalReason) {
      toast.error("Please choose a reason");
      return;
    }
    setBusy(true);
    try {
      const url =
        targetUrl ??
        (typeof window !== "undefined" ? window.location.href : null);
      await submitReport({
        targetType,
        targetId: targetId ?? null,
        targetLabel: targetLabel ?? null,
        targetUrl: url,
        reason: finalReason,
        details: details.trim() || null,
      });
      toast.success("Report submitted — thanks for letting us know");
      reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to submit report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" /> Report{" "}
            {targetType.replace("_", " ")}
          </DialogTitle>
          <DialogDescription>
            {targetLabel
              ? `Reporting: ${targetLabel}`
              : "Tell us what's wrong. Our staff will review it."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "Other" && (
            <div className="space-y-1.5">
              <Label>Custom reason</Label>
              <Input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Briefly describe the issue"
                maxLength={120}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Details (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add any context that helps staff investigate"
              rows={4}
              maxLength={2000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={busy || !reason}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Flag className="h-4 w-4 mr-1" /> Submit report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
