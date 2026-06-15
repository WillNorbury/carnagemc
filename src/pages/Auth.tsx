import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import logoAsset from "@/assets/havocsmp-logo.png.asset.json";
import { Link } from "react-router-dom";
import { SEO } from "@/components/site/SEO";
import { Mail, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  displayName: z.string().trim().min(2).max(40).optional(),
});

const Auth = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "verify">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => { if (user) nav("/"); }, [user, nav]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, displayName: mode === "signup" ? displayName : undefined });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        setMode("verify");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        nav("/");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      toast.success("Verification email resent — check your inbox");
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to resend email");
    } finally {
      setResendLoading(false);
    }
  };

  const discord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) toast.error(error.message ?? "Discord sign-in failed. Enable Discord in your Supabase project.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid">
      <SEO
        title="Sign in — HavocSMP"
        description="Sign in or create your HavocSMP account to apply for staff, vote, manage your profile, and access the dashboard."
        path="/auth"
      />
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <Card className="w-full max-w-md p-8 backdrop-blur-xl bg-card/90 border-primary/20 shadow-elegant">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <img src={logoAsset.url} alt="HavocSMP" className="h-12 w-12 object-contain" />
          <span className="font-bold text-xl">Havoc<span className="text-primary">SMP</span></span>
        </Link>

        {mode === "verify" ? (
          <div className="text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Verify your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a verification link to <span className="text-foreground font-medium">{email}</span>.<br />
                Click the link in the email to activate your account.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
              >
                {resendLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend verification email"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setMode("signin")}>
                Back to sign in
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid grid-cols-2 w-full mb-5">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

          <Button type="button" variant="outline" className="w-full mb-4 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border-[#5865F2]/40" onClick={discord}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              Continue with Discord
            </Button>
            <div className="relative my-4 text-center text-xs text-muted-foreground">
              <span className="bg-card px-2 relative z-10">or</span>
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
            </div>

            <form onSubmit={handle} className="space-y-4">
              <TabsContent value="signup" className="space-y-4 mt-0">
                <div>
                  <Label htmlFor="dn">Display name</Label>
                  <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Steve" />
                </div>
              </TabsContent>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>
          </Tabs>
        )}
      </Card>
    </div>
  );
};

export default Auth;
