import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null, user: null, isAdmin: false, loading: true, signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async (uid: string | undefined, ctx: string) => {
      if (!uid) { setIsAdmin(false); return; }
      const { data, error } = await supabase.rpc("check_is_admin_logged", {
        _context: ctx,
        _user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) console.error("[auth] admin check failed:", error);
      console.log("[auth] admin check", { uid, ctx, isAdmin: data });
      setIsAdmin(!!data);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((e, s) => {
      setSession(s);
      setTimeout(() => { checkRole(s?.user?.id, `auth-event:${e}`); }, 0);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      await checkRole(session?.user?.id, "init");
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAdmin,
        loading,
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
