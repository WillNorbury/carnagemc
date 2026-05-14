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
  Trash2,
  Plus,
  ShieldCheck,
  ShieldOff,
  Users as UsersIcon,
  Newspaper,
  Activity,
  Server as ServerIcon,
  X,
  Ticket as TicketIcon,
  MessageSquare,
  Send,
  Check,
  ChevronDown,
  Puzzle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminLayout, type AdminSection } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { ALL_ROLES, roleLabel, isStaffRole, type AppRole } from "@/lib/roles";
import { usePermissions } from "@/lib/usePermissions";

type Profile = { id: string; display_name: string | null; mc_username: string | null; created_at: string };
type RoleRow = { id: string; user_id: string; role: AppRole };
type News = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  published: boolean;
  created_at: string;
};

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
  plugins: { title: "Plugins", description: "Add, edit, and remove server plugins." },
  changelog: { title: "Changelog", description: "Publish server updates by date and category." },
  applications: { title: "Applications", description: "Review staff, builder, and content creator applications." },
  "bot-dashboard": {
    title: "Discord Bot — Dashboard",
    description: "Status and overview of the ZyphoraMC Discord bot.",
  },
  "bot-management": { title: "Discord Bot — Management", description: "Configure commands and bot integration." },
};

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const { roles: userRoles } = usePermissions();
  const isOwner = userRoles.includes("owner");
  const location = useLocation();
  const navigate = useNavigate();
  const initial: AdminSection = location.pathname.endsWith("/roles")
    ? "roles"
    : location.pathname.endsWith("/permissions")
      ? "permissions"
      : location.pathname.endsWith("/changelog")
        ? "changelog"
        : location.pathname.endsWith("/applications")
          ? "applications"
          : "dashboard";
  const [section, setSection] = useState<AdminSection>(initial);

  const onNavigate = (s: AdminSection) => {
    setSection(s);
    if (s === "roles") {
      if (location.pathname !== "/admin/roles") navigate("/admin/roles");
      return;
    }
    if (s === "permissions") {
      navigate("/admin/permissions");
      return;
    }
    if (s === "changelog") {
      navigate("/admin/changelog");
      return;
    }
    if (s === "applications") {
      navigate("/admin/applications");
      return;
    }
    if (location.pathname !== "/admin") navigate("/admin");
  };

  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShieldOff className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-muted-foreground">You don't have admin permissions.</p>
      </div>
    );

  const meta = sectionMeta[section];

  return (
    <AdminLayout current={section} onNavigate={onNavigate} title={meta.title} description={meta.description} isOwner={isOwner}>
      {section === "dashboard" && <DashboardSection onNavigate={onNavigate} />}
      {section === "users" && <UsersTab />}
      {section === "roles" && <RolesSection />}
      {section === "news" && <NewsTab />}
      {section === "content" && <ContentTab />}
      {section === "status" && <StatusTab />}
      {section === "tickets" && <TicketsAdminSection />}
      {section === "logs" && <LogsTab />}
      {section === "logs" && <LogsTab />}
      {section === "plugins" && <PluginsTab />}
      {section === "changelog" && <ChangelogTab />}
      {section === "applications" && <ApplicationsTab />}
      {section === "bot-dashboard" && (isOwner ? <BotDashboardSection /> : (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <ShieldOff className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Access denied</h2>
          <p className="text-muted-foreground">Only the owner can access this section.</p>
        </div>
      ))}
      {section === "bot-management" && (isOwner ? <BotManagementSection /> : (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <ShieldOff className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Access denied</h2>
          <p className="text-muted-foreground">Only the owner can access this section.</p>
        </div>
      ))}
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
            <h2 className="font-bold flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent admin checks
            </h2>
            <p className="text-xs text-muted-foreground">Latest 5 entries</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onNavigate("logs")}>
            View all
          </Button>
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
  const [creating, setCreating] = useState(false);
  const [newRoles, setNewRoles] = useState<Set<AppRole>>(new Set());
  const [roleSearch, setRoleSearch] = useState("");
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    display_name: "",
    mc_username: "",
  });
  const [search, setSearch] = useState("");
  const [staffOnly, setStaffOnly] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    setProfiles((p ?? []) as Profile[]);
    setRoles((r ?? []) as RoleRow[]);
  };
  useEffect(() => {
    load();
  }, []);

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

  const createUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error("Email and password required");
      return;
    }
    if (newUser.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { ...newUser, roles: [...newRoles] },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("User created");
      setNewUser({ email: "", password: "", display_name: "", mc_username: "" });
      setNewRoles(new Set());
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const toggleNewRole = (r: AppRole) => {
    setNewRoles((s) => {
      const n = new Set(s);
      if (n.has(r)) n.delete(r);
      else n.add(r);
      return n;
    });
  };

  return (
    <TooltipProvider delayDuration={150}>
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="font-bold mb-4">Create User</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <Label>Display Name (optional)</Label>
            <Input
              value={newUser.display_name}
              onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
            />
          </div>
          <div>
            <Label>MC Username (optional)</Label>
            <Input
              value={newUser.mc_username}
              onChange={(e) => setNewUser({ ...newUser, mc_username: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4">
          <Label className="mb-2 block">Roles</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal">
                <span className="truncate text-left">
                  {newRoles.size === 0
                    ? "Select roles..."
                    : [...newRoles].map((r) => roleLabel(r)).join(", ")}
                </span>
                <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <Input
                autoFocus
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Search roles..."
                className="h-8 mb-2"
              />
              <div className="max-h-72 overflow-y-auto space-y-1">
                {ALL_ROLES.filter(
                  (r) =>
                    r.value !== "default" &&
                    r.label.toLowerCase().includes(roleSearch.toLowerCase()),
                ).map((r) => {
                  const active = newRoles.has(r.value);
                  return (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => toggleNewRole(r.value)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm text-left"
                    >
                      <Checkbox checked={active} />
                      <span className="flex-1">{r.label}</span>
                      {active && <Check className="h-3.5 w-3.5 opacity-70" />}
                    </button>
                  );
                })}
                {ALL_ROLES.filter(
                  (r) =>
                    r.value !== "default" &&
                    r.label.toLowerCase().includes(roleSearch.toLowerCase()),
                ).length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-3">No roles match</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground mt-2">
            "Default" is always granted automatically.
          </p>
        </div>
        <div className="flex items-center justify-end mt-4">
          <Button onClick={createUser} disabled={creating}>
            <Plus className="h-4 w-4 mr-1" />
            {creating ? "Creating..." : "Create User"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-bold">Users ({profiles.length})</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, MC username, ID..."
              className="h-9 w-64"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Checkbox
                checked={staffOnly}
                onCheckedChange={(v) => setStaffOnly(v === true)}
              />
              Staff only
            </label>
          </div>
        </div>
        <div className="space-y-2">
          {profiles
            .filter((p) => {
              const userRoles = roles.filter((r) => r.user_id === p.id);
              if (staffOnly && !userRoles.some((r) => isStaffRole(r.role))) return false;
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return (
                (p.display_name ?? "").toLowerCase().includes(q) ||
                (p.mc_username ?? "").toLowerCase().includes(q) ||
                p.id.toLowerCase().includes(q)
              );
            })
            .map((p) => {
              const staffRolesForUser = roles
                .filter((r) => r.user_id === p.id && isStaffRole(r.role))
                .map((r) => roleLabel(r.role));
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                  <div>
                    <div className="font-medium">{p.display_name ?? "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {staffRolesForUser.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="border-primary/40 text-primary bg-primary/10 cursor-help"
                          >
                            Staff
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {staffRolesForUser.join(", ")}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {isAdminFor(p.id) && <Badge>Admin</Badge>}
                    <Button size="sm" variant="outline" onClick={() => toggleAdmin(p.id)}>
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      {isAdminFor(p.id) ? "Demote" : "Promote"}
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
    </TooltipProvider>
  );
};

const RolesSection = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Set<AppRole>>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);

  // Bulk-across-users state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAdd, setBulkAdd] = useState<Set<AppRole>>(new Set());
  const [bulkRemove, setBulkRemove] = useState<Set<AppRole>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, mc_username, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    setProfiles((p ?? []) as Profile[]);
    setRoles((r ?? []) as RoleRow[]);
    setDrafts({});
  };
  useEffect(() => {
    load();
  }, []);

  const rolesFor = (uid: string) => roles.filter((r) => r.user_id === uid);
  const currentSetFor = (uid: string) => new Set(rolesFor(uid).map((r) => r.role));
  const draftFor = (uid: string) => drafts[uid] ?? currentSetFor(uid);

  const toggleDraftRole = (uid: string, role: AppRole) => {
    setDrafts((d) => {
      const base = new Set(d[uid] ?? currentSetFor(uid));
      if (base.has(role)) base.delete(role);
      else base.add(role);
      return { ...d, [uid]: base };
    });
  };

  const resetDraft = (uid: string) => {
    setDrafts((d) => {
      const next = { ...d };
      delete next[uid];
      return next;
    });
  };

  const isDirty = (uid: string) => {
    const draft = drafts[uid];
    if (!draft) return false;
    const cur = currentSetFor(uid);
    if (draft.size !== cur.size) return true;
    for (const r of draft) if (!cur.has(r)) return true;
    return false;
  };

  const saveUser = async (uid: string) => {
    const draft = drafts[uid];
    if (!draft) return;
    const cur = currentSetFor(uid);
    const toAdd = [...draft].filter((r) => !cur.has(r));
    const toRemove = [...cur].filter((r) => !draft.has(r));
    if (toAdd.length === 0 && toRemove.length === 0) return;

    setSavingUid(uid);
    try {
      if (toAdd.length) {
        const { error } = await supabase.from("user_roles").insert(toAdd.map((role) => ({ user_id: uid, role })));
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).in("role", toRemove);
        if (error) throw error;
      }
      toast.success(`Updated ${toAdd.length + toRemove.length} role${toAdd.length + toRemove.length === 1 ? "" : "s"}`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update roles");
    } finally {
      setSavingUid(null);
    }
  };

  const filtered = useMemo(
    () =>
      profiles.filter(
        (p) => !search || (p.display_name ?? "").toLowerCase().includes(search.toLowerCase()) || p.id.includes(search),
      ),
    [profiles, search],
  );

  const toggleSelectUser = (uid: string) => {
    setSelectedUsers((s) => {
      const next = new Set(s);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };
  const selectAllVisible = () => setSelectedUsers(new Set(filtered.map((p) => p.id)));
  const clearSelection = () => setSelectedUsers(new Set());

  const toggleBulk = (set: Set<AppRole>, setFn: (s: Set<AppRole>) => void, role: AppRole) => {
    const next = new Set(set);
    if (next.has(role)) next.delete(role);
    else next.add(role);
    setFn(next);
  };

  const applyBulk = async () => {
    if (selectedUsers.size === 0) return toast.error("No users selected");
    if (bulkAdd.size === 0 && bulkRemove.size === 0) return toast.error("Pick roles to add or remove");
    setBulkSaving(true);
    try {
      let added = 0,
        removed = 0;
      for (const uid of selectedUsers) {
        const cur = currentSetFor(uid);
        const toAdd = [...bulkAdd].filter((r) => !cur.has(r));
        const toRemove = [...bulkRemove].filter((r) => cur.has(r));
        if (toAdd.length) {
          const { error } = await supabase.from("user_roles").insert(toAdd.map((role) => ({ user_id: uid, role })));
          if (error) throw error;
          added += toAdd.length;
        }
        if (toRemove.length) {
          const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).in("role", toRemove);
          if (error) throw error;
          removed += toRemove.length;
        }
      }
      toast.success(
        `Bulk update: +${added} / −${removed} across ${selectedUsers.size} user${selectedUsers.size === 1 ? "" : "s"}`,
      );
      setBulkAdd(new Set());
      setBulkRemove(new Set());
      setSelectedUsers(new Set());
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Bulk update failed");
    } finally {
      setBulkSaving(false);
    }
  };

  const RolePicker = ({
    label,
    selected,
    onToggle,
    exclude,
  }: {
    label: string;
    selected: Set<AppRole>;
    onToggle: (r: AppRole) => void;
    exclude?: Set<AppRole>;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {label}
          {selected.size > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5">
              {selected.size}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {ALL_ROLES.map((r) => {
            const disabled = exclude?.has(r.value as AppRole);
            const checked = selected.has(r.value as AppRole);
            return (
              <button
                key={r.value}
                disabled={disabled}
                onClick={() => onToggle(r.value as AppRole)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent ${checked ? "bg-accent/50" : ""} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded border border-border bg-background">
                  {checked && <Check className="h-3 w-3 text-primary" />}
                </span>
                <span className="text-sm">{r.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-sm text-muted-foreground mb-2">Available roles</div>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((r) => (
            <Badge key={r.value} variant="secondary">
              {r.label}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Bulk-across-users bar */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-semibold">Bulk edit</div>
            <div className="text-xs text-muted-foreground">
              {selectedUsers.size} selected · pick roles to add or remove for all of them.
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={selectAllVisible}>
              Select visible
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection} disabled={selectedUsers.size === 0}>
              Clear
            </Button>
            <RolePicker
              label="Add roles"
              selected={bulkAdd}
              onToggle={(r) => toggleBulk(bulkAdd, setBulkAdd, r)}
              exclude={bulkRemove}
            />
            <RolePicker
              label="Remove roles"
              selected={bulkRemove}
              onToggle={(r) => toggleBulk(bulkRemove, setBulkRemove, r)}
              exclude={bulkAdd}
            />
            <Button
              size="sm"
              onClick={applyBulk}
              disabled={bulkSaving || selectedUsers.size === 0 || (bulkAdd.size === 0 && bulkRemove.size === 0)}
            >
              {bulkSaving ? "Applying..." : `Apply to ${selectedUsers.size}`}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="font-bold">Members ({profiles.length})</h2>
          <Input
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground p-6 text-center">No members match your search.</div>
          )}
          {filtered.map((p) => {
            const draft = draftFor(p.id);
            const dirty = isDirty(p.id);
            const cur = currentSetFor(p.id);
            const selected = selectedUsers.has(p.id);
            return (
              <div
                key={p.id}
                className={`p-4 rounded-lg bg-secondary/40 space-y-3 border ${selected ? "border-primary/60" : "border-transparent"}`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox checked={selected} onCheckedChange={() => toggleSelectUser(p.id)} />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.display_name ?? "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{p.id.slice(0, 8)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          Edit roles
                          <Badge variant="secondary" className="h-5 px-1.5">
                            {draft.size}
                          </Badge>
                          <ChevronDown className="h-3 w-3 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="end">
                        <div className="max-h-72 overflow-y-auto space-y-0.5">
                          {ALL_ROLES.map((r) => {
                            const checked = draft.has(r.value as AppRole);
                            return (
                              <button
                                key={r.value}
                                onClick={() => toggleDraftRole(p.id, r.value as AppRole)}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent ${checked ? "bg-accent/50" : ""}`}
                              >
                                <span className="flex h-4 w-4 items-center justify-center rounded border border-border bg-background">
                                  {checked && <Check className="h-3 w-3 text-primary" />}
                                </span>
                                <span className="text-sm">{r.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {dirty && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => resetDraft(p.id)}>
                          Reset
                        </Button>
                        <Button size="sm" onClick={() => saveUser(p.id)} disabled={savingUid === p.id}>
                          {savingUid === p.id ? "Saving..." : "Save"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {draft.size === 0 && <span className="text-xs text-muted-foreground">No roles assigned</span>}
                  {[...draft].map((role) => {
                    const isNew = !cur.has(role);
                    return (
                      <Badge
                        key={role}
                        variant="outline"
                        className={`gap-1 ${isNew ? "border-primary/60 text-primary" : ""}`}
                      >
                        {roleLabel(role)}
                        {isNew && <span className="text-[10px] opacity-70">new</span>}
                        <button
                          onClick={() => toggleDraftRole(p.id, role)}
                          className="ml-1 hover:text-destructive"
                          aria-label={`Remove ${roleLabel(role)}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                  {[...cur]
                    .filter((r) => !draft.has(r))
                    .map((role) => (
                      <Badge
                        key={`removed-${role}`}
                        variant="outline"
                        className="gap-1 border-destructive/40 text-destructive line-through opacity-70"
                      >
                        {roleLabel(role)}
                        <button
                          onClick={() => toggleDraftRole(p.id, role)}
                          className="ml-1 no-underline"
                          aria-label={`Restore ${roleLabel(role)}`}
                        >
                          <Plus className="h-3 w-3" />
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
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.title || !editing?.content) return toast.error("Title and content required");
    const slug = (editing.slug || editing.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 60);
    const payload = {
      title: editing.title,
      slug,
      excerpt: editing.excerpt ?? null,
      content: editing.content,
      published: editing.published ?? false,
    };
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
                <div className="text-xs text-muted-foreground">
                  {n.published ? "Published" : "Draft"} · {new Date(n.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(n)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(n.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {editing && (
        <Card className="p-6 space-y-4">
          <h2 className="font-bold">{editing.id ? "Edit" : "New"} post</h2>
          <div>
            <Label>Title</Label>
            <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </div>
          <div>
            <Label>Excerpt</Label>
            <Input
              value={editing.excerpt ?? ""}
              onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
            />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea
              rows={8}
              value={editing.content ?? ""}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!editing.published} onCheckedChange={(c) => setEditing({ ...editing, published: c })} />
            <Label>Published</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
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
  const [hero, setHero] = useState({ title: "", subtitle: "", badge: "", enabled: true });
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
  const [popup, setPopup] = useState({
    enabled: true,
    title: "Season 3 Launch — LIVE",
    description:
      "New map, fresh economy, and exclusive launch crates for early players. Join now and claim your founder's reward.",
    primaryLabel: "Copy IP",
    primaryUrl: "",
    secondaryLabel: "Later",
  });

  useEffect(() => {
    supabase
      .from("site_content")
      .select("*")
      .then(({ data }) => {
        const map: any = {};
        (data ?? []).forEach((r: any) => (map[r.key] = r.value));
        if (map.hero) setHero((h) => ({ ...h, ...map.hero, enabled: map.hero.enabled !== false }));
        if (map.server) setServer(map.server);
        if (map.alerts) setAlerts((a) => ({ ...a, ...map.alerts }));
        if (map.event) setEvent({ label: map.event.label ?? "Next Event Reset", targetMs: map.event.targetMs ?? null });
        if (map.popup) setPopup((p) => ({ ...p, ...map.popup }));
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
      { key: "popup", value: popup as any },
    ]);
    if (error) return toast.error(error.message);
    toast.success("Site content saved");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Hero</h2>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={hero.enabled} onCheckedChange={(v) => setHero({ ...hero, enabled: v })} />
            {hero.enabled ? "Enabled" : "Disabled"}
          </label>
        </div>
        <div>
          <Label>Title</Label>
          <Input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
        </div>
        <div>
          <Label>Subtitle</Label>
          <Textarea value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} />
        </div>
        <div>
          <Label>Badge</Label>
          <Input value={hero.badge} onChange={(e) => setHero({ ...hero, badge: e.target.value })} />
        </div>
      </Card>
      <Card className="p-6 space-y-4">
        <h2 className="font-bold">Server</h2>
        <div>
          <Label>IP</Label>
          <Input value={server.ip} onChange={(e) => setServer({ ...server, ip: e.target.value })} />
        </div>
        <div>
          <Label>Discord URL</Label>
          <Input value={server.discord} onChange={(e) => setServer({ ...server, discord: e.target.value })} />
        </div>
        <div>
          <Label>Version</Label>
          <Input value={server.version} onChange={(e) => setServer({ ...server, version: e.target.value })} />
        </div>
        <div>
          <Label>Tagline</Label>
          <Input value={server.tagline} onChange={(e) => setServer({ ...server, tagline: e.target.value })} />
        </div>
      </Card>
      <Card className="p-6 space-y-4 md:col-span-2">
        <h2 className="font-bold">Status alerts</h2>
        <p className="text-sm text-muted-foreground">
          Banners shown on the homepage when the live Minecraft server status changes.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Switch
                checked={alerts.onlineEnabled}
                onCheckedChange={(c) => setAlerts({ ...alerts, onlineEnabled: c })}
              />
              <Label>Notify when server goes ONLINE</Label>
            </div>
            <Textarea
              rows={2}
              value={alerts.onlineMessage}
              onChange={(e) => setAlerts({ ...alerts, onlineMessage: e.target.value })}
            />
          </div>
          <div className="space-y-3 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Switch
                checked={alerts.offlineEnabled}
                onCheckedChange={(c) => setAlerts({ ...alerts, offlineEnabled: c })}
              />
              <Label>Notify when server goes OFFLINE</Label>
            </div>
            <Textarea
              rows={2}
              value={alerts.offlineMessage}
              onChange={(e) => setAlerts({ ...alerts, offlineMessage: e.target.value })}
            />
          </div>
        </div>
      </Card>
      <Card className="p-6 space-y-4 md:col-span-2">
        <h2 className="font-bold">Next event countdown</h2>
        <p className="text-sm text-muted-foreground">
          Powers the homepage countdown timer. Leave blank to use the default (next Saturday 8pm).
        </p>
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
                <Button variant="outline" type="button" onClick={() => setEvent({ ...event, targetMs: null })}>
                  Clear
                </Button>
              )}
            </div>
            {event.targetMs && (
              <p className="text-xs text-muted-foreground mt-1">
                Counts down to: {new Date(event.targetMs).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </Card>
      <Card className="p-6 space-y-4 md:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">Homepage popup</h2>
            <p className="text-sm text-muted-foreground">The announcement modal shown to first-time visitors.</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={popup.enabled} onCheckedChange={(c) => setPopup({ ...popup, enabled: c })} />
            <Label>Enabled</Label>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Title</Label>
            <Input value={popup.title} onChange={(e) => setPopup({ ...popup, title: e.target.value })} />
          </div>
          <div>
            <Label>Primary button label</Label>
            <Input value={popup.primaryLabel} onChange={(e) => setPopup({ ...popup, primaryLabel: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={popup.description}
              onChange={(e) => setPopup({ ...popup, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Primary button URL (optional)</Label>
            <Input
              value={popup.primaryUrl}
              onChange={(e) => setPopup({ ...popup, primaryUrl: e.target.value })}
              placeholder="Leave blank to copy server IP"
            />
          </div>
          <div>
            <Label>Secondary (dismiss) button label</Label>
            <Input
              value={popup.secondaryLabel}
              onChange={(e) => setPopup({ ...popup, secondaryLabel: e.target.value })}
            />
          </div>
        </div>
      </Card>
      <div className="md:col-span-2">
        <Button onClick={save}>Save all</Button>
      </div>
    </div>
  );
};

const StatusTab = () => {
  const [s, setS] = useState({ online: true, players_online: 0, players_max: 500, motd: "" });
  useEffect(() => {
    supabase
      .from("server_status")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(
        ({ data }) =>
          data &&
          setS({
            online: data.online,
            players_online: data.players_online,
            players_max: data.players_max,
            motd: data.motd ?? "",
          }),
      );
  }, []);
  const save = async () => {
    const { error } = await supabase.from("server_status").update(s).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
  };
  return (
    <Card className="p-6 space-y-4 max-w-xl">
      <div className="flex items-center gap-2">
        <Switch checked={s.online} onCheckedChange={(c) => setS({ ...s, online: c })} />
        <Label>Server online</Label>
      </div>
      <div>
        <Label>Players online</Label>
        <Input
          type="number"
          value={s.players_online}
          onChange={(e) => setS({ ...s, players_online: +e.target.value })}
        />
      </div>
      <div>
        <Label>Max players</Label>
        <Input type="number" value={s.players_max} onChange={(e) => setS({ ...s, players_max: +e.target.value })} />
      </div>
      <div>
        <Label>MOTD</Label>
        <Input value={s.motd} onChange={(e) => setS({ ...s, motd: e.target.value })} />
      </div>
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
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [scope]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Admin role check logs</h2>
        <div className="flex gap-2">
          <Button size="sm" variant={scope === "mine" ? "default" : "outline"} onClick={() => setScope("mine")}>
            My checks
          </Button>
          <Button size="sm" variant={scope === "all" ? "default" : "outline"} onClick={() => setScope("all")}>
            All (admin)
          </Button>
          <Button size="sm" variant="ghost" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-auto">
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No logs yet. Reload pages that check admin access to generate entries.
          </p>
        )}
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
  const [cfg, setCfg] = useState<any>({
    enabled: false,
    status: "offline",
    guildId: "",
    inviteUrl: "",
    announceChannelId: "",
    statusChannelId: "",
    rolesChannelId: "1498961753457954847",
    welcomeMessage: "",
  });
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<Record<string, { ok: boolean; message: string }>>({});

  useEffect(() => {
    supabase
      .from("site_content")
      .select("value")
      .eq("key", BOT_KEY)
      .maybeSingle()
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
    const payload = error
      ? { ok: false, message: error.message }
      : { ok: !!data?.ok, message: data?.ok ? data.message : (data?.error ?? "Failed") };
    setActionResults((r) => ({ ...r, [action]: payload }));
    if (payload.ok) toast.success(payload.message);
    else toast.error(payload.message);
  };

  const online = cfg.enabled && cfg.status === "online";
  const tests: { key: "announce" | "status" | "welcome"; label: string; desc: string; channel: string | undefined }[] =
    [
      {
        key: "announce",
        label: "Send test announcement",
        desc: "Posts an embed to the announcements channel.",
        channel: cfg.announceChannelId,
      },
      {
        key: "status",
        label: "Post server status",
        desc: "Sends a live status embed to the status channel.",
        channel: cfg.statusChannelId,
      },
      {
        key: "welcome",
        label: "Preview welcome message",
        desc: "Renders the welcome template and posts it for preview.",
        channel: cfg.announceChannelId || cfg.statusChannelId,
      },
    ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Bot Status"
          value={online ? "Online" : cfg.enabled ? "Connecting" : "Disabled"}
          icon={Activity}
          color={online ? "bg-emerald-500" : cfg.enabled ? "bg-orange-500" : "bg-muted"}
        />
        <StatCard title="Guild ID" value={cfg.guildId || "—"} icon={ShieldCheck} color="bg-primary" />
        <StatCard
          title="Enabled"
          value={cfg.enabled ? "Yes" : "No"}
          icon={ShieldCheck}
          color={cfg.enabled ? "bg-sky-500" : "bg-muted"}
        />
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">Connection test</h2>
            <p className="text-sm text-muted-foreground">Verify the bot token and (optionally) guild access.</p>
          </div>
          <Button onClick={runTest} disabled={testing}>
            {testing ? "Testing..." : "Test Connection"}
          </Button>
        </div>
        {result && (
          <div
            className={`p-4 rounded-lg border ${result.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-destructive/40 bg-destructive/10"} space-y-2 text-sm`}
          >
            <div className="flex items-center gap-2">
              <Badge variant={result.ok ? "default" : "destructive"}>{result.ok ? "SUCCESS" : "FAILED"}</Badge>
              {result.ok ? (
                <span>
                  Authenticated as <span className="font-mono">{result.bot?.username}</span> (id {result.bot?.id})
                </span>
              ) : (
                <span>{result.error}</span>
              )}
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
              <div
                key={t.key}
                className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border/50 bg-card/40"
              >
                <div className="min-w-0">
                  <p className="font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                  <p className="text-xs mt-1">
                    Target channel:{" "}
                    {t.channel ? (
                      <span className="font-mono text-foreground">{t.channel}</span>
                    ) : (
                      <span className="text-destructive">not configured</span>
                    )}
                  </p>
                  {r && (
                    <div className={`mt-2 text-xs ${r.ok ? "text-emerald-400" : "text-destructive"}`}>
                      {r.ok ? "✓ " : "✗ "}
                      {r.message}
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
          Configure your bot in the Management section. When enabled, it can sync with your ZyphoraMC server to deliver
          announcements, role assignments, and live server status to your Discord guild.
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
    supabase
      .from("site_content")
      .select("value")
      .eq("key", BOT_KEY)
      .maybeSingle()
      .then(({ data }) => {
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
          <Switch
            checked={cfg.status === "online"}
            onCheckedChange={(c) => setCfg({ ...cfg, status: c ? "online" : "offline" })}
          />
          <Label>Mark as online</Label>
        </div>
        <div>
          <Label>Guild ID</Label>
          <Input value={cfg.guildId} onChange={(e) => setCfg({ ...cfg, guildId: e.target.value })} />
        </div>
        <div>
          <Label>Bot invite URL</Label>
          <Input value={cfg.inviteUrl} onChange={(e) => setCfg({ ...cfg, inviteUrl: e.target.value })} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-bold">Channels & Messages</h2>
        <div>
          <Label>Announcements channel ID</Label>
          <Input
            value={cfg.announceChannelId}
            onChange={(e) => setCfg({ ...cfg, announceChannelId: e.target.value })}
          />
        </div>
        <div>
          <Label>Server status channel ID</Label>
          <Input value={cfg.statusChannelId} onChange={(e) => setCfg({ ...cfg, statusChannelId: e.target.value })} />
        </div>
        <div>
          <Label>Welcome channel ID</Label>
          <Input
            value={cfg.welcomeChannelId}
            onChange={(e) => setCfg({ ...cfg, welcomeChannelId: e.target.value })}
            placeholder="Channel where new members are greeted"
          />
        </div>
        <div>
          <Label>Welcome message</Label>
          <Textarea
            rows={3}
            value={cfg.welcomeMessage}
            onChange={(e) => setCfg({ ...cfg, welcomeMessage: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use <code>{"{user}"}</code> as a placeholder for the new member.
          </p>
        </div>
      </Card>

      <div className="md:col-span-2">
        <Button onClick={save}>Save bot settings</Button>
      </div>
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
type AdminMsg = {
  id: string;
  ticket_id: string;
  author_id: string;
  is_staff: boolean;
  body: string;
  created_at: string;
};

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
      (profs ?? []).forEach((p: any) => {
        map[p.id] = { display_name: p.display_name };
      });
      setProfilesById(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", selectedId)
      .order("created_at")
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
    const { data } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", selected.id)
      .order("created_at");
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
    tickets.forEach((t) => {
      c[t.status]++;
    });
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
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {t.status.replace("_", " ")}
                    </Badge>
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
                  #{selected.id.slice(0, 8)} · {selected.category ?? "General"} · From{" "}
                  {profilesById[selected.user_id]?.display_name ?? selected.user_id.slice(0, 8)}
                </div>
                <h2 className="text-xl font-bold">{selected.subject}</h2>
                <div className="text-xs text-muted-foreground mt-1">
                  Opened {new Date(selected.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selected.status} onValueChange={(v: any) => updateStatus(selected.id, v)}>
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selected.priority} onValueChange={(v: any) => updatePriority(selected.id, v)}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["low", "normal", "high", "urgent"] as const).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteTicket(selected.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              <div className="rounded-lg p-4 border bg-secondary/40">
                <div className="text-xs font-bold uppercase tracking-wider mb-1">
                  User · {new Date(selected.created_at).toLocaleString()}
                </div>
                <div className="text-sm whitespace-pre-wrap break-words">{selected.body}</div>
              </div>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-4 border ${m.is_staff ? "bg-primary/10 border-primary/40" : "bg-secondary/40"}`}
                >
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
              <Textarea
                rows={4}
                maxLength={4000}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply to the user…"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => updateStatus(selected.id, "closed")}>
                  Close ticket
                </Button>
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

type PluginRow = {
  id: string;
  short_id: string;
  name: string;
  description: string | null;
  long_description: string | null;
  version: string | null;
  author: string | null;
  download_url: string | null;
  icon_url: string | null;
  category: string | null;
  platform: string | null;
  tags: string[];
  featured: boolean;
  published: boolean;
  created_at: string;
  jar_path: string | null;
  jar_filename: string | null;
  jar_size: number | null;
  screenshots: string[];
};

const emptyPluginForm = {
  name: "",
  description: "",
  long_description: "",
  version: "",
  author: "",
  download_url: "",
  icon_url: "",
  category: "",
  platform: "",
  tags: "",
  featured: false,
  published: true,
  jar_path: "" as string,
  jar_filename: "" as string,
  jar_size: 0 as number,
  screenshots: [] as string[],
};

const formatBytes = (b: number) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const PluginsTab = () => {
  const [plugins, setPlugins] = useState<PluginRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPluginForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("plugins").select("*").order("created_at", { ascending: false });
    setPlugins((data ?? []) as PluginRow[]);
  };
  useEffect(() => {
    load();
  }, []);

  const startEdit = (p: PluginRow) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      long_description: p.long_description ?? "",
      version: p.version ?? "",
      author: p.author ?? "",
      download_url: p.download_url ?? "",
      icon_url: p.icon_url ?? "",
      category: p.category ?? "",
      platform: p.platform ?? "",
      tags: (p.tags ?? []).join(", "),
      featured: p.featured,
      published: p.published,
      jar_path: p.jar_path ?? "",
      jar_filename: p.jar_filename ?? "",
      jar_size: p.jar_size ?? 0,
      screenshots: p.screenshots ?? [],
    });
  };

  const reset = () => {
    setEditingId(null);
    setForm(emptyPluginForm);
  };

  const [uploading, setUploading] = useState(false);

  const onJarSelected = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".jar")) {
      return toast.error("Please select a .jar file");
    }
    setUploading(true);
    try {
      // Remove old jar if replacing
      if (form.jar_path) {
        await supabase.storage.from("plugin-jars").remove([form.jar_path]);
      }
      const path = `${crypto.randomUUID()}/${file.name}`;
      const { error } = await supabase.storage
        .from("plugin-jars")
        .upload(path, file, { contentType: "application/java-archive", upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("plugin-jars").getPublicUrl(path);
      setForm((f) => ({
        ...f,
        jar_path: path,
        jar_filename: file.name,
        jar_size: file.size,
        download_url: pub.publicUrl,
      }));
      toast.success("JAR uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeJar = async () => {
    if (!form.jar_path) return;
    if (!confirm("Remove the uploaded JAR?")) return;
    await supabase.storage.from("plugin-jars").remove([form.jar_path]);
    setForm((f) => ({ ...f, jar_path: "", jar_filename: "", jar_size: 0, download_url: "" }));
    toast.success("JAR removed");
  };

  const [uploadingShot, setUploadingShot] = useState(false);

  const onScreenshotsSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingShot(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`Skipped ${file.name}: not an image`);
          continue;
        }
        const path = `${crypto.randomUUID()}/${file.name}`;
        const { error } = await supabase.storage
          .from("plugin-screenshots")
          .upload(path, file, { contentType: file.type || "image/png", upsert: false });
        if (error) {
          toast.error(error.message);
          continue;
        }
        const { data: pub } = supabase.storage.from("plugin-screenshots").getPublicUrl(path);
        urls.push(pub.publicUrl);
      }
      if (urls.length) {
        setForm((f) => ({ ...f, screenshots: [...f.screenshots, ...urls] }));
        toast.success(`Added ${urls.length} screenshot${urls.length > 1 ? "s" : ""}`);
      }
    } finally {
      setUploadingShot(false);
    }
  };

  const removeScreenshot = (url: string) => {
    setForm((f) => ({ ...f, screenshots: f.screenshots.filter((u) => u !== url) }));
  };

  const [uploadingIcon, setUploadingIcon] = useState(false);

  const onIconSelected = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");
    setUploadingIcon(true);
    try {
      const path = `icons/${crypto.randomUUID()}/${file.name}`;
      const { error } = await supabase.storage
        .from("plugin-screenshots")
        .upload(path, file, { contentType: file.type || "image/png", upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("plugin-screenshots").getPublicUrl(path);
      setForm((f) => ({ ...f, icon_url: pub.publicUrl }));
      toast.success("Icon uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploadingIcon(false);
    }
  };

  const removeIcon = () => setForm((f) => ({ ...f, icon_url: "" }));

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      long_description: form.long_description.trim() || null,
      version: form.version.trim() || null,
      author: form.author.trim() || null,
      download_url: form.download_url.trim() || null,
      icon_url: form.icon_url.trim() || null,
      category: form.category.trim() || null,
      platform: form.platform.trim() || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      featured: form.featured,
      published: form.published,
      jar_path: form.jar_path || null,
      jar_filename: form.jar_filename || null,
      jar_size: form.jar_size || null,
      screenshots: form.screenshots,
    };
    const { error } = editingId
      ? await supabase.from("plugins").update(payload).eq("id", editingId)
      : await supabase.from("plugins").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Plugin updated" : "Plugin added");
    reset();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this plugin?")) return;
    const target = plugins.find((p) => p.id === id);
    if (target?.jar_path) {
      await supabase.storage.from("plugin-jars").remove([target.jar_path]);
    }
    const { error } = await supabase.from("plugins").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Plugin deleted");
    if (editingId === id) reset();
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Puzzle className="h-4 w-4" /> {editingId ? "Edit plugin" : "Add plugin"}
          </h2>
          {editingId && (
            <Button size="sm" variant="ghost" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Version</Label>
              <Input
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="1.0.0"
              />
            </div>
            <div>
              <Label>Author</Label>
              <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Economy, PvP, ..."
              />
            </div>
            <div>
              <Label>Platform</Label>
              <Input
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                placeholder="Bukkit, Spigot, Paper"
              />
            </div>
          </div>
          <div>
            <Label>Short description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Long description</Label>
            <Textarea
              rows={5}
              value={form.long_description}
              onChange={(e) => setForm({ ...form, long_description: e.target.value })}
            />
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
            <Label>Icon</Label>
            {form.icon_url ? (
              <div className="flex items-center gap-3 rounded-md bg-background p-2 border border-border">
                <img src={form.icon_url} alt="" className="h-12 w-12 rounded object-cover border border-border" />
                <div className="flex-1 min-w-0 text-xs text-muted-foreground truncate font-mono">{form.icon_url}</div>
                <Button asChild size="sm" variant="outline">
                  <label className="cursor-pointer">
                    Replace
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        onIconSelected(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </Button>
                <Button size="sm" variant="ghost" onClick={removeIcon}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button asChild variant="outline" disabled={uploadingIcon} className="w-full">
                <label className="cursor-pointer">
                  {uploadingIcon ? "Uploading..." : "Upload icon (.png)"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      onIconSelected(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">PNG, JPG, or WebP. Square images look best.</p>
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
            <Label>Plugin JAR file</Label>
            {form.jar_filename ? (
              <div className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 border border-border">
                <div className="min-w-0">
                  <div className="text-sm font-mono truncate">{form.jar_filename}</div>
                  <div className="text-xs text-muted-foreground">{formatBytes(form.jar_size)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button asChild size="sm" variant="outline">
                    <label className="cursor-pointer">
                      Replace
                      <input
                        type="file"
                        accept=".jar,application/java-archive"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && onJarSelected(e.target.files[0])}
                      />
                    </label>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={removeJar}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button asChild variant="outline" disabled={uploading} className="w-full">
                <label className="cursor-pointer">
                  {uploading ? "Uploading..." : "Upload .jar file"}
                  <input
                    type="file"
                    accept=".jar,application/java-archive"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onJarSelected(e.target.files[0])}
                  />
                </label>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Max 100 MB. The download URL is filled automatically when you upload.
            </p>
            <div className="text-xs font-mono text-primary/80 pt-1">
              Download filename:{" "}
              {(() => {
                const sanitize = (s: string) => s.trim().replace(/\s+/g, "-");
                const parts = [
                  sanitize(form.name) || "Plugin",
                  sanitize(form.platform) || "Platform",
                  sanitize(form.version) || "Version",
                ];
                return `${parts.join("-")}.jar`;
              })()}
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
            <Label>Screenshots</Label>
            {form.screenshots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.screenshots.map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="" className="w-full h-20 object-cover rounded border border-border" />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(url)}
                      className="absolute top-1 right-1 bg-background/90 border border-border rounded p-1 opacity-0 group-hover:opacity-100 transition"
                      aria-label="Remove screenshot"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button asChild variant="outline" disabled={uploadingShot} className="w-full">
              <label className="cursor-pointer">
                {uploadingShot ? "Uploading..." : "Upload screenshots (.png)"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onScreenshotsSelected(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG, or WebP. You can upload multiple at once.</p>
          </div>
          <div>
            <Label>Tags (comma separated)</Label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="pvp, economy"
            />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              Published
            </label>
          </div>
          <Button onClick={submit} disabled={saving} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> {editingId ? "Save changes" : "Add plugin"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-4">All plugins ({plugins.length})</h2>
        <div className="space-y-2 max-h-[700px] overflow-y-auto">
          {plugins.length === 0 && <p className="text-sm text-muted-foreground">No plugins yet.</p>}
          {plugins.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/40">
              <div className="flex items-center gap-3 min-w-0">
                {p.icon_url ? (
                  <img src={p.icon_url} alt="" className="h-9 w-9 rounded object-cover border border-border" />
                ) : (
                  <div className="h-9 w-9 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Puzzle className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {p.name}
                    {!p.published && (
                      <Badge variant="outline" className="text-xs">
                        draft
                      </Badge>
                    )}
                    {p.featured && <Badge className="text-xs">featured</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    #{p.short_id}
                    {p.version ? ` · v${p.version}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Admin;

// ============= Changelog Tab =============
type ChangelogRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string | null;
  entry_date: string;
  published: boolean;
  created_at: string;
};

const CHANGELOG_CATS = ["server", "feature", "update", "fix", "balance", "security", "addition"];
const emptyChangelog = {
  id: "",
  title: "",
  content: "",
  category: "",
  version: "",
  entry_date: new Date().toISOString().slice(0, 10),
  published: true,
};

const ChangelogTab = () => {
  const [items, setItems] = useState<ChangelogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<typeof emptyChangelog | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("changelog_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as ChangelogRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    const payload = {
      title: editing.title.trim(),
      content: editing.content.trim(),
      category: editing.category,
      version: editing.version.trim() || null,
      entry_date: editing.entry_date,
      published: editing.published,
    };
    const { error } = editing.id
      ? await supabase.from("changelog_entries").update(payload).eq("id", editing.id)
      : await supabase.from("changelog_entries").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Entry updated" : "Entry created");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this changelog entry?")) return;
    const { error } = await supabase.from("changelog_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ ...emptyChangelog })}>
          <Plus className="h-4 w-4 mr-1" /> New entry
        </Button>
      </div>

      {editing && (
        <Card className="p-6 space-y-4 border-primary/40">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Added new boss arena"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANGELOG_CATS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Version (optional)</Label>
              <Input
                value={editing.version}
                onChange={(e) => setEditing({ ...editing, version: e.target.value })}
                placeholder="1.2.0"
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={editing.entry_date}
                onChange={(e) => setEditing({ ...editing, entry_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Content</Label>
            <Textarea
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              rows={6}
              placeholder="Describe what changed..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} />
            <Label className="m-0">Published</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No changelog entries yet.</Card>
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <Card key={e.id} className="p-4 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className="capitalize">
                    {e.category}
                  </Badge>
                  {e.version && (
                    <Badge variant="secondary" className="font-mono">
                      v{e.version}
                    </Badge>
                  )}
                  {!e.published && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Draft
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{new Date(e.entry_date).toLocaleDateString()}</span>
                </div>
                <div className="font-display font-bold">{e.title}</div>
                <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{e.content}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditing({
                      id: e.id,
                      title: e.title,
                      content: e.content,
                      category: e.category,
                      version: e.version ?? "",
                      entry_date: e.entry_date,
                      published: e.published,
                    })
                  }
                >
                  Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(e.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ============= Applications Tab =============
type ApplicationRow = {
  id: string;
  user_id: string;
  type: "staff" | "builder" | "youtuber";
  status: "pending" | "approved" | "rejected";
  mc_username: string;
  discord: string | null;
  age: number | null;
  timezone: string | null;
  experience: string | null;
  why: string;
  portfolio_url: string | null;
  reviewer_notes: string | null;
  created_at: string;
};

const ApplicationsTab = () => {
  const [items, setItems] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as ApplicationRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("applications")
      .update({
        status,
        reviewer_notes: notes || null,
        reviewed_by: u?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Application ${status}`);
    setOpen(null);
    setNotes("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const statusCls = (s: ApplicationRow["status"]) =>
    s === "approved"
      ? "text-emerald-400 border-emerald-400/40"
      : s === "rejected"
        ? "text-destructive border-destructive/40"
        : "text-amber-400 border-amber-400/40";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f} {f !== "all" && `(${items.filter((i) => i.status === f).length})`}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No applications.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const isOpen = open === a.id;
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className="capitalize">
                        {a.type}
                      </Badge>
                      <Badge variant="outline" className={statusCls(a.status)}>
                        {a.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                    <div className="font-display font-bold">{a.mc_username}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.discord && <>Discord: {a.discord} · </>}
                      {a.age && <>Age: {a.age} · </>}
                      {a.timezone && <>TZ: {a.timezone}</>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOpen(isOpen ? null : a.id);
                        setNotes(a.reviewer_notes ?? "");
                      }}
                    >
                      {isOpen ? "Close" : "Review"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    {a.experience && (
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Experience</div>
                        <p className="text-sm whitespace-pre-wrap">{a.experience}</p>
                      </div>
                    )}
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Why</div>
                      <p className="text-sm whitespace-pre-wrap">{a.why}</p>
                    </div>
                    {a.portfolio_url && (
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Portfolio</div>
                        <a
                          href={a.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline break-all"
                        >
                          {a.portfolio_url}
                        </a>
                      </div>
                    )}
                    <div>
                      <Label>Reviewer notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Internal notes..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => decide(a.id, "rejected")}>
                        Reject
                      </Button>
                      <Button onClick={() => decide(a.id, "approved")}>Approve</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
