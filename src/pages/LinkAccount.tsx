import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Link2, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

const MC_RE = /^[A-Za-z0-9_]{3,16}$/;

const LinkAccount = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mcUsername, setMcUsername] = useState("");
  const [linkedMc, setLinkedMc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isLinked = !!linkedMc;

  useEffect(() => {
    document.title = "Link Minecraft Account — XyloMC";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("mc_username")
        .eq("id", user.id)
        .maybeSingle();
      const existing = data?.mc_username ?? null;
      setLinkedMc(existing);
      setMcUsername(existing ?? "");
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const linkAccount = async () => {
    if (!user) return;
    const trimmed = mcUsername.trim();
    if (!MC_RE.test(trimmed)) {
      toast.error("Invalid Minecraft username (3–16 chars, letters/numbers/underscore)");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ mc_username: trimmed }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Minecraft account linked");
    navigate("/dashboard", { replace: true });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  const validPreview = MC_RE.test(mcUsername.trim());

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container pt-16 pb-16 max-w-xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard</Link>
        </Button>

        <Card className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="h-6 w-6 text-primary" />
            <h1 className="font-display font-black text-2xl">Link Minecraft Account</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your in-game username to display your skin, unlock account features, and verify
            your identity in support tickets and applications.
          </p>

          {validPreview && (
            <div className="flex items-center gap-3 mb-6 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <img
                src={`https://mc-heads.net/avatar/${mcUsername.trim()}/64`}
                alt={mcUsername.trim()}
                className="h-12 w-12 rounded"
              />
              <div className="min-w-0">
                <div className="font-display font-bold truncate">{mcUsername.trim()}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Looks good
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="mc">Minecraft username</Label>
            <Input
              id="mc"
              value={mcUsername}
              onChange={(e) => setMcUsername(e.target.value)}
              placeholder="Notch"
              maxLength={16}
              autoFocus={!isLinked}
              readOnly={isLinked}
              disabled={isLinked}
              onKeyDown={(e) => { if (e.key === "Enter" && validPreview && !isLinked) linkAccount(); }}
            />
            <p className="text-xs text-muted-foreground">
              {isLinked
                ? "Your account is already linked. Manage or unlink it from your profile."
                : "3–16 characters, letters, numbers and underscores only."}
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            {isLinked ? (
              <>
                <Button variant="outline" asChild>
                  <Link to="/profile">Manage in profile</Link>
                </Button>
                <Button asChild>
                  <Link to="/dashboard">Continue to dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Cancel</Link>
                </Button>
                <Button onClick={linkAccount} disabled={saving || !validPreview}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Link account
                </Button>
              </>
            )}
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default LinkAccount;
