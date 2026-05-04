import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Trash2, Plus, ShieldCheck, ShieldOff, Users as UsersIcon, Newspaper,
  Activity, Server as ServerIcon, X,
} from "lucide-react";
import { AdminLayout, type AdminSection } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { ALL_ROLES, roleLabel, type AppRole } from "@/lib/roles";

type Profile = { id: string; display_name: string | null; mc_username: string | null; created_at: string };
type RoleRow = { id: string; user_id: string; role: AppRole };
type News = { id: string; title: string; slug: string; excerpt: string | null; content: string; published: boolean; created_at: string };

const sectionMeta: Record<AdminSection, { title: string; description: string }> = {
  dashboard: { title: "Dashboard", description: "Overview of ZyphoraMC activity." },
  users: { title: "Users", description: "Promote or demote admin access." },
  roles: { title: "Roles", description: "Assign and manage roles for members." },
  news: { title: "News", description: "Create and publish announcements." },
  content: { title: "Site Content", description: "Edit hero copy, server info, and alerts." },
  status: { title: "Server Status", description: "Manually override the live status display." },
  logs: { title: "Admin Logs", description: "Audit trail of admin role checks." },
  "bot-dashboard": { title: "Discord Bot — Dashboard", description: "Status and overview of the ZyphoraMC Discord bot." },
  "bot-management": { title: "Discord Bot — Management", description: "Configure commands and bot integration." },
};

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initial: AdminSection = location.pathname.endsWith("/roles") ? "roles" : "dashboard";
  const [section, setSection] = useState<AdminSection>(initial);

  const onNavigate = (s: AdminSection) => {
    setSection(s);
    if (s === "roles" && location.pathname !== "/admin/roles") navigate("/admin/roles");
    else if (s !== "roles" && location.pathname !== "/admin") navigate("/admin");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <ShieldOff className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="text-muted-foreground">You don't have admin permissions.</p>
    </div>
  );

  const meta = sectionMeta[section];

  return (
    <AdminLayout current={section} onNavigate={onNavigate} title={meta.title} description={meta.description}>
      {section === "dashboard" && <DashboardSection onNavigate={onNavigate} />}
      {section === "users" && <UsersTab />}
      {section === "roles" && <RolesSection />}
      {section === "news" && <NewsTab />}
      {section === "content" && <ContentTab />}
      {section === "status" && <StatusTab />}
      {section === "logs" && <LogsTab />}
    </AdminLayout>
  );
};

const DashboardSection = ({ onNavigate }: { onNavigate: (s: AdminSection) => void }) => {
  const [stats, setStats] = useState({ users: 0, news: 0, admins: 0, online: false, players: 0, max: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: news }, { data: roles }, { data: status }, { data: logs }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("news").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
        supabase.from("server_status").select("*").eq("id", 1).maybeSingle(),
        supabase.from("admin_check_logs").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        users: users ?? 0,
        news: news ?? 0,
        admins: roles?.length ?? 0,
        online: status?.online ?? false,
        players: status?.players_online ?? 0,
        max: status?.players_max ?? 0,
      });
      setRecent(logs ?? []);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats.users} icon={UsersIcon} color="bg-sky-500" />
        <StatCard title="Admins" value={stats.admins} icon={ShieldCheck} color="bg-primary" />
        <StatCard title="News Posts" value={stats.news} icon={Newspaper} color="bg-orange-500" />
        <StatCard
          title="Server"
          value={stats.online ? "Online" : "Offline"}
          icon={ServerIcon}
          color={stats.online ? "bg-emerald-500" : "bg-destructive"}
          description={stats.online ? `${stats.players} / ${stats.max} players` : "currently down"}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold flex items-center gap-2"><Activity className="h-4 w-4" /> Recent admin checks</h2>
            <p className="text-xs text-muted-foreground">Latest 5 entries</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onNavigate("logs")}>View all</Button>
        </div>
        <div className="space-y-2">
          {recent.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          {recent.map((l) => (
            <div key={l.id} className="flex items-center justify-between text-sm p-2 rounded bg-secondary/30">
              <div className="flex items-center gap-2">
                <Badge variant={l.is_admin ? "default" : "destructive"}>{l.is_admin ? "ALLOWED" : "DENIED"}</Badge>
                <span>{l.email ?? l.user_id?.slice(0, 8) ?? "anon"}</span>
                <span className="text-xs text-muted-foreground">{l.context}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const UsersTab = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    setProfiles((p ?? []) as Profile[]);
    setRoles((r ?? []) as RoleRow[]);
  };
  useEffect(() => { load(); }, []);

  const isAdminFor = (uid: string) => roles.some((r) => r.user_id === uid && r.role === "admin");

  const toggleAdmin = async (uid: string) => {
    if (isAdminFor(uid)) {
      await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
      toast.success("Admin role removed");
    } else {
      await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
      toast.success("Promoted to admin");
    }
    load();
  };

  return (
    <Card className="p-6">
      <h2 className="font-bold mb-4">Users ({profiles.length})</h2>
      <div className="space-y-2">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
            <div>
              <div className="font-medium">{p.display_name ?? "Unnamed"}</div>
              <div className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)}</div>
            </div>
            <div className="flex items-center gap-2">
              {isAdminFor(p.id) && <Badge>Admin</Badge>}
              <Button size="sm" variant="outline" onClick={() => toggleAdmin(p.id)}>
                <ShieldCheck className="h-4 w-4 mr-1" />
                {isAdminFor(p.id) ? "Demote" : "Promote"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const RolesSection = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Record<string, AppRole>>({});

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, mc_username, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    setProfiles((p ?? []) as Profile[]);
    setRoles((r ?? []) as RoleRow[]);
  };
  useEffect(() => { load(); }, []);

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

  const filtered = useMemo(() => profiles.filter((p) =>
    !search || (p.display_name ?? "").toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)
  ), [profiles, search]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
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
  );
};

const NewsTab = () => {
  const [items, setItems] = useState<News[]>([]);
  const [editing, setEditing] = useState<Partial<News> | null>(null);

  const load = async () => {
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as News[]);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title || !editing?.content) return toast.error("Title and content required");
    const slug = (editing.slug || editing.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    const payload = { title: editing.title, slug, excerpt: editing.excerpt ?? null, content: editing.content, published: editing.published ?? false };
    const { error } = editing.id
      ? await supabase.from("news").update(payload).eq("id", editing.id)
      : await supabase.from("news").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("news").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Posts ({items.length})</h2>
          <Button size="sm" onClick={() => setEditing({ title: "", content: "", excerpt: "", published: false })}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className="p-3 rounded-lg bg-secondary/40 flex justify-between items-center">
              <div>
                <div className="font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.published ? "Published" : "Draft"} · {new Date(n.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(n)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {editing && (
        <Card className="p-6 space-y-4">
          <h2 className="font-bold">{editing.id ? "Edit" : "New"} post</h2>
          <div><Label>Title</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
          <div><Label>Excerpt</Label><Input value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></div>
          <div><Label>Content</Label><Textarea rows={8} value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={!!editing.published} onCheckedChange={(c) => setEditing({ ...editing, published: c })} /><Label>Published</Label></div>
          <div className="flex gap-2"><Button onClick={save}>Save</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
        </Card>
      )}
    </div>
  );
};

const ContentTab = () => {
  const [hero, setHero] = useState({ title: "", subtitle: "", badge: "" });
  const [server, setServer] = useState({ ip: "", discord: "", version: "", tagline: "" });
  const [alerts, setAlerts] = useState({
    onlineEnabled: true,
    onlineMessage: "🟢 Server is back online — jump in!",
    offlineEnabled: true,
    offlineMessage: "🔴 Server is currently offline. We're working on it.",
  });

  useEffect(() => {
    supabase.from("site_content").select("*").then(({ data }) => {
      const map: any = {};
      (data ?? []).forEach((r: any) => (map[r.key] = r.value));
      if (map.hero) setHero(map.hero);
      if (map.server) setServer(map.server);
      if (map.alerts) setAlerts((a) => ({ ...a, ...map.alerts }));
    });
  }, []);

  const save = async () => {
    const { error } = await supabase.from("site_content").upsert([
      { key: "hero", value: hero as any },
      { key: "server", value: server as any },
      { key: "alerts", value: alerts as any },
    ]);
    if (error) return toast.error(error.message);
    toast.success("Site content saved");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <h2 className="font-bold">Hero</h2>
        <div><Label>Title</Label><Input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} /></div>
        <div><Label>Subtitle</Label><Textarea value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} /></div>
        <div><Label>Badge</Label><Input value={hero.badge} onChange={(e) => setHero({ ...hero, badge: e.target.value })} /></div>
      </Card>
      <Card className="p-6 space-y-4">
        <h2 className="font-bold">Server</h2>
        <div><Label>IP</Label><Input value={server.ip} onChange={(e) => setServer({ ...server, ip: e.target.value })} /></div>
        <div><Label>Discord URL</Label><Input value={server.discord} onChange={(e) => setServer({ ...server, discord: e.target.value })} /></div>
        <div><Label>Version</Label><Input value={server.version} onChange={(e) => setServer({ ...server, version: e.target.value })} /></div>
        <div><Label>Tagline</Label><Input value={server.tagline} onChange={(e) => setServer({ ...server, tagline: e.target.value })} /></div>
      </Card>
      <Card className="p-6 space-y-4 md:col-span-2">
        <h2 className="font-bold">Status alerts</h2>
        <p className="text-sm text-muted-foreground">Banners shown on the homepage when the live Minecraft server status changes.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Switch checked={alerts.onlineEnabled} onCheckedChange={(c) => setAlerts({ ...alerts, onlineEnabled: c })} />
              <Label>Notify when server goes ONLINE</Label>
            </div>
            <Textarea rows={2} value={alerts.onlineMessage} onChange={(e) => setAlerts({ ...alerts, onlineMessage: e.target.value })} />
          </div>
          <div className="space-y-3 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Switch checked={alerts.offlineEnabled} onCheckedChange={(c) => setAlerts({ ...alerts, offlineEnabled: c })} />
              <Label>Notify when server goes OFFLINE</Label>
            </div>
            <Textarea rows={2} value={alerts.offlineMessage} onChange={(e) => setAlerts({ ...alerts, offlineMessage: e.target.value })} />
          </div>
        </div>
      </Card>
      <div className="md:col-span-2"><Button onClick={save}>Save all</Button></div>
    </div>
  );
};

const StatusTab = () => {
  const [s, setS] = useState({ online: true, players_online: 0, players_max: 500, motd: "" });
  useEffect(() => {
    supabase.from("server_status").select("*").eq("id", 1).maybeSingle().then(({ data }) => data && setS({ online: data.online, players_online: data.players_online, players_max: data.players_max, motd: data.motd ?? "" }));
  }, []);
  const save = async () => {
    const { error } = await supabase.from("server_status").update(s).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
  };
  return (
    <Card className="p-6 space-y-4 max-w-xl">
      <div className="flex items-center gap-2"><Switch checked={s.online} onCheckedChange={(c) => setS({ ...s, online: c })} /><Label>Server online</Label></div>
      <div><Label>Players online</Label><Input type="number" value={s.players_online} onChange={(e) => setS({ ...s, players_online: +e.target.value })} /></div>
      <div><Label>Max players</Label><Input type="number" value={s.players_max} onChange={(e) => setS({ ...s, players_max: +e.target.value })} /></div>
      <div><Label>MOTD</Label><Input value={s.motd} onChange={(e) => setS({ ...s, motd: e.target.value })} /></div>
      <Button onClick={save}>Save</Button>
    </Card>
  );
};

const LogsTab = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const { user } = useAuth();

  const load = async () => {
    let q = supabase.from("admin_check_logs").select("*").order("created_at", { ascending: false }).limit(100);
    if (scope === "mine" && user) q = q.eq("user_id", user.id);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setLogs(data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [scope]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Admin role check logs</h2>
        <div className="flex gap-2">
          <Button size="sm" variant={scope === "mine" ? "default" : "outline"} onClick={() => setScope("mine")}>My checks</Button>
          <Button size="sm" variant={scope === "all" ? "default" : "outline"} onClick={() => setScope("all")}>All (admin)</Button>
          <Button size="sm" variant="ghost" onClick={load}>Refresh</Button>
        </div>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-auto">
        {logs.length === 0 && <p className="text-sm text-muted-foreground">No logs yet. Reload pages that check admin access to generate entries.</p>}
        {logs.map((l) => (
          <div key={l.id} className="p-3 rounded-lg bg-secondary/40 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={l.is_admin ? "default" : "destructive"}>{l.is_admin ? "ALLOWED" : "DENIED"}</Badge>
                <span className="font-medium">{l.email ?? l.user_id?.slice(0, 8) ?? "anonymous"}</span>
                <span className="text-xs text-muted-foreground">{l.context}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              roles: <span className="font-mono">{(l.roles_found ?? []).join(", ") || "(none)"}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Admin;
