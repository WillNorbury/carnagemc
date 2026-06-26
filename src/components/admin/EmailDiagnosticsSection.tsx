import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

type Candidate = {
  input: string;
  email: string | null;
  allowedInList: boolean;
  domainVerified: boolean;
  reason: string;
};

type Failure = {
  id: string;
  recipient: string;
  status: string;
  error_message: string | null;
  template_name: string | null;
  created_at: string;
};

type DiagnosticsResponse = {
  ok: boolean;
  sender_domain?: string;
  from_domain?: string;
  allowed_from?: string[];
  candidate?: Candidate | null;
  recent_failures?: Failure[];
  invalid_from_failures?: Failure[];
  warnings?: string[];
  error?: string;
};

export const EmailDiagnosticsSection = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [candidate, setCandidate] = useState("");

  const run = useCallback(async (from?: string) => {
    setLoading(true);
    try {
      const path = from ? `?from=${encodeURIComponent(from)}` : "";
      const { data: res, error } = await supabase.functions.invoke<DiagnosticsResponse>(
        `email-diagnostics${path}`,
        { method: "GET" },
      );
      if (error) {
        setData({ ok: false, error: error.message });
      } else {
        setData(res ?? { ok: false, error: "No response" });
      }
    } catch (e) {
      setData({ ok: false, error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const ok = data?.ok;
  const cand = data?.candidate ?? null;
  const candOk = cand && cand.allowedInList && cand.domainVerified;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Email diagnostics
            </CardTitle>
            <CardDescription>
              Verifies the <code>notify.carnagemc.net</code> sender domain configuration and From-address allowlist.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => run(candidate || undefined)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!data && loading && (
            <div className="text-sm text-muted-foreground">Running checks…</div>
          )}

          {data && !ok && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Diagnostics failed</AlertTitle>
              <AlertDescription>{data.error}</AlertDescription>
            </Alert>
          )}

          {data && ok && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">Verified sender subdomain</div>
                  <div className="font-mono">{data.sender_domain}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground">Display From domain</div>
                  <div className="font-mono">{data.from_domain}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Allowed From addresses</div>
                <div className="flex flex-wrap gap-2">
                  {data.allowed_from?.map((f) => (
                    <Badge key={f} variant="secondary" className="font-mono">{f}</Badge>
                  ))}
                </div>
              </div>

              {(data.warnings?.length ?? 0) > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5">
                      {data.warnings!.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check a From address</CardTitle>
          <CardDescription>
            Paste a full From string (e.g. <code>Name &lt;user@notify.carnagemc.net&gt;</code>) to see whether it will be accepted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="William @ CarnageMC <william@notify.carnagemc.net>"
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
            />
            <Button onClick={() => run(candidate)} disabled={!candidate.trim() || loading}>
              Check
            </Button>
          </div>

          {cand && (
            <Alert variant={candOk ? "default" : "destructive"}>
              {candOk ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>{candOk ? "Address is allowed" : "Address will be rejected"}</AlertTitle>
              <AlertDescription className="space-y-1">
                <div className="font-mono text-xs break-all">{cand.input}</div>
                <div className="text-sm">{cand.reason}</div>
                <div className="flex gap-2 pt-1">
                  <Badge variant={cand.domainVerified ? "default" : "destructive"}>
                    Domain {cand.domainVerified ? "verified" : "unverified"}
                  </Badge>
                  <Badge variant={cand.allowedInList ? "default" : "destructive"}>
                    {cand.allowedInList ? "Whitelisted" : "Not whitelisted"}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {data?.recent_failures && data.recent_failures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent send failures (last 7 days)</CardTitle>
            <CardDescription>Most recent 10 failed or DLQ emails.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {data.recent_failures.map((f) => (
                <div key={f.id} className="rounded-md border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono">{f.recipient}</span>
                    <Badge variant="destructive">{f.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {f.template_name ?? "—"} · {new Date(f.created_at).toLocaleString()}
                  </div>
                  {f.error_message && (
                    <div className="text-xs text-destructive mt-1 break-all">{f.error_message}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailDiagnosticsSection;
