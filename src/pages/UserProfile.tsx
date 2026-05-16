import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ALL_ROLES, roleLabel, type AppRole } from "@/lib/roles";
import { Loader2, ArrowLeft, UserPlus, UserCheck, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [listMode, setListMode] = useState<null | "followers" | "following">(null);
  const [listLoading, setListLoading] = useState(false);
  const [listUsers, setListUsers] = useState<Profile[]>([]);
  const [followsMeBack, setFollowsMeBack] = useState(false);
  const [recommendations, setRecommendations] = useState<(Profile & { reason: string })[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recBusy, setRecBusy] = useState<string | null>(null);
  const [followedRecs, setFollowedRecs] = useState<Set<string>>(new Set());

  const openList = async (mode: "followers" | "following") => {
    if (!profile) return;
    setListMode(mode);
    setListLoading(true);
    setListUsers([]);
    const col = mode === "followers" ? "followee_id" : "follower_id";
    const otherCol = mode === "followers" ? "follower_id" : "followee_id";
    const { data: rels } = await supabase
      .from("user_follows")
      .select(otherCol)
      .eq(col, profile.id);
    const ids = (rels ?? []).map((r: Record<string, string>) => r[otherCol]).filter(Boolean);
    if (ids.length === 0) { setListLoading(false); return; }
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, mc_username, created_at")
      .in("id", ids);
    setListUsers((profs ?? []) as Profile[]);
    setListLoading(false);
  };

  const loadCounts = async (targetId: string, viewerId: string | undefined) => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("followee_id", targetId),
      supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", targetId),
    ]);
    setFollowerCount(followers ?? 0);
    setFollowingCount(following ?? 0);
    if (viewerId && viewerId !== targetId) {
      const [{ data: a }, { data: b }] = await Promise.all([
        supabase.from("user_follows").select("follower_id")
          .eq("follower_id", viewerId).eq("followee_id", targetId).maybeSingle(),
        supabase.from("user_follows").select("follower_id")
          .eq("follower_id", targetId).eq("followee_id", viewerId).maybeSingle(),
      ]);
      setIsFollowing(!!a);
      setFollowsMeBack(!!b);
    } else {
      setIsFollowing(false);
      setFollowsMeBack(false);
    }
  };

  const loadRecommendations = async (viewerId: string, viewerRoles: AppRole[]) => {
    setRecsLoading(true);
    // Already-followed ids
    const { data: followingRows } = await supabase
      .from("user_follows").select("followee_id").eq("follower_id", viewerId);
    const excluded = new Set<string>([viewerId, ...((followingRows ?? []).map((r) => r.followee_id))]);

    // Candidates by shared role
    let roleCandidates: { user_id: string; role: AppRole }[] = [];
    if (viewerRoles.length > 0) {
      const { data } = await supabase
        .from("user_roles").select("user_id, role").in("role", viewerRoles).limit(100);
      roleCandidates = (data ?? []) as { user_id: string; role: AppRole }[];
    }

    // Recent activity: latest profiles (joined recently)
    const { data: recentProfiles } = await supabase
      .from("profiles").select("id, display_name, avatar_url, mc_username, created_at")
      .order("created_at", { ascending: false }).limit(30);

    const reasons = new Map<string, string>();
    for (const rc of roleCandidates) {
      if (excluded.has(rc.user_id)) continue;
      if (!reasons.has(rc.user_id)) reasons.set(rc.user_id, `Shared role: ${roleLabel(rc.role)}`);
    }
    for (const p of (recentProfiles ?? [])) {
      if (excluded.has(p.id) || reasons.has(p.id)) continue;
      reasons.set(p.id, "Recently joined");
    }

    const ids = Array.from(reasons.keys()).slice(0, 5);
    if (ids.length === 0) { setRecommendations([]); setRecsLoading(false); return; }

    const { data: profs } = await supabase
      .from("profiles").select("id, display_name, avatar_url, mc_username, created_at").in("id", ids);
    const ordered = ids
      .map((id) => (profs ?? []).find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => ({ ...(p as Profile), reason: reasons.get((p as Profile).id)! }));
    setRecommendations(ordered);
    setRecsLoading(false);
  };

  const followRecommendation = async (id: string) => {
    if (!user) return;
    setRecBusy(id);
    const { error } = await supabase
      .from("user_follows").insert({ follower_id: user.id, followee_id: id });
    setRecBusy(null);
    if (error) { toast.error(error.message); return; }
    setFollowedRecs((s) => new Set(s).add(id));
    if (profile && id === profile.id) {
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
    }
  };

  useEffect(() => {
    if (!shortId) return;
    (async () => {
      setLoading(true);
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
      document.title = `${match.display_name ?? "Player"} — XyloMC`;
      const sortedRoles = ((r ?? []) as { role: AppRole }[]).map((x) => x.role).sort((a, b) => roleRank(a) - roleRank(b));
      await loadCounts(match.id, user?.id);
      if (user?.id && user.id === match.id) {
        await loadRecommendations(user.id, sortedRoles);
      } else {
        setRecommendations([]);
        setFollowedRecs(new Set());
      }
      setLoading(false);
    })();
  }, [shortId, user?.id]);

  const toggleFollow = async () => {
    if (!user) { toast.error("Sign in to follow players"); return; }
    if (!profile) return;
    setFollowBusy(true);
    if (isFollowing) {
      const { error } = await supabase
        .from("user_follows").delete()
        .eq("follower_id", user.id).eq("followee_id", profile.id);
      if (error) toast.error(error.message);
      else { setIsFollowing(false); setFollowerCount((c) => Math.max(0, c - 1)); }
    } else {
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, followee_id: profile.id });
      if (error) toast.error(error.message);
      else { setIsFollowing(true); setFollowerCount((c) => c + 1); }
    }
    setFollowBusy(false);
  };

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

              <div className="flex items-center gap-4 mt-4 text-sm">
                <button onClick={() => openList("followers")} className="hover:text-primary transition-colors">
                  <strong className="text-foreground">{followerCount}</strong> <span className="text-muted-foreground">followers</span>
                </button>
                <button onClick={() => openList("following")} className="hover:text-primary transition-colors">
                  <strong className="text-foreground">{followingCount}</strong> <span className="text-muted-foreground">following</span>
                </button>
              </div>

              {user && user.id !== profile.id && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <Button
                    onClick={toggleFollow}
                    disabled={followBusy}
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                  >
                    {followBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <><UserCheck className="h-4 w-4" /> Following</>
                    ) : (
                      <><UserPlus className="h-4 w-4" /> Follow</>
                    )}
                  </Button>
                  {isFollowing && followsMeBack && (
                    <Badge variant="default" className="gap-1">
                      <Users className="h-3 w-3" /> Mutuals
                    </Badge>
                  )}
                  {!isFollowing && followsMeBack && (
                    <Badge variant="secondary">Follows you</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {user && user.id === profile.id && (
          <Card className="p-6 mt-6">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-display font-bold text-lg">Who to follow</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Suggested players based on your roles and recent activity.
            </p>
            {recsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No suggestions right now — check back later.</p>
            ) : (
              <ul className="space-y-2">
                {recommendations.map((u) => {
                  const av = u.avatar_url || (u.mc_username ? `https://mc-heads.net/avatar/${u.mc_username}/64` : undefined);
                  const init = (u.display_name ?? "?").slice(0, 2).toUpperCase();
                  const followed = followedRecs.has(u.id);
                  return (
                    <li key={u.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                      <Link to={`/user/${u.id.slice(0, 8)}`} className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={av} />
                          <AvatarFallback>{init}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.display_name ?? "Unnamed Player"}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.reason}</div>
                        </div>
                      </Link>
                      <Button
                        size="sm"
                        variant={followed ? "outline" : "default"}
                        disabled={followed || recBusy === u.id}
                        onClick={() => followRecommendation(u.id)}
                      >
                        {recBusy === u.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : followed ? (
                          <><UserCheck className="h-4 w-4" /> Following</>
                        ) : (
                          <><UserPlus className="h-4 w-4" /> Follow</>
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}

        <Dialog open={!!listMode} onOpenChange={(o) => !o && setListMode(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="capitalize">
                {listMode === "followers" ? `Followers (${followerCount})` : `Following (${followingCount})`}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto -mx-6 px-6">
              {listLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : listUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {listMode === "followers" ? "No followers yet." : "Not following anyone yet."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {listUsers.map((u) => {
                    const av = u.avatar_url || (u.mc_username ? `https://mc-heads.net/avatar/${u.mc_username}/64` : undefined);
                    const init = (u.display_name ?? "?").slice(0, 2).toUpperCase();
                    return (
                      <li key={u.id}>
                        <Link
                          to={`/user/${u.id.slice(0, 8)}`}
                          onClick={() => setListMode(null)}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={av} />
                            <AvatarFallback>{init}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{u.display_name ?? "Unnamed Player"}</div>
                            {u.mc_username && (
                              <div className="text-xs text-muted-foreground font-mono truncate">@{u.mc_username}</div>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
