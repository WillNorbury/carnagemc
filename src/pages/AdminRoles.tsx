import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/site/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldOff, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { ALL_ROLES, roleLabel, type AppRole } from "@/lib/roles";

type Profile = { id: string; display_name: string | null; created_at: string };
type RoleRow = { id: string; user_id: string; role: AppRole };

const AdminRoles = () => {
  const { user, isAdmin, loading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Record<string, AppRole>>({});

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    setProfiles((p ?? []) as Profile[]);
    setRoles((r ?? []) as RoleRow[]);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <ShieldOff className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">Access denied</h1>
    </div>
  );

  const rolesFor = (uid: string) => roles.filter((r) => r.user_id === uid);

  const removeRole = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Role removed");
    load();
  };

  const addRole = async (uid: string) => {
    const role = pending[uid];
    if (!role) return;
    if (rolesFor(uid).some((r) => r.role === role)) return toast.error("User already has that role");
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    setPending({ ...pending, [uid]: undefined as any });
    toast.success(`Assigned ${roleLabel(role)}`);
    load();
  };

  const filtered = profiles.filter((p) =>
    !search || (p.display_name ?? "").toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground">Assign and manage roles for ZyphoraMC members.</p>
        </div>

        <Card className="p-4 mb-4">
          <div className="text-sm text-muted-foreground mb-2">Available roles</div>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((r) => <Badge key={r.value} variant="secondary">{r.label}</Badge>)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="font-bold">Members ({profiles.length})</h2>
            <Input placeholder="Search by name or ID" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          </div>
          <div className="space-y-3">
            {filtered.map((p) => {
              const ur = rolesFor(p.id);
              return (
                <div key={p.id} className="p-4 rounded-lg bg-secondary/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{p.display_name ?? "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={pending[p.id] ?? ""} onValueChange={(v) => setPending({ ...pending, [p.id]: v as AppRole })}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Pick role..." /></SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => addRole(p.id)}><Plus className="h-4 w-4 mr-1" />Add</Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ur.length === 0 && <span className="text-xs text-muted-foreground">No roles assigned</span>}
                    {ur.map((r) => (
                      <Badge key={r.id} variant="outline" className="gap-1">
                        {roleLabel(r.role)}
                        <button onClick={() => removeRole(r.id)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminRoles;
