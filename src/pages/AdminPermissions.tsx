import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ShieldOff, Save, RotateCcw, Search, Info, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ALL_ROLES, roleLabel, isStaffRole, type AppRole } from "@/lib/roles";
import {
  PERMISSION_CATALOG,
  ALL_PERMISSION_KEYS,
  DEFAULT_PERMISSIONS,
  type PermissionMatrix,
} from "@/lib/permissions";
import { usePermissionMatrix, savePermissionMatrix, usePermissions } from "@/lib/usePermissions";

const AdminPermissions = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { matrix: stored, loading: matrixLoading } = usePermissionMatrix();
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { document.title = "Permissions — ZyphoraMC Admin"; }, []);

  useEffect(() => {
    if (!matrixLoading) {
      // Normalize: ensure every role has an array.
      const next: PermissionMatrix = {};
      for (const r of ALL_ROLES) next[r.value as AppRole] = [...(stored[r.value as AppRole] ?? [])];
      setMatrix(next);
    }
  }, [matrixLoading, stored]);

  const has = (role: AppRole, key: string) => (matrix[role] ?? []).includes(key);

  const toggle = (role: AppRole, key: string) => {
    setMatrix((m) => {
      const list = new Set(m[role] ?? []);
      if (list.has(key)) list.delete(key); else list.add(key);
      return { ...m, [role]: Array.from(list) };
    });
    setDirty(true);
  };

  const setAllForRole = (role: AppRole, on: boolean) => {
    setMatrix((m) => ({ ...m, [role]: on ? [...ALL_PERMISSION_KEYS] : [] }));
    setDirty(true);
  };

  const setAllForPerm = (key: string, on: boolean) => {
    setMatrix((m) => {
      const next: PermissionMatrix = { ...m };
      for (const r of ALL_ROLES) {
        const list = new Set(next[r.value as AppRole] ?? []);
        if (on) list.add(key); else list.delete(key);
        next[r.value as AppRole] = Array.from(list);
      }
      return next;
    });
    setDirty(true);
  };

  const resetDefaults = () => {
    if (!confirm("Reset all permissions to defaults? Unsaved changes will be lost.")) return;
    const next: PermissionMatrix = {};
    for (const r of ALL_ROLES) next[r.value as AppRole] = [...(DEFAULT_PERMISSIONS[r.value as AppRole] ?? [])];
    setMatrix(next);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await savePermissionMatrix(matrix);
      toast.success("Permissions saved");
      setDirty(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PERMISSION_CATALOG;
    return PERMISSION_CATALOG
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter((p) =>
          p.label.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          g.group.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.permissions.length > 0);
  }, [search]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <ShieldOff className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="text-muted-foreground">You don't have admin permissions.</p>
    </div>
  );

  return (
    <AdminLayout
      current={"dashboard" as any}
      onNavigate={(s) => { if (s === "dashboard") navigate("/admin"); else if (s === "roles") navigate("/admin/roles"); else navigate("/admin"); }}
      title="Permissions"
      description="Define what each role is allowed to do across the admin panel and app."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />Reset defaults
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </Button>
        </div>
      }
    >
      <Card className="p-4 flex items-start gap-3 bg-secondary/30">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          These permissions control what each role can <strong>see and do in the UI</strong>. The
          underlying database still requires the <Badge variant="outline" className="mx-1">admin</Badge>
          role for sensitive writes — assign it to anyone who needs full backend access.
        </div>
      </Card>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {dirty && <Badge variant="outline" className="border-primary/50 text-primary">Unsaved changes</Badge>}
      </div>

      <Card className="p-0 overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[900px]">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-secondary/40 sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 font-medium w-[280px] border-b">Permission</th>
                  {ALL_ROLES.map((r) => (
                    <th key={r.value} className="p-2 font-medium text-center border-b min-w-[80px]">
                      <div className="text-xs flex flex-col items-center gap-1">
                        <span>{r.label}</span>
                        {isStaffRole(r.value) && (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                            Staff
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((g) => (
                  <>
                    <tr key={`g-${g.group}`} className="bg-secondary/20">
                      <td colSpan={ALL_ROLES.length + 1} className="p-2 px-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b">
                        {g.group}
                      </td>
                    </tr>
                    {g.permissions.map((p) => {
                      const allOn = ALL_ROLES.every((r) => has(r.value as AppRole, p.key));
                      return (
                        <tr key={p.key} className="hover:bg-secondary/20 border-b border-border/50">
                          <td className="p-3">
                            <div className="font-medium">{p.label}</div>
                            <div className="text-xs text-muted-foreground">{p.description}</div>
                            <button
                              onClick={() => setAllForPerm(p.key, !allOn)}
                              className="text-[10px] text-primary/80 hover:text-primary mt-1"
                            >
                              {allOn ? "Clear all" : "Grant to all"}
                            </button>
                          </td>
                          {ALL_ROLES.map((r) => (
                            <td key={r.value} className="text-center p-2">
                              <Checkbox
                                checked={has(r.value as AppRole, p.key)}
                                onCheckedChange={() => toggle(r.value as AppRole, p.key)}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </>
                ))}
                <tr className="bg-secondary/30">
                  <td className="p-3 text-xs text-muted-foreground">Bulk actions per role</td>
                  {ALL_ROLES.map((r) => {
                    const list = matrix[r.value as AppRole] ?? [];
                    const allOn = list.length === ALL_PERMISSION_KEYS.length;
                    return (
                      <td key={r.value} className="text-center p-2">
                        <button
                          onClick={() => setAllForRole(r.value as AppRole, !allOn)}
                          className="text-[10px] text-primary/80 hover:text-primary"
                        >
                          {allOn ? "None" : "All"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">Summary</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_ROLES.map((r) => {
            const count = (matrix[r.value as AppRole] ?? []).length;
            return (
              <div key={r.value} className="flex items-center justify-between p-2 rounded bg-secondary/30">
                <span className="text-sm flex items-center gap-2">
                  {roleLabel(r.value)}
                  {isStaffRole(r.value) && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                      Staff
                    </span>
                  )}
                </span>
                <Badge variant="secondary">{count} / {ALL_PERMISSION_KEYS.length}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </AdminLayout>
  );
};

export default AdminPermissions;
