import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { roleLabel, type AppRole } from "@/lib/roles";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";

const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [mcUsername, setMcUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "My Profile — ZyphoraMC";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("display_name, mc_username, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      setDisplayName(p?.display_name ?? "");
      setMcUsername(p?.mc_username ?? "");
      setAvatarUrl(p?.avatar_url ?? "");
      setRoles(((r ?? []) as { role: AppRole }[]).map((x) => x.role));
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        mc_username: mcUsername || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
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

  const shortId = user!.id.slice(0, 8);
  const initials = (displayName || user!.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-glow">My Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your ZyphoraMC account</p>
          </div>
          <Button asChild variant="outline">
            <Link to={`/user/${shortId}`}>
              View public profile <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || (mcUsername ? `https://mc-heads.net/avatar/${mcUsername}/128` : undefined)} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-semibold truncate">{user!.email}</div>
              <div className="text-xs text-muted-foreground font-mono">ID: {shortId}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {roles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                {roles.map((r) => (
                  <Badge key={r} variant="secondary">{roleLabel(r)}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="display_name">Display name</Label>
              <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="mc_username">Minecraft username</Label>
              <Input id="mc_username" value={mcUsername} onChange={(e) => setMcUsername(e.target.value)} placeholder="Notch" />
              <p className="text-xs text-muted-foreground mt-1">Used to display your in-game skin avatar.</p>
            </div>
            <div>
              <Label htmlFor="avatar_url">Custom avatar URL (optional)</Label>
              <Input id="avatar_url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="flex justify-between flex-wrap gap-2">
            <Button variant="outline" onClick={async () => { await signOut(); navigate("/"); }}>
              Sign out
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save changes
            </Button>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
