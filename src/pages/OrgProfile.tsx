import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { userProfilePath } from "@/lib/userSlug";
import { Loader2, Users as UsersIcon, Pencil } from "lucide-react";

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

export default function OrgProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      setLoading(false);
    })();
  }, [slug]);

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
  const isOwner = user?.id === org.owner_id;
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
