import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ALL_ROLES, roleLabel, type AppRole } from "@/lib/roles";
import { matchesUserSlug, userProfileSlug } from "@/lib/userSlug";
import {
  Loader2,
  Package,
  Download,
  Heart,
  Calendar,
  Pencil,
  MoreVertical,
  Globe,
  Flag,
  Link as LinkIcon,
  UserPlus,
  UserCheck,
  Boxes,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import ReportDialog from "@/components/site/ReportDialog";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  mc_username: string | null;
  bio: string | null;
  created_at: string;
};

type Project = {
  kind: "mod" | "plugin";
  id: string;
  slug?: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  category: string | null;
  tags: string[];
  likes: number;
  short_id: string;
  updated_at: string | null;
};

const roleRank = (r: AppRole) => {
  const idx = ALL_ROLES.findIndex((x) => x.value === r);
  return idx === -1 ? 999 : idx;
};

const timeAgo = (iso: string | null) => {
  if (!iso) return "recently";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const d = s / 86400;
  if (d < 1) return "today";
  if (d < 30) return `${Math.floor(d)} days ago`;
  const mo = d / 30;
  if (mo < 12) return `${Math.floor(mo)} month${Math.floor(mo) === 1 ? "" : "s"} ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? "" : "s"} ago`;
};

const UserProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; slug: string; name: string; avatar_url: string | null; role: string }[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editDisplay, setEditDisplay] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isOwn = !!user && !!profile && user.id === profile.id;

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setNotFound(false);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, mc_username, bio, created_at");
      const match = (profiles ?? []).find((p) => matchesUserSlug(p, slug))
        ?? (user?.id.toLowerCase().startsWith(slug.trim().toLowerCase())
          ? (profiles ?? []).find((p) => p.id === user.id)
          : null);
      if (!match) {
        setNotFound(true);
        setProfile(null);
        setLoading(false);
        return;
      }
      const p = match as Profile;
      setProfile(p);
      const canonicalSlug = userProfileSlug(p);
      if (canonicalSlug !== slug.trim().toLowerCase()) {
        navigate(`/user/${canonicalSlug}`, { replace: true });
      }
      document.title = `${p.display_name ?? "Player"} — CarnageMC`;

      // Roles
      const { data: r } = await supabase
        .from("user_roles").select("role").eq("user_id", p.id);
      setRoles(((r ?? []) as { role: AppRole }[]).map((x) => x.role).sort((a, b) => roleRank(a) - roleRank(b)));

      // Projects: match by author = display_name or mc_username
      const authorMatches = [p.display_name, p.mc_username].filter(Boolean) as string[];
      let allProjects: Project[] = [];
      if (authorMatches.length > 0) {
        const [{ data: mods }, { data: plugins }] = await Promise.all([
          (supabase.from("mods" as any) as any)
            .select("id, slug, short_id, name, description, icon_url, category, tags, updated_at")
            .eq("published", true)
            .in("author", authorMatches),
          (supabase.from("plugins" as any) as any)
            .select("id, short_id, name, description, icon_url, category, tags, updated_at")
            .eq("published", true)
            .in("author", authorMatches),
        ]);
        const modIds = (mods ?? []).map((m: any) => m.id);
        let likesByMod: Record<string, number> = {};
        if (modIds.length) {
          const { data: likes } = await (supabase.from("mod_likes" as any) as any)
            .select("mod_id").in("mod_id", modIds);
          for (const l of (likes ?? []) as { mod_id: string }[]) {
            likesByMod[l.mod_id] = (likesByMod[l.mod_id] ?? 0) + 1;
          }
        }
        allProjects = [
          ...((mods ?? []) as any[]).map((m) => ({
            kind: "mod" as const, id: m.id, slug: m.slug, short_id: m.short_id,
            name: m.name, description: m.description, icon_url: m.icon_url,
            category: m.category, tags: m.tags ?? [], updated_at: m.updated_at,
            likes: likesByMod[m.id] ?? 0,
          })),
          ...((plugins ?? []) as any[]).map((pl) => ({
            kind: "plugin" as const, id: pl.id, short_id: pl.short_id,
            name: pl.name, description: pl.description, icon_url: pl.icon_url,
            category: pl.category, tags: pl.tags ?? [], updated_at: pl.updated_at,
            likes: 0,
          })),
        ];
      }
      setProjects(allProjects);

      // Organizations the user is a member of
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("role, organizations(id, slug, name, avatar_url)")
        .eq("user_id", p.id);
      setOrgs(
        ((memberships ?? []) as any[])
          .filter((m) => m.organizations)
          .map((m) => ({
            id: m.organizations.id,
            slug: m.organizations.slug,
            name: m.organizations.name,
            avatar_url: m.organizations.avatar_url,
            role: m.role,
          }))
      );

      // Follower counts (via secure RPC so the social graph is not enumerable)
      const { data: followers } = await supabase
        .rpc("get_follower_count", { _user_id: p.id });
      setFollowerCount((followers as number | null) ?? 0);
      if (user?.id && user.id !== p.id) {
        const { data: a } = await supabase
          .from("user_follows").select("follower_id")
          .eq("follower_id", user.id).eq("followee_id", p.id).maybeSingle();
        setIsFollowing(!!a);
      } else {
        setIsFollowing(false);
      }

      setLoading(false);
    })();
  }, [slug, user?.id, navigate]);

  const openEdit = () => {
    if (!profile) return;
    setEditDisplay(profile.display_name ?? "");
    setEditBio(profile.bio ?? "");
    setEditAvatar(profile.avatar_url ?? "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!profile) return;
    setEditBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: editDisplay.trim() || null,
        bio: editBio.trim() || null,
        avatar_url: editAvatar.trim() || null,
      })
      .eq("id", profile.id);
    setEditBusy(false);
    if (error) { toast.error(error.message); return; }
    setProfile({ ...profile, display_name: editDisplay.trim() || null, bio: editBio.trim() || null, avatar_url: editAvatar.trim() || null });
    setEditOpen(false);
    toast.success("Profile updated");
  };

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied");
    } catch {
      toast.error("Could not copy link");
    }
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        {/* Header row */}
        <div className="flex items-start gap-5 pb-6 border-b border-border">
          <Avatar className="h-24 w-24 rounded-full border border-border shrink-0">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight">
              {profile.display_name ?? "Unnamed Player"}
            </h1>
            {profile.bio ? (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{profile.bio}</p>
            ) : isOwn ? (
              <p className="text-sm text-muted-foreground/70 italic mt-1">
                Add a bio to tell people about yourself.
              </p>
            ) : null}

            <div className="flex items-center gap-5 mt-3 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                <strong className="text-foreground">{projects.length}</strong> project{projects.length === 1 ? "" : "s"}
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4" />
                <strong className="text-foreground">0</strong> downloads
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Joined {timeAgo(profile.created_at)}
              </span>
              {roles.length > 0 && roles.slice(0, 3).map((r) => (
                <Badge key={r} variant="secondary" className="rounded-full">{roleLabel(r)}</Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwn ? (
              <Button variant="outline" size="sm" className="rounded-md" onClick={openEdit}>
                <Pencil className="h-4 w-4 mr-1.5" /> Edit
              </Button>
            ) : user ? (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={toggleFollow}
                disabled={followBusy}
              >
                {followBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFollowing ? (
                  <><UserCheck className="h-4 w-4 mr-1" /> Following</>
                ) : (
                  <><UserPlus className="h-4 w-4 mr-1" /> Follow</>
                )}
              </Button>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-md" aria-label="More">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyLink}>
                  <LinkIcon className="h-4 w-4 mr-2" /> Copy profile link
                </DropdownMenuItem>
                {isOwn ? (
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Pencil className="h-4 w-4 mr-2" /> Account settings
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setReportOpen(true);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Flag className="h-4 w-4 mr-2" /> Report user
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Body: projects + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-6">
          <div className="space-y-3">
            {projects.length === 0 ? (
              <Card className="p-10 text-center">
                <Boxes className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h2 className="font-bold text-lg mb-1">No projects yet</h2>
                <p className="text-sm text-muted-foreground">
                  {isOwn ? "Projects you publish will show up here." : "This member hasn't published any projects."}
                </p>
              </Card>
            ) : (
              projects.map((p) => {
                const href = p.kind === "mod" ? `/mod/${p.slug}` : `/plugin/${p.short_id}`;
                return (
                  <Link key={`${p.kind}-${p.id}`} to={href}>
                    <Card className="p-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-start gap-4">
                        {p.icon_url ? (
                          <img src={p.icon_url} alt="" className="h-16 w-16 rounded-md object-cover border border-border bg-card shrink-0" />
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                            <Boxes className="h-7 w-7 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base">{p.name}</h3>
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                              <Globe className="h-3 w-3" /> Public
                            </span>
                          </div>
                          {p.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {p.category && (
                              <Badge variant="secondary" className="rounded-full">{p.category}</Badge>
                            )}
                            {p.tags?.slice(0, 3).map((t) => (
                              <Badge key={t} variant="secondary" className="rounded-full">{t}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground shrink-0 space-y-1">
                          <div className="flex items-center justify-end gap-3">
                            <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> 0</span>
                            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {p.likes}</span>
                          </div>
                          <div className="text-xs">{timeAgo(p.updated_at)}</div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>

          <aside className="space-y-4">
            <Card className="p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Organizations
              </h3>
              {orgs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isOwn ? "You're not a member of any organizations yet." : "No organizations."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {orgs.map((o) => {
                    const initials = o.name.slice(0, 2).toUpperCase();
                    return (
                      <li key={o.id}>
                        <Link
                          to={`/org/${o.slug}`}
                          className="flex items-center gap-3 rounded-md p-2 -mx-2 hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={o.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate">{o.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{o.role}</div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-bold mb-3">Followers</h3>
              <div className="text-2xl font-display font-bold text-glow">{followerCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {followerCount === 1 ? "person follows" : "people follow"} this member
              </p>
            </Card>
          </aside>
        </div>
      </main>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="dn">Display name</Label>
              <Input id="dn" value={editDisplay} onChange={(e) => setEditDisplay(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="av">Avatar URL</Label>
              <Input id="av" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} placeholder="A few words about you" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={editBusy}>
              {editBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default UserProfile;
