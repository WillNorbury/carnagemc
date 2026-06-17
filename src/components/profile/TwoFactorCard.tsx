import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";

type FactorInfo = {
  id: string;
  status: string;
  friendly_name?: string;
  created_at: string;
};

type EnrollState =
  | { status: "idle" }
  | { status: "enrolling"; factorId: string; qr: string; secret: string; code: string };

const TwoFactorCard = () => {
  const [loading, setLoading] = useState(true);
  const [factor, setFactor] = useState<FactorInfo | null>(null);
  const [aal, setAal] = useState<{ currentLevel: string | null; nextLevel: string | null } | null>(null);
  const [enroll, setEnroll] = useState<EnrollState>({ status: "idle" });
  const [working, setWorking] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [{ data: factorData, error: factorErr }, { data: aalData, error: aalErr }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (factorErr) {
      toast.error(factorErr.message);
      setLoading(false);
      return;
    }
    const verified = factorData?.totp?.find((f) => f.status === "verified");
    if (verified) {
      setFactor({
        id: verified.id,
        status: verified.status,
        friendly_name: verified.friendly_name,
        created_at: verified.created_at,
      });
    } else {
      setFactor(null);
    }
    setAal(aalData ?? null);
    // Clean up any stale unverified factors so re-enrolling doesn't conflict
    const unverified = factorData?.totp?.filter((f) => f.status !== "verified") ?? [];
    for (const f of unverified) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const startEnroll = async () => {
    setWorking(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator (${new Date().toISOString().slice(0, 10)})`,
      });
      if (error) throw error;
      setEnroll({
        status: "enrolling",
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
        code: "",
      });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to start enrollment");
    } finally {
      setWorking(false);
    }
  };

  const cancelEnroll = async () => {
    if (enroll.status !== "enrolling") return;
    await supabase.auth.mfa.unenroll({ factorId: enroll.factorId });
    setEnroll({ status: "idle" });
  };

  const verifyEnroll = async () => {
    if (enroll.status !== "enrolling" || enroll.code.length !== 6) return;
    setWorking(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enroll.factorId,
        challengeId: challenge.id,
        code: enroll.code,
      });
      if (vErr) throw vErr;
      toast.success("Authenticator app enabled");
      setEnroll({ status: "idle" });
      await refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Invalid code");
    } finally {
      setWorking(false);
    }
  };

  const disable = async () => {
    if (!verifiedFactorId) return;
    if (!confirm("Remove your authenticator app? You'll only need email + password to sign in.")) return;
    setWorking(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactorId });
    setWorking(false);
    if (error) return toast.error(error.message);
    toast.success("Authenticator app removed");
    refresh();
  };

  return (
    <Card className="p-6 mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold text-lg">Two-factor authentication</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Add a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password, etc.) on top of your password.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
        </div>
      ) : verifiedFactorId ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Authenticator app is <strong>enabled</strong>.
          </div>
          <Button variant="outline" size="sm" onClick={disable} disabled={working}>
            <ShieldOff className="h-4 w-4 mr-2" /> Disable
          </Button>
        </div>
      ) : enroll.status === "enrolling" ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-md border bg-background p-4">
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code with your authenticator app:
            </p>
            <img src={enroll.qr} alt="Authenticator QR code" className="h-44 w-44 bg-white p-2 rounded-md" />
            <div className="text-xs text-muted-foreground text-center">
              Or enter this code manually:
              <div className="font-mono text-foreground tracking-wider mt-1 break-all">{enroll.secret}</div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Enter the 6-digit code from the app</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={enroll.code}
                onChange={(v) => setEnroll({ ...enroll, code: v })}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={cancelEnroll} disabled={working}>Cancel</Button>
            <Button onClick={verifyEnroll} disabled={working || enroll.code.length !== 6}>
              {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify & enable
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={startEnroll} disabled={working}>
          {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
          Set up authenticator app
        </Button>
      )}
    </Card>
  );
};

export default TwoFactorCard;
