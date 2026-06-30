import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Terminal, Trash2 } from "lucide-react";

type LogLine = { kind: "in" | "out" | "err" | "sys"; text: string; ts: number };

const HELP = `Available commands:
  help                          Show this help
  clear                         Clear the console
  lookup <player>               Show punishment history for a player (name or UUID)
  recent [days]                 Latest punishments across all players (default 7 days)
  list <bans|mutes|kicks|warnings> [--active] [--player NAME] [--limit N]
  unban <id> [--loud]           Unban (silent by default). Add --loud to broadcast.
  unmute <id> [--loud]          Unmute (silent by default). Add --loud to broadcast.`;

const PROJECT_ID = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID as string;
const ENDPOINT = `https://${PROJECT_ID}.supabase.co/functions/v1/punishments-lookup`;

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const tok = data.session?.access_token;
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

function parseFlags(parts: string[]) {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith("--")) {
      const key = p.slice(2);
      const next = parts[i + 1];
      if (next && !next.startsWith("--")) { flags[key] = next; i++; } else { flags[key] = true; }
    } else positional.push(p);
  }
  return { flags, positional };
}

export const ConsoleAdminSection = () => {
  const [lines, setLines] = useState<LogLine[]>([
    { kind: "sys", text: "Owner Console — type `help` for commands.", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  const push = (l: Omit<LogLine, "ts">) => setLines((p) => [...p, { ...l, ts: Date.now() }]);

  const runCommand = async (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    push({ kind: "in", text: `> ${cmd}` });
    setHistory((h) => [...h, cmd]);
    setHistIdx(null);

    const parts = cmd.split(/\s+/);
    const head = parts[0].toLowerCase();
    const rest = parts.slice(1);

    if (head === "help" || head === "?") { push({ kind: "sys", text: HELP }); return; }
    if (head === "clear" || head === "cls") { setLines([]); return; }

    setBusy(true);
    try {
      const headers = { ...(await authHeaders()), "Content-Type": "application/json" };

      if (head === "lookup") {
        const player = rest[0];
        if (!player) { push({ kind: "err", text: "Usage: lookup <player>" }); return; }
        const r = await fetch(`${ENDPOINT}?player=${encodeURIComponent(player)}`, { headers });
        const j = await r.json();
        if (!r.ok) { push({ kind: "err", text: j?.error ?? `HTTP ${r.status}` }); return; }
        const c = j.counts ?? {};
        push({ kind: "out", text:
          `Player: ${j.player?.username ?? "?"} (${j.player?.uuid ?? "?"})\n` +
          `  bans=${c.bans ?? 0}  mutes=${c.mutes ?? 0}  kicks=${c.kicks ?? 0}  warnings=${c.warnings ?? 0}` });
        for (const k of ["bans","mutes","kicks","warnings"] as const) {
          for (const it of (j[k] ?? []).slice(0, 5)) {
            push({ kind: "out", text:
              `  [${k} #${it.id}] active=${it.active} by=${it.issued_by ?? "?"} reason="${it.reason ?? ""}" at=${it.issued_at ?? "?"}` });
          }
        }
        return;
      }

      if (head === "recent") {
        const days = Number(rest[0] ?? 7) || 7;
        const r = await fetch(`${ENDPOINT}?recent_days=${days}`, { headers });
        const j = await r.json();
        if (!r.ok) { push({ kind: "err", text: j?.error ?? `HTTP ${r.status}` }); return; }
        const c = j.counts ?? {};
        push({ kind: "out", text: `Last ${days}d: bans=${c.bans} mutes=${c.mutes} kicks=${c.kicks} warnings=${c.warnings}` });
        return;
      }

      if (head === "list") {
        const { flags, positional } = parseFlags(rest);
        const type = positional[0] ?? "bans";
        const body = {
          action: "list",
          type,
          active_only: !!flags.active,
          player: typeof flags.player === "string" ? flags.player : undefined,
          limit: flags.limit ? Number(flags.limit) : 25,
        };
        const r = await fetch(ENDPOINT, { method: "POST", headers, body: JSON.stringify(body) });
        const j = await r.json();
        if (!r.ok) { push({ kind: "err", text: j?.error ?? `HTTP ${r.status}` }); return; }
        push({ kind: "out", text: `${j.count} ${j.type} returned` });
        for (const it of j.items.slice(0, body.limit)) {
          push({ kind: "out", text:
            `  #${it.id}  ${it.username ?? it.uuid}  active=${it.active}  by=${it.issued_by ?? "?"}  reason="${it.reason ?? ""}"` });
        }
        return;
      }

      if (head === "unban" || head === "unmute") {
        const { flags, positional } = parseFlags(rest);
        const id = Number(positional[0]);
        if (!Number.isFinite(id) || id <= 0) { push({ kind: "err", text: `Usage: ${head} <id> [--loud]` }); return; }
        const silent = !flags.loud;
        const body = { action: head, id, silent };
        const r = await fetch(ENDPOINT, { method: "POST", headers, body: JSON.stringify(body) });
        const j = await r.json();
        if (!r.ok) { push({ kind: "err", text: j?.error ?? `HTTP ${r.status}` }); return; }
        push({ kind: "out", text: `OK — ${head} id=${id} silent=${silent} removed_by=${j.removed_by}` });
        return;
      }

      push({ kind: "err", text: `Unknown command: ${head} — type 'help'` });
    } catch (e: any) {
      push({ kind: "err", text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !busy) {
      const v = input;
      setInput("");
      runCommand(v);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === null) return;
      const i = histIdx + 1;
      if (i >= history.length) { setHistIdx(null); setInput(""); }
      else { setHistIdx(i); setInput(history[i]); }
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Terminal className="h-4 w-4" /> Owner Console
        </div>
        <Button variant="ghost" size="sm" onClick={() => setLines([])}>
          <Trash2 className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>
      <div className="bg-black text-green-300 font-mono text-xs p-4 h-[60vh] overflow-y-auto whitespace-pre-wrap">
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.kind === "in" ? "text-white" :
              l.kind === "err" ? "text-red-400" :
              l.kind === "sys" ? "text-cyan-300" :
              "text-green-300"
            }
          >
            {l.text}
          </div>
        ))}
        {busy && <div className="text-yellow-300 animate-pulse">running…</div>}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-2 border-t p-2 bg-card">
        <span className="font-mono text-sm text-muted-foreground pl-2">$</span>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type a command — `help` for list"
          className="font-mono"
          disabled={busy}
          autoFocus
        />
        <Button onClick={() => { const v = input; setInput(""); runCommand(v); }} disabled={busy || !input.trim()}>
          Run
        </Button>
      </div>
    </Card>
  );
};

export default ConsoleAdminSection;
