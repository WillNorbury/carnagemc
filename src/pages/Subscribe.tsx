import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type State = "idle" | "submitting" | "done" | "error" | "signed-out";

export default function Subscribe() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) setState("signed-out");
    else if (user) setState("idle");
  }, [user, loading]);

  async function confirm() {
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-subscribe", {
        body: {},
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Failed to subscribe");
      setState("done");
    } catch (e: any) {
      setState("error");
      setMessage(e?.message ?? "Network error");
    }
  }

  return (
    <main className="container mx-auto p-6 max-w-md">
      <Helmet>
        <title>Subscribe to emails — CarnageMC</title>
        <meta name="description" content="Re-subscribe to CarnageMC email notifications for news, updates and applications." />
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Email subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <p className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          )}
          {state === "signed-out" && (
            <>
              <p className="text-muted-foreground">Sign in to manage your email subscription.</p>
              <Button onClick={() => nav("/auth")}>Sign in</Button>
            </>
          )}
          {state === "idle" && user && (
            <>
              <p>
                Re-subscribe <strong>{user.email}</strong> to CarnageMC email notifications
                (news, updates, applications and ticket replies)?
              </p>
              <Button onClick={confirm}>Subscribe to emails</Button>
            </>
          )}
          {state === "submitting" && (
            <p className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Working…
            </p>
          )}
          {state === "done" && (
            <p className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" /> You're subscribed — welcome back!
            </p>
          )}
          {state === "error" && (
            <>
              <p className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" /> {message || "Something went wrong."}
              </p>
              <Button variant="outline" onClick={() => setState("idle")}>Try again</Button>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Want to stop receiving emails instead? Use the unsubscribe link in any email or visit{" "}
            <Link to="/" className="underline">your profile</Link> to fine-tune notification preferences.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
