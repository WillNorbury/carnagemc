import { useEffect, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { ALL_ROLES, roleLabel, type AppRole } from "@/lib/roles";
import { userProfilePath } from "@/lib/userSlug";
import { Link } from "react-router-dom";

type StaffMember = {
  user_id: string;
  role: AppRole;
  display_name: string | null;
  avatar_url: string | null;
  mc_username: string | null;
};

const STAFF_ROLES: AppRole[] = [
  "owner", "manager", "developer",
  "sr_admin", "admin", "jr_admin",
  "sr_mod", "mod",
  "sr_helper", "helper",
];

const roleRank = (r: AppRole) => {
  const idx = ALL_ROLES.findIndex((x) => x.value === r);
  return idx === -1 ? 999 : idx;
};

const Staff = () => {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Staff — HavocSMP";
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id,role")
        .in("role", STAFF_ROLES);
      const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
      if (ids.length === 0) {
        setLoading(false);
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url,mc_username")
        .in("id", ids);
      const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      // For each user, pick their highest-ranked staff role
      const byUser = new Map<string, StaffMember>();
      (roles ?? []).forEach((r) => {
        const existing = byUser.get(r.user_id);
        const role = r.role as AppRole;
        if (!existing || roleRank(role) < roleRank(existing.role)) {
          const prof = profMap.get(r.user_id);
          byUser.set(r.user_id, {
            user_id: r.user_id,
            role,
            display_name: prof?.display_name ?? null,
            avatar_url: prof?.avatar_url ?? null,
            mc_username: prof?.mc_username ?? null,
          });
        }
      });
      const list = Array.from(byUser.values()).sort(
        (a, b) => roleRank(a.role) - roleRank(b.role)
      );
      setMembers(list);
      setLoading(false);
    })();
  }, []);

  // Group by role
  const grouped = STAFF_ROLES.map((role) => ({
    role,
    members: members.filter((m) => m.role === role),
  })).filter((g) => g.members.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-28 pb-16">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Meet the Staff</h1>
          <p className="text-muted-foreground mt-2">
            The team keeping HavocSMP running smoothly.
          </p>
        </header>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : grouped.length === 0 ? (
          <p className="text-center text-muted-foreground">No staff members to show yet.</p>
        ) : (
          <div className="space-y-12">
            {grouped.map(({ role, members }) => (
              <section key={role}>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-xl font-semibold">{roleLabel(role)}</h2>
                  <Badge variant="secondary">{members.length}</Badge>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {members.map((m) => {
                    const name = m.display_name ?? m.mc_username ?? "Unknown";
                    const initials = name.slice(0, 2).toUpperCase();
                    const skin = m.mc_username
                      ? `https://mc-heads.net/avatar/${m.mc_username}/96`
                      : null;
                    return (
                      <Card key={m.user_id} className="p-0 hover:border-primary/50 hover:shadow-md transition">
                        <Link to={userProfilePath({ id: m.user_id, display_name: m.display_name, mc_username: m.mc_username })} className="flex items-center gap-4 p-5">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={skin ?? m.avatar_url ?? undefined} alt={name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {roleLabel(m.role)}
                            </p>
                          </div>
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Staff;
