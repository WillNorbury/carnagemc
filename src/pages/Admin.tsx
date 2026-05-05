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
  Activity, Server as ServerIcon, X, Ticket as TicketIcon, MessageSquare, Send,
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
  permissions: { title: "Permissions", description: "Define what each role can do." },
  news: { title: "News", description: "Create and publish announcements." },
  content: { title: "Site Content", description: "Edit hero copy, server info, and alerts." },
  status: { title: "Server Status", description: "Manually override the live status display." },
  tickets: { title: "Support Tickets", description: "Triage and reply to user tickets." },
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
    if (s === "roles") { if (location.pathname !== "/admin/roles") navigate("/admin/roles"); return; }
    if (s === "permissions") { navigate("/admin/permissions"); return; }
    if (location.pathname !== "/admin") navigate("/admin");
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
      {section === "tickets" && <TicketsAdminSection />}
      {section === "logs" && <LogsTab />}
      {section === "bot-dashboard" && <BotDashboardSection />}
      {section === "bot-management" && <BotManagementSection />}
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
    setPending((prev) => {
      const next = { ...prev };
      delete next[uid];
      return next;
    });
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
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground p-6 text-center">
              No members match your search.
            </div>
          )}
          {filtered.map((p) => {
            const ur = rolesFor(p.id);
            const taken = new Set(ur.map((r) => r.role));
            const available = ALL_ROLES.filter((r) => !taken.has(r.value as AppRole));
            return (
              <div key={p.id} className="p-4 rounded-lg bg-secondary/40 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.display_name ?? "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={pending[p.id] ?? undefined}
                      onValueChange={(v) => setPending({ ...pending, [p.id]: v as AppRole })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={available.length ? "Pick role..." : "All roles assigned"} />
                      </SelectTrigger>
                      <SelectContent>
                        {available.length === 0 ? (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">No more roles available</div>
                        ) : (
                          available.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => addRole(p.id)} disabled={!pending[p.id]}>
                      <Plus className="h-4 w-4 mr-1" />Add
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ur.length === 0 && <span className="text-xs text-muted-foreground">No roles assigned</span>}
                  {ur.map((r) => (
                    <Badge key={r.id} variant="outline" className="gap-1">
                      {roleLabel(r.role)}
                      <button onClick={() => removeRole(r.id)} className="ml-1 hover:text-destructive" aria-label={`Remove ${roleLabel(r.role)}`}>
                        <X className="h-3 w-3" />
                      </button>
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

const toLocalInput = (ms?: number) => {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [event, setEvent] = useState<{ label: string; targetMs: number | null }>({
    label: "Next Event Reset",
    targetMs: null,
  });

  useEffect(() => {
    supabase.from("site_content").select("*").then(({ data }) => {
      const map: any = {};
      (data ?? []).forEach((r: any) => (map[r.key] = r.value));
      if (map.hero) setHero(map.hero);
      if (map.server) setServer(map.server);
      if (map.alerts) setAlerts((a) => ({ ...a, ...map.alerts }));
      if (map.event) setEvent({ label: map.event.label ?? "Next Event Reset", targetMs: map.event.targetMs ?? null });
    });
  }, []);

  const save = async () => {
    if (event.targetMs && event.targetMs < Date.now()) {
      toast.error("Event date must be in the future");
      return;
    }
    if (!event.label.trim()) {
      toast.error("Event label cannot be empty");
      return;
    }
    const { error } = await supabase.from("site_content").upsert([
      { key: "hero", value: hero as any },
      { key: "server", value: server as any },
      { key: "alerts", value: alerts as any },
      { key: "event", value: event as any },
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
      <Card className="p-6 space-y-4 md:col-span-2">
        <h2 className="font-bold">Next event countdown</h2>
        <p className="text-sm text-muted-foreground">Powers the homepage countdown timer. Leave blank to use the default (next Saturday 8pm).</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Event label</Label>
            <Input
              value={event.label}
              maxLength={60}
              onChange={(e) => setEvent({ ...event, label: e.target.value })}
              placeholder="Next Event Reset"
            />
          </div>
          <div>
            <Label>Date & time (your local timezone)</Label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={toLocalInput(event.targetMs ?? undefined)}
                onChange={(e) => {
                  const v = e.target.value;
                  setEvent({ ...event, targetMs: v ? new Date(v).getTime() : null });
                }}
              />
              {event.targetMs && (
                <Button variant="outline" type="button" onClick={() => setEvent({ ...event, targetMs: null })}>Clear</Button>
              )}
            </div>
            {event.targetMs && (
              <p className="text-xs text-muted-foreground mt-1">Counts down to: {new Date(event.targetMs).toLocaleString()}</p>
            )}
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

const BOT_KEY = "discord_bot";

const BotDashboardSection = () => {
  const [cfg, setCfg] = useState<any>({ enabled: false, status: "offline", guildId: "", inviteUrl: "", announceChannelId: "", statusChannelId: "", welcomeMessage: "" });
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<Record<string, { ok: boolean; message: string }>>({});

  useEffect(() => {
    supabase.from("site_content").select("value").eq("key", BOT_KEY).maybeSingle()
      .then(({ data }) => data?.value && setCfg((c: any) => ({ ...c, ...(data.value as any) })));
  }, []);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("discord-bot-test", {
      body: { guildId: cfg.guildId || undefined },
    });
    setTesting(false);
    if (error) {
      setResult({ ok: false, error: error.message });
      toast.error("Connection test failed");
    } else {
      setResult(data);
      if (data?.ok) toast.success(`Connected as ${data.bot?.username}`);
      else toast.error(data?.error ?? "Test failed");
    }
  };

  const runAction = async (action: "announce" | "status" | "welcome") => {
    setBusy(action);
    const { data, error } = await supabase.functions.invoke("discord-bot-action", {
      body: { action },
    });
    setBusy(null);
    const payload = error ? { ok: false, message: error.message } : { ok: !!data?.ok, message: data?.ok ? data.message : (data?.error ?? "Failed") };
    setActionResults((r) => ({ ...r, [action]: payload }));
    if (payload.ok) toast.success(payload.message);
    else toast.error(payload.message);
  };

  const online = cfg.enabled && cfg.status === "online";
  const tests: { key: "announce" | "status" | "welcome"; label: string; desc: string; channel: string | undefined }[] = [
    { key: "announce", label: "Send test announcement", desc: "Posts an embed to the announcements channel.", channel: cfg.announceChannelId },
    { key: "status",   label: "Post server status",     desc: "Sends a live status embed to the status channel.", channel: cfg.statusChannelId },
    { key: "welcome",  label: "Preview welcome message", desc: "Renders the welcome template and posts it for preview.", channel: cfg.announceChannelId || cfg.statusChannelId },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Bot Status" value={online ? "Online" : cfg.enabled ? "Connecting" : "Disabled"} icon={Activity}
          color={online ? "bg-emerald-500" : cfg.enabled ? "bg-orange-500" : "bg-muted"} />
        <StatCard title="Guild ID" value={cfg.guildId || "—"} icon={ShieldCheck} color="bg-primary" />
        <StatCard title="Enabled" value={cfg.enabled ? "Yes" : "No"} icon={ShieldCheck} color={cfg.enabled ? "bg-sky-500" : "bg-muted"} />
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">Connection test</h2>
            <p className="text-sm text-muted-foreground">Verify the bot token and (optionally) guild access.</p>
          </div>
          <Button onClick={runTest} disabled={testing}>{testing ? "Testing..." : "Test Connection"}</Button>
        </div>
        {result && (
          <div className={`p-4 rounded-lg border ${result.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-destructive/40 bg-destructive/10"} space-y-2 text-sm`}>
            <div className="flex items-center gap-2">
              <Badge variant={result.ok ? "default" : "destructive"}>{result.ok ? "SUCCESS" : "FAILED"}</Badge>
              {result.ok
                ? <span>Authenticated as <span className="font-mono">{result.bot?.username}</span> (id {result.bot?.id})</span>
                : <span>{result.error}</span>}
            </div>
            {result.ok && result.guild && (
              <div className="text-muted-foreground">
                Guild: <span className="text-foreground">{result.guild.name}</span> ({result.guild.id})
                {typeof result.guild.memberCount === "number" && <> · ~{result.guild.memberCount} members</>}
              </div>
            )}
            {result.ok && result.guildError && <div className="text-orange-400">Warning: {result.guildError}</div>}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div>
          <h2 className="font-bold">Live channel tests</h2>
          <p className="text-sm text-muted-foreground">
            Send real Discord messages using the channel IDs and welcome template configured in Management.
          </p>
        </div>
        <div className="grid gap-3">
          {tests.map((t) => {
            const r = actionResults[t.key];
            const disabled = !!busy || !t.channel;
            return (
              <div key={t.key} className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border/50 bg-card/40">
                <div className="min-w-0">
                  <p className="font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                  <p className="text-xs mt-1">
                    Target channel:{" "}
                    {t.channel
                      ? <span className="font-mono text-foreground">{t.channel}</span>
                      : <span className="text-destructive">not configured</span>}
                  </p>
                  {r && (
                    <div className={`mt-2 text-xs ${r.ok ? "text-emerald-400" : "text-destructive"}`}>
                      {r.ok ? "✓ " : "✗ "}{r.message}
                    </div>
                  )}
                </div>
                <Button size="sm" onClick={() => runAction(t.key)} disabled={disabled}>
                  {busy === t.key ? "Sending..." : "Run test"}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-bold">About the Discord Bot</h2>
        <p className="text-sm text-muted-foreground">
          Configure your bot in the Management section. When enabled, it can sync with your ZyphoraMC server
          to deliver announcements, role assignments, and live server status to your Discord guild.
        </p>
        {cfg.inviteUrl && (
          <a href={cfg.inviteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
            Open invite link →
          </a>
        )}
      </Card>
    </div>
  );
};

const BotManagementSection = () => {
  const [cfg, setCfg] = useState({
    enabled: false,
    status: "offline" as "online" | "offline",
    guildId: "",
    inviteUrl: "",
    announceChannelId: "",
    statusChannelId: "",
    welcomeChannelId: "",
    welcomeMessage: "Welcome to ZyphoraMC, {user}!",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("site_content").select("value").eq("key", BOT_KEY).maybeSingle().then(({ data }) => {
      if (data?.value) setCfg((c) => ({ ...c, ...(data.value as any) }));
      setLoading(false);
    });
  }, []);

  const save = async () => {
    const { error } = await supabase.from("site_content").upsert([{ key: BOT_KEY, value: cfg as any }]);
    if (error) return toast.error(error.message);
    toast.success("Bot settings saved");
  };

  if (loading) return <Card className="p-6 text-sm text-muted-foreground">Loading...</Card>;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <h2 className="font-bold">General</h2>
        <div className="flex items-center gap-2">
          <Switch checked={cfg.enabled} onCheckedChange={(c) => setCfg({ ...cfg, enabled: c })} />
          <Label>Enable Discord bot</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={cfg.status === "online"} onCheckedChange={(c) => setCfg({ ...cfg, status: c ? "online" : "offline" })} />
          <Label>Mark as online</Label>
        </div>
        <div><Label>Guild ID</Label><Input value={cfg.guildId} onChange={(e) => setCfg({ ...cfg, guildId: e.target.value })} /></div>
        <div><Label>Bot invite URL</Label><Input value={cfg.inviteUrl} onChange={(e) => setCfg({ ...cfg, inviteUrl: e.target.value })} /></div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-bold">Channels & Messages</h2>
        <div><Label>Announcements channel ID</Label><Input value={cfg.announceChannelId} onChange={(e) => setCfg({ ...cfg, announceChannelId: e.target.value })} /></div>
        <div><Label>Server status channel ID</Label><Input value={cfg.statusChannelId} onChange={(e) => setCfg({ ...cfg, statusChannelId: e.target.value })} /></div>
        <div>
          <Label>Welcome channel ID</Label>
          <Input value={cfg.welcomeChannelId} onChange={(e) => setCfg({ ...cfg, welcomeChannelId: e.target.value })} placeholder="Channel where new members are greeted" />
        </div>
        <div>
          <Label>Welcome message</Label>
          <Textarea rows={3} value={cfg.welcomeMessage} onChange={(e) => setCfg({ ...cfg, welcomeMessage: e.target.value })} />
          <p className="text-xs text-muted-foreground mt-1">Use <code>{"{user}"}</code> as a placeholder for the new member.</p>
        </div>
      </Card>

      <div className="md:col-span-2"><Button onClick={save}>Save bot settings</Button></div>
    </div>
  );
};

// ============== Tickets admin ==============
type AdminTicket = {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  category: string | null;
  status: "open" | "in_progress" | "waiting_user" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  updated_at: string;
};
type AdminMsg = { id: string; ticket_id: string; author_id: string; is_staff: boolean; body: string; created_at: string };

const TICKET_STATUSES: AdminTicket["status"][] = ["open", "in_progress", "waiting_user", "closed"];

const TicketsAdminSection = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, { display_name: string | null }>>({});
  const [filter, setFilter] = useState<"all" | AdminTicket["status"]>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMsg[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    const list = (data ?? []) as AdminTicket[];
    setTickets(list);
    const ids = Array.from(new Set(list.map((t) => t.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
      const map: Record<string, { display_name: string | null }> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = { display_name: p.display_name }; });
      setProfilesById(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    supabase.from("support_ticket_messages").select("*").eq("ticket_id", selectedId).order("created_at")
      .then(({ data }) => setMessages((data ?? []) as AdminMsg[]));
  }, [selectedId]);

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  const updateStatus = async (id: string, status: AdminTicket["status"]) => {
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Status: ${status}`);
    load();
  };
  const updatePriority = async (id: string, priority: AdminTicket["priority"]) => {
    const { error } = await supabase.from("support_tickets").update({ priority }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const sendReply = async () => {
    if (!selected || !user || !reply.trim()) return;
    setSending(true);
    const { error } = await supabase.from("support_ticket_messages").insert({
      ticket_id: selected.id,
      author_id: user.id,
      is_staff: true,
      body: reply.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setReply("");
    // Auto-set status to waiting_user
    if (selected.status === "open") await updateStatus(selected.id, "waiting_user");
    const { data } = await supabase.from("support_ticket_messages").select("*").eq("ticket_id", selected.id).order("created_at");
    setMessages((data ?? []) as AdminMsg[]);
  };

  const deleteTicket = async (id: string) => {
    if (!confirm("Delete this ticket and all its messages?")) return;
    const { error } = await supabase.from("support_tickets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (selectedId === id) setSelectedId(null);
    load();
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tickets.length, open: 0, in_progress: 0, waiting_user: 0, closed: 0 };
    tickets.forEach((t) => { c[t.status]++; });
    return c;
  }, [tickets]);

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-4">
      <Card className="p-3 max-h-[78vh] overflow-y-auto">
        <div className="flex flex-wrap gap-1 mb-3">
          {(["all", ...TICKET_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`text-[11px] uppercase tracking-wider px-2 py-1 rounded border transition ${filter === s ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {s.replace("_", " ")} ({counts[s] ?? 0})
            </button>
          ))}
        </div>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground text-center">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">No tickets in this view.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => {
              const active = selectedId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left p-3 rounded-lg border transition ${active ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-secondary/30"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-semibold text-sm truncate">{t.subject}</div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{t.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{t.body}</div>
                  <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider flex justify-between">
                    <span>{profilesById[t.user_id]?.display_name ?? t.user_id.slice(0, 8)}</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <div>
        {!selected ? (
          <Card className="p-12 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-primary/60" />
            <p>Select a ticket to view and reply.</p>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-4 border-b">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  #{selected.id.slice(0, 8)} · {selected.category ?? "General"} · From {profilesById[selected.user_id]?.display_name ?? selected.user_id.slice(0, 8)}
                </div>
                <h2 className="text-xl font-bold">{selected.subject}</h2>
                <div className="text-xs text-muted-foreground mt-1">Opened {new Date(selected.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selected.status} onValueChange={(v: any) => updateStatus(selected.id, v)}>
                  <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selected.priority} onValueChange={(v: any) => updatePriority(selected.id, v)}>
                  <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["low", "normal", "high", "urgent"] as const).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTicket(selected.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              <div className="rounded-lg p-4 border bg-secondary/40">
                <div className="text-xs font-bold uppercase tracking-wider mb-1">User · {new Date(selected.created_at).toLocaleString()}</div>
                <div className="text-sm whitespace-pre-wrap break-words">{selected.body}</div>
              </div>
              {messages.map((m) => (
                <div key={m.id} className={`rounded-lg p-4 border ${m.is_staff ? "bg-primary/10 border-primary/40" : "bg-secondary/40"}`}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                    {m.is_staff ? <span className="text-primary">Staff</span> : "User"}
                    <span className="text-muted-foreground font-normal">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t space-y-2">
              <Label>Staff reply</Label>
              <Textarea rows={4} maxLength={4000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to the user…" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => updateStatus(selected.id, "closed")}>Close ticket</Button>
                <Button size="sm" onClick={sendReply} disabled={sending || !reply.trim()}>
                  <Send className="h-4 w-4 mr-2" /> Send reply
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;
