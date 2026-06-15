import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "validating" | "ready" | "already" | "invalid" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("validating");
  const [email, setEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: SUPABASE_ANON },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { setState("invalid"); setMessage(data.error ?? "Invalid link"); return; }
        if (data.alreadyUnsubscribed) { setState("already"); setEmail(data.email ?? null); return; }
        setEmail(data.email ?? null);
        setState("ready");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function confirm() {
    setState("submitting");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON },
        body: JSON.stringify({ token }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setState("error"); setMessage(data.error ?? "Could not unsubscribe"); return; }
      setState("done");
    } catch {
      setState("error");
      setMessage("Network error");
    }
  }

  return (
    <main className="container mx-auto p-6 max-w-md">
      <Helmet><title>Unsubscribe — HavocSMP</title></Helmet>
      <Card>
        <CardHeader><CardTitle>Email preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {state === "validating" && (
            <p className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking link…</p>
          )}
          {state === "ready" && (
            <>
              <p>Unsubscribe <strong>{email}</strong> from HavocSMP emails?</p>
              <Button onClick={confirm}>Confirm unsubscribe</Button>
            </>
          )}
          {state === "submitting" && (
            <p className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Working…</p>
          )}
          {state === "done" && (
            <p className="flex items-center gap-2 text-emerald-500"><CheckCircle2 className="h-5 w-5" /> You've been unsubscribed.</p>
          )}
          {state === "already" && (
            <p className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-5 w-5" /> {email ?? "This address"} is already unsubscribed.</p>
          )}
          {(state === "invalid" || state === "error") && (
            <p className="flex items-center gap-2 text-destructive"><XCircle className="h-5 w-5" /> {message || "This unsubscribe link is invalid or has expired."}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
