import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Wrench, Shield } from "lucide-react";
import logo from "@/assets/xylo-logo.png";

type Config = {
  enabled: boolean;
  title?: string;
  message?: string;
  allowed_roles?: string[];
  allowed_user_ids?: string[];
};

const ALLOW = ["/auth", "/admin", "/status"];

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [cfg, setCfg] = useState<Config>({ enabled: false });
  const [loaded, setLoaded] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const { isAdmin, user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "maintenance")
        .maybeSingle();
      if (cancelled) return;
      const v = (data?.value as Config) || { enabled: false };
      setCfg(v);
      setLoaded(true);
    };
    load();
    const channel = supabase
      .channel("maintenance-config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content", filter: "key=eq.maintenance" },
        () => load()
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUserRoles([]);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => setUserRoles((data ?? []).map((r: any) => r.role)));
  }, [user]);

  if (!loaded) return null;

  const allowedRoles = cfg.allowed_roles ?? [];
  const allowedUsers = cfg.allowed_user_ids ?? [];
  const roleAllowed = userRoles.some((r) => allowedRoles.includes(r));
  const userAllowed = !!user && allowedUsers.includes(user.id);

  const bypass =
    isAdmin ||
    roleAllowed ||
    userAllowed ||
    ALLOW.includes(pathname) ||
    pathname.startsWith("/admin");

  if (!cfg.enabled || bypass) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.06]" />
      <div className="relative max-w-md text-center space-y-6">
        <img src={logo} alt="CarnageMC" className="h-20 w-20 mx-auto" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs uppercase tracking-widest">
          <Wrench className="h-3 w-3" /> Maintenance
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black">
          {cfg.title || "We'll be right back"}
        </h1>
        <p className="text-muted-foreground whitespace-pre-wrap">
          {cfg.message || "CarnageMC is undergoing scheduled maintenance. Check back soon!"}
        </p>
        {isAdmin && (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Shield className="h-3 w-3" /> You are bypassing as admin
          </div>
        )}
      </div>
    </div>
  );
}
