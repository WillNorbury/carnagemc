import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ALL_ROLES, roleLabel, type AppRole } from "@/lib/roles";
import { Loader2, ArrowLeft } from "lucide-react";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  mc_username: string | null;
  created_at: string;
};

const roleRank = (r: AppRole) => {
  const idx = ALL_ROLES.findIndex((x) => x.value === r);
  return idx === -1 ? 999 : idx;
};

const UserProfile = () => {
  const { shortId } = useParams<{ shortId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shortId) return;
    (async () => {
      setLoading(true);
      // Look up profile by id prefix (first 8 chars)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, mc_username, created_at");
      const match = (profiles ?? []).find((p) => p.id.startsWith(shortId));
      if (!match) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data: r } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", match.id);
      setProfile(match as Profile);
      setRoles(((r ?? []) as { role: AppRole }[]).map((x) => x.role).sort((a, b) => roleRank(a) - roleRank(b)));
      document.title = `${match.display_name ?? "Player"} — ZyphoraMC`;
      setLoading(false);
    })();
  }, [shortId]);

  if (loading) {
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

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-display font-bold mb-2">Player not found</h1>
          <p className="text-muted-foreground mb-6">No user matches that ID.</p>
          <Button asChild><Link to="/users">Browse all members</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = (profile.display_name ?? "?").slice(0, 2).toUpperCase();
  const avatar = profile.avatar_url || (profile.mc_username ? `https://mc-heads.net/avatar/${profile.mc_username}/256` : undefined);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/users"><ArrowLeft className="h-4 w-4 mr-2" />All members</Link>
        </Button>

        <Card className="p-8">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-32 w-32 border-2 border-primary/30">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-display font-bold text-glow mb-1">
                {profile.display_name ?? "Unnamed Player"}
              </h1>
              {profile.mc_username && (
                <p className="text-muted-foreground font-mono text-sm">@{profile.mc_username}</p>
              )}
              <p className="text-xs text-muted-foreground font-mono mt-1">
                ID: {profile.id.slice(0, 8)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {roles.length === 0 && <span className="text-sm text-muted-foreground">No roles assigned</span>}
                {roles.map((r) => (
                  <Badge key={r} variant="secondary" className="text-sm">{roleLabel(r)}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
