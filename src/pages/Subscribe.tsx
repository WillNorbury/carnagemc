import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type State = "idle" | "submitting" | "done" | "error" | "signed-out";

async function sendReauthEmail(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.reauthenticate();
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to send confirmation email" };
  }
}

export default function Subscribe() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [subscribedEmail, setSubscribedEmail] = useState<string>("");
  const [reauthSent, setReauthSent] = useState(false);
  const [reauthError, setReauthError] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) setState("signed-out");
    else if (user) setState("idle");
  }, [user, loading]);

  async function confirm() {
    setState("submitting");
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-subscribe", {
        body: {},
      });
      if (error) {
        if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
          throw new Error("Your session expired. Please sign in again.");
        }
        throw new Error(error.message ?? "Failed to subscribe");
      }
      if (!data?.success) {
        throw new Error(data?.error ?? "Failed to subscribe");
      }
      setSubscribedEmail(data.email ?? user?.email ?? "");
      setState("done");
    } catch (e: any) {
      setState("error");
      setMessage(e?.message ?? "Network error");
    }
  }

  return (
    <main className="container mx-auto p-6 max-w-lg">
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
        <CardContent className="space-y-6">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}

          {state === "signed-out" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Sign in to manage your email subscription.</p>
              <Button onClick={() => nav("/auth")}>Sign in</Button>
            </div>
          )}

          {state === "idle" && user && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Re-subscribe <strong className="text-foreground">{user.email}</strong> to CarnageMC email notifications including news, updates, applications and ticket replies.
              </p>
              <Button onClick={confirm} className="w-full sm:w-auto">
                Subscribe to emails
              </Button>
            </div>
          )}

          {state === "submitting" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Subscribing…
            </div>
          )}

          {state === "done" && (
            <Alert className="border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <AlertTitle className="text-emerald-600 font-semibold">You're subscribed!</AlertTitle>
              <AlertDescription className="text-emerald-700/80 mt-1">
                <span className="block">{subscribedEmail} is now re-subscribed to CarnageMC emails.</span>
                <span className="block mt-1">You'll receive notifications for news, updates, applications and ticket replies.</span>
              </AlertDescription>
            </Alert>
          )}

          {state === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
                <AlertTitle className="text-red-600 font-semibold">Subscription failed</AlertTitle>
                <AlertDescription className="text-red-700/80 mt-1">
                  {message || "Something went wrong. Please try again."}
                </AlertDescription>
              </Alert>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setState("idle")}>Try again</Button>
                {message?.includes("session") && (
                  <Button onClick={() => nav("/auth")}>Sign in</Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
            <Link
              to="/unsubscribe"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Unsubscribe instead <ArrowRight className="h-3 w-3" />
            </Link>
            <span className="text-muted-foreground/30 hidden sm:inline">|</span>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              <Settings className="h-3 w-3" /> Notification preferences
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
