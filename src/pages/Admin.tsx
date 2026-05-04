import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/site/Navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, ShieldCheck, ShieldOff } from "lucide-react";

type Profile = { id: string; display_name: string | null; mc_username: string | null; created_at: string };
type RoleRow = { user_id: string; role: "admin" | "user" };
type News = { id: string; title: string; slug: string; excerpt: string | null; content: string; published: boolean; created_at: string };

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <NoAccess />;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage ZyphoraMC users, content and server status.</p>
        </div>
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="content">Site Content</TabsTrigger>
            <TabsTrigger value="status">Server Status</TabsTrigger>
            <TabsTrigger value="logs">Admin Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
          <TabsContent value="news" className="mt-6"><NewsTab /></TabsContent>
          <TabsContent value="content" className="mt-6"><ContentTab /></TabsContent>
          <TabsContent value="status" className="mt-6"><StatusTab /></TabsContent>
          <TabsContent value="logs" className="mt-6"><LogsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const NoAccess = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <ShieldOff className="h-12 w-12 text-destructive" />
    <h1 className="text-2xl font-bold">Access denied</h1>
    <p className="text-muted-foreground">You don't have admin permissions.</p>
  </div>
);

const UsersTab = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
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
      if (map.alerts) setAlerts({ ...alerts, ...map.alerts });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

export default Admin;
