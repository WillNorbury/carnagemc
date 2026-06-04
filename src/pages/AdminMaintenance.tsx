import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Wrench, X, UserPlus, Search } from "lucide-react";
import { ALL_ROLES, roleLabel } from "@/lib/roles";

type Config = {
  enabled: boolean;
  title: string;
  message: string;
  allowed_roles: string[];
  allowed_user_ids: string[];
};

const DEFAULT: Config = {
  enabled: false,
  title: "We'll be right back",
  message: "HavocSMP is undergoing scheduled maintenance. Check back soon!",
  allowed_roles: [],
  allowed_user_ids: [],
};

type Profile = { id: string; display_name: string | null; mc_username: string | null };

const AdminMaintenance = () => {
  const { user, isAdmin, loading } = useAuth();
  const [cfg, setCfg] = useState<Config>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [allowedProfiles, setAllowedProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    document.title = "Maintenance — Admin · HavocSMP";
    supabase
      .from("site_content")
      .select("value")
      .eq("key", "maintenance")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setCfg({ ...DEFAULT, ...(data.value as any) });
      });
  }, []);

  // Hydrate profile info for allowlisted user IDs
  useEffect(() => {
    const ids = cfg.allowed_user_ids ?? [];
    if (ids.length === 0) {
      setAllowedProfiles([]);
      return;
    }
    supabase
      .from("profiles")
      .select("id,display_name,mc_username")
      .in("id", ids)
      .then(({ data }) => setAllowedProfiles((data as Profile[]) ?? []));
  }, [cfg.allowed_user_ids]);

  // Search profiles
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,mc_username")
        .or(`display_name.ilike.%${q}%,mc_username.ilike.%${q}%`)
        .limit(8);
      setResults((data as Profile[]) ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const toggleRole = (role: string) => {
    const has = cfg.allowed_roles.includes(role);
    setCfg({
      ...cfg,
      allowed_roles: has ? cfg.allowed_roles.filter((r) => r !== role) : [...cfg.allowed_roles, role],
    });
  };

  const addUser = (p: Profile) => {
    if (cfg.allowed_user_ids.includes(p.id)) return;
    setCfg({ ...cfg, allowed_user_ids: [...cfg.allowed_user_ids, p.id] });
    setSearch("");
    setResults([]);
  };

  const removeUser = (id: string) => {
    setCfg({ ...cfg, allowed_user_ids: cfg.allowed_user_ids.filter((u) => u !== id) });
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "maintenance", value: cfg as any });
    if (error) toast.error(error.message);
    else toast.success(cfg.enabled ? "Maintenance mode ON" : "Maintenance mode OFF");
    setSaving(false);
  };

  const profileLabel = (p: Profile) =>
    p.display_name || p.mc_username || p.id.slice(0, 8);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Back to admin</Link>
          </Button>
          <h1 className="text-3xl font-bold">Maintenance Mode</h1>
          <p className="text-muted-foreground">Take the site offline for everyone except admins and your allowlist.</p>
        </div>

        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
            <Wrench className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Enable maintenance mode</div>
              <div className="text-xs text-muted-foreground">
                Visitors see a branded maintenance page. Admins, allowed roles, and allowed users keep full access.
              </div>
            </div>
            <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
          </div>

          <div>
            <Label>Title</Label>
            <Input value={cfg.title} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              value={cfg.message}
              onChange={(e) => setCfg({ ...cfg, message: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Allowed roles</Label>
            <p className="text-xs text-muted-foreground">Anyone with one of these roles can browse during maintenance.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {ALL_ROLES.map((r) => {
                const checked = cfg.allowed_roles.includes(r.value);
                return (
                  <label
                    key={r.value}
                    className="flex items-center gap-2 rounded-md border px-2 py-1.5 cursor-pointer hover:bg-accent"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleRole(r.value)} />
                    <span className="text-sm">{r.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Allowed users</Label>
            <p className="text-xs text-muted-foreground">Whitelist individual accounts by name.</p>
            {allowedProfiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {allowedProfiles.map((p) => (
                  <Badge key={p.id} variant="secondary" className="gap-1 pl-2 pr-1">
                    {profileLabel(p)}
                    <button
                      onClick={() => removeUser(p.id)}
                      className="ml-1 rounded hover:bg-background/40 p-0.5"
                      aria-label={`Remove ${profileLabel(p)}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players by name or MC username…"
                className="pl-9"
              />
              {(results.length > 0 || searching) && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-64 overflow-auto">
                  {searching && <div className="p-2 text-xs text-muted-foreground">Searching…</div>}
                  {results.map((p) => {
                    const already = cfg.allowed_user_ids.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        disabled={already}
                        onClick={() => addUser(p)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
                      >
                        <span>{profileLabel(p)}</span>
                        {already ? (
                          <span className="text-xs text-muted-foreground">added</span>
                        ) : (
                          <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                  {!searching && results.length === 0 && search.trim().length >= 2 && (
                    <div className="p-2 text-xs text-muted-foreground">No matches.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default AdminMaintenance;
