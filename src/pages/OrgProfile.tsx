import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { userProfilePath } from "@/lib/userSlug";
import { toast } from "sonner";
import { Boxes, Loader2, Pencil, Plus, Users as UsersIcon, X } from "lucide-react";

type Org = {
  id: string;
  slug: string;
  name: string;
  description: string;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
};

type Member = {
  user_id: string;
  role: "owner" | "admin" | "member";
  profile: { id: string; display_name: string | null; mc_username: string | null; avatar_url: string | null } | null;
};

type Project = {
  kind: "mod" | "plugin";
  id: string;
  name: string;
  slug?: string;
  short_id: string;
  description: string | null;
  icon_url: string | null;
  category: string | null;
};

export default function OrgProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Attach-projects dialog state (owner only)
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachable, setAttachable] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [attaching, setAttaching] = useState(false);

  const loadProjects = async (orgId: string) => {
    const [{ data: mods }, { data: plugins }] = await Promise.all([
      (supabase.from("mods" as any) as any)
        .select("id, slug, short_id, name, description, icon_url, category")
        .eq("org_id", orgId)
        .eq("published", true),
      (supabase.from("plugins" as any) as any)
        .select("id, short_id, name, description, icon_url, category")
        .eq("org_id", orgId)
        .eq("published", true),
    ]);
    setProjects([
      ...((mods ?? []) as any[]).map((m) => ({ kind: "mod" as const, ...m })),
      ...((plugins ?? []) as any[]).map((p) => ({ kind: "plugin" as const, ...p })),
    ]);
  };

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setNotFound(false);
      const { data: o } = await supabase
        .from("organizations")
        .select("id, slug, name, description, avatar_url, owner_id, created_at")
        .eq("slug", slug.toLowerCase())
        .maybeSingle();
      if (!o) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setOrg(o as Org);
      document.title = `${o.name} — XyloMC`;

      const { data: m } = await supabase
        .from("organization_members")
        .select("user_id, role")
        .eq("org_id", o.id);
      const ids = (m ?? []).map((x) => x.user_id);
      const { data: profs } = ids.length
        ? await supabase
            .from("profiles")
            .select("id, display_name, mc_username, avatar_url")
            .in("id", ids)
        : { data: [] as any[] };
      const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      setMembers(
        (m ?? []).map((x: any) => ({
          user_id: x.user_id,
          role: x.role,
          profile: profMap.get(x.user_id) ?? null,
        }))
      );

      await loadProjects(o.id);
      setLoading(false);
    })();
  }, [slug]);

  const isOwner = !!user && !!org && user.id === org.owner_id;

  const openAttach = async () => {
    if (!user || !org) return;
    setAttachOpen(true);
    setSelected(new Set());
    setAttachLoading(true);
    // Mods/plugins authored by the current user (by display_name / mc_username) that are not yet assigned to any org
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name, mc_username")
      .eq("id", user.id)
      .maybeSingle();
    const authorNames = [prof?.display_name, prof?.mc_username].filter(Boolean) as string[];
    if (authorNames.length === 0) {
      setAttachable([]);
      setAttachLoading(false);
      return;
    }
    const [{ data: mods }, { data: plugins }] = await Promise.all([
      (supabase.from("mods" as any) as any)
        .select("id, slug, short_id, name, description, icon_url, category, org_id")
        .in("author", authorNames),
      (supabase.from("plugins" as any) as any)
        .select("id, short_id, name, description, icon_url, category, org_id")
        .in("author", authorNames),
    ]);
    const list: Project[] = [
      ...((mods ?? []) as any[])
        .filter((m) => !m.org_id)
        .map((m) => ({ kind: "mod" as const, ...m })),
      ...((plugins ?? []) as any[])
        .filter((p) => !p.org_id)
        .map((p) => ({ kind: "plugin" as const, ...p })),
    ];
    setAttachable(list);
    setAttachLoading(false);
  };

  const toggle = (key: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const attach = async () => {
    if (!org || selected.size === 0) return;
    setAttaching(true);
    const modIds: string[] = [];
    const pluginIds: string[] = [];
    for (const key of selected) {
      const [kind, id] = key.split(":");
      if (kind === "mod") modIds.push(id);
      else pluginIds.push(id);
    }
    let err: string | null = null;
    if (modIds.length) {
      const { error } = await (supabase.from("mods" as any) as any)
        .update({ org_id: org.id })
        .in("id", modIds);
      if (error) err = error.message;
    }
    if (pluginIds.length) {
      const { error } = await (supabase.from("plugins" as any) as any)
        .update({ org_id: org.id })
        .in("id", pluginIds);
      if (error) err = error.message;
    }
    setAttaching(false);
    if (err) return toast.error(err);
    toast.success("Projects attached");
    setAttachOpen(false);
    await loadProjects(org.id);
  };

  const detach = async (p: Project) => {
    if (!org) return;
    const table = p.kind === "mod" ? "mods" : "plugins";
    const { error } = await (supabase.from(table as any) as any)
      .update({ org_id: null })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Project removed from organization");
    await loadProjects(org.id);
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

  if (notFound || !org) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-2xl text-center">
          <h1 className="text-3xl font-display font-bold">Organization not found</h1>
          <p className="text-muted-foreground mt-2">No organization exists at /org/{slug}.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = org.name.slice(0, 2).toUpperCase();
  const sorted = [...members].sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2 } as const;
    return order[a.role] - order[b.role];
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <Card className="p-6">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar className="h-24 w-24">
              <AvatarImage src={org.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-display font-bold text-glow">{org.name}</h1>
                <Badge variant="secondary">Organization</Badge>
              </div>
              <div className="text-sm text-muted-foreground font-mono mt-1">/org/{org.slug}</div>
              {org.description && (
                <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{org.description}</p>
              )}
            </div>
            {isOwner && (
              <Button asChild variant="outline" size="sm">
                <Link to="/profile">
                  <Pencil className="h-4 w-4 mr-1" /> Manage
                </Link>
              </Button>
            )}
          </div>
        </Card>

        {/* Projects */}
        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              <h2 className="font-display font-bold text-lg">Projects</h2>
              <Badge variant="secondary">{projects.length}</Badge>
            </div>
            {isOwner && (
              <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={openAttach}>
                    <Plus className="h-4 w-4 mr-1" /> Add projects
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add mods or plugins</DialogTitle>
                    <DialogDescription>
                      Select your unassigned projects to attach to <strong>{org.name}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  {attachLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : attachable.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No unassigned mods or plugins authored by you were found. Projects must list your display name or Minecraft username as the author.
                    </p>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto divide-y divide-border -mx-2">
                      {attachable.map((p) => {
                        const key = `${p.kind}:${p.id}`;
                        return (
                          <li key={key} className="flex items-center gap-3 px-2 py-2">
                            <Checkbox
                              checked={selected.has(key)}
                              onCheckedChange={() => toggle(key)}
                              id={key}
                            />
                            <label htmlFor={key} className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                              {p.icon_url ? (
                                <img src={p.icon_url} alt="" className="h-9 w-9 rounded object-cover border border-border" />
                              ) : (
                                <div className="h-9 w-9 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
                                  <Boxes className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold truncate">{p.name}</div>
                                <div className="text-xs text-muted-foreground capitalize">{p.kind}</div>
                              </div>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAttachOpen(false)} disabled={attaching}>
                      Cancel
                    </Button>
                    <Button onClick={attach} disabled={attaching || selected.size === 0}>
                      {attaching && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Add {selected.size > 0 ? `(${selected.size})` : ""}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects yet. {isOwner ? "Click 'Add projects' to attach your mods or plugins." : ""}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {projects.map((p) => {
                const href = p.kind === "mod" ? `/mod/${p.slug}` : `/plugin/${p.short_id}`;
                return (
                  <li key={`${p.kind}-${p.id}`} className="group relative">
                    <Link to={href}>
                      <Card className="p-3 hover:border-primary/50 transition-colors">
                        <div className="flex items-start gap-3">
                          {p.icon_url ? (
                            <img src={p.icon_url} alt="" className="h-12 w-12 rounded object-cover border border-border" />
                          ) : (
                            <div className="h-12 w-12 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
                              <Boxes className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                              <Badge variant="secondary" className="text-xs capitalize">{p.kind}</Badge>
                            </div>
                            {p.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                    {isOwner && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          detach(p);
                        }}
                        aria-label="Remove from organization"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Members */}
        <Card className="p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <UsersIcon className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-lg">Members</h2>
            <Badge variant="secondary">{members.length}</Badge>
          </div>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {sorted.map((m) => {
                const p = m.profile;
                const name = p?.display_name || p?.mc_username || m.user_id.slice(0, 8);
                const initials = name.slice(0, 2).toUpperCase();
                const path = p
                  ? userProfilePath({ id: p.id, display_name: p.display_name, mc_username: p.mc_username })
                  : `/user/${m.user_id.slice(0, 8)}`;
                return (
                  <li key={m.user_id} className="flex items-center justify-between gap-3 py-3">
                    <Link to={path} className="flex items-center gap-3 min-w-0 hover:opacity-80">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={p?.avatar_url ?? (p?.mc_username ? `https://mc-heads.net/avatar/${p.mc_username}/64` : undefined)}
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{name}</div>
                        {p?.mc_username && (
                          <div className="text-xs text-muted-foreground truncate">{p.mc_username}</div>
                        )}
                      </div>
                    </Link>
                    <Badge variant={m.role === "owner" ? "default" : "secondary"} className="capitalize">
                      {m.role}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
}
