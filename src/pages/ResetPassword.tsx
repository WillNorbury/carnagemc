import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { SEO } from "@/components/site/SEO";
import { KeyRound, Loader2 } from "lucide-react";

const ResetPassword = () => {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery hash in the URL via detectSessionInUrl.
    // Wait until a session exists (or confirm via auth event) before allowing submit.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().min(8, "Min 8 characters").max(72).safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — you're signed in");
      nav("/");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid">
      <SEO title="Reset password — CarnageMC" description="Choose a new password for your CarnageMC account." path="/reset-password" />
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <Card className="w-full max-w-md p-8 backdrop-blur-xl bg-card/90 border-primary/20 shadow-elegant">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-center mb-2">Reset your password</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {ready ? "Enter and confirm your new password." : "Validating reset link…"}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="np">New password</Label>
            <Input id="np" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} disabled={!ready} />
          </div>
          <div>
            <Label htmlFor="cp">Confirm password</Label>
            <Input id="cp" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} disabled={!ready} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !ready}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
