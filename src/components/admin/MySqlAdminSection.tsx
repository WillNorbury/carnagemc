import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Database, ExternalLink, Terminal, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const CopyBtn = ({ text }: { text: string }) => (
  <Button
    size="icon"
    variant="ghost"
    className="h-7 w-7"
    onClick={() => {
      navigator.clipboard.writeText(text);
      toast.success("Copied");
    }}
  >
    <Copy className="h-3.5 w-3.5" />
  </Button>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
    <span className="text-xs uppercase tracking-wider text-muted-foreground w-32 shrink-0">{label}</span>
    <code className="flex-1 text-sm font-mono truncate">{value}</code>
    <CopyBtn text={value} />
  </div>
);

const SqlBlock = ({ code }: { code: string }) => (
  <div className="relative group">
    <pre className="text-xs bg-muted/40 rounded-md p-3 pr-10 overflow-x-auto font-mono leading-relaxed">
      <code>{code}</code>
    </pre>
    <div className="absolute top-2 right-2">
      <CopyBtn text={code} />
    </div>
  </div>
);

const SNIPPETS: { title: string; desc: string; sql: string }[] = [
  {
    title: "Look up a player's active bans",
    desc: "Replace <UUID> with the player's UUID (no dashes may or may not be stored — check your schema).",
    sql: `SELECT id, name, reason, banned_by_name, time, until, active
FROM litebans_bans
WHERE uuid = '<UUID>'
ORDER BY time DESC;`,
  },
  {
    title: "Deactivate a ban by ID (soft unban)",
    desc: "Preferred over DELETE — keeps history intact.",
    sql: `UPDATE litebans_bans
SET active = 0,
    removed_by_uuid = 'CONSOLE',
    removed_by_name = 'CONSOLE',
    removed_by_reason = 'Unbanned via web',
    removed_by_date = UNIX_TIMESTAMP() * 1000
WHERE id = <BAN_ID> AND active = 1;`,
  },
  {
    title: "Deactivate all active mutes for a player",
    sql: `UPDATE litebans_mutes
SET active = 0,
    removed_by_uuid = 'CONSOLE',
    removed_by_name = 'CONSOLE',
    removed_by_reason = 'Unmuted via web',
    removed_by_date = UNIX_TIMESTAMP() * 1000
WHERE uuid = '<UUID>' AND active = 1;`,
  },
  {
    title: "Recent 25 punishments across all tables",
    sql: `(SELECT 'ban' AS type, id, name, reason, time FROM litebans_bans)
UNION ALL
(SELECT 'mute', id, name, reason, time FROM litebans_mutes)
UNION ALL
(SELECT 'kick', id, name, reason, time FROM litebans_kicks)
UNION ALL
(SELECT 'warn', id, name, reason, time FROM litebans_warnings)
ORDER BY time DESC
LIMIT 25;`,
  },
  {
    title: "Delete a warning (hard delete)",
    sql: `DELETE FROM litebans_warnings WHERE id = <WARN_ID>;`,
  },
];

export const MySqlAdminSection = () => {
  const [tab, setTab] = useState<"clients" | "cli" | "snippets" | "safety">("clients");

  return (
    <div className="space-y-6">
      <Card className="p-5 border-amber-500/30 bg-amber-500/5">
        <div className="flex gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">Direct database editing is destructive.</p>
            <p className="text-muted-foreground">
              For day-to-day punishments prefer{" "}
              <Link to="/admin?tab=punishments" className="underline">Admin → Punishments</Link>{" "}
              or in-game commands (<code className="text-xs bg-muted px-1 rounded">/unban</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">/unmute</code>). Only use raw SQL
              for bulk cleanups or corrupt rows.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4 text-primary" />
          <h2 className="font-bold">Connection details</h2>
          <Badge variant="outline" className="ml-2 text-xs">LiteBans</Badge>
        </div>
        <div className="text-xs text-muted-foreground mb-3">
          Credentials are not stored here for security. Grab them from your Pterodactyl/host panel or the
          LiteBans <code className="bg-muted px-1 rounded">config.yml</code>.
        </div>
        <div className="border rounded-lg p-3">
          <Row label="Host" value="<your-mysql-host>" />
          <Row label="Port" value="3306" />
          <Row label="Database" value="litebans" />
          <Row label="Username" value="<mysql-user>" />
          <Row label="Table prefix" value="litebans_" />
        </div>
      </Card>

      <Card className="p-5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="clients">GUI clients</TabsTrigger>
            <TabsTrigger value="cli"><Terminal className="h-3.5 w-3.5 mr-1" /> CLI</TabsTrigger>
            <TabsTrigger value="snippets">SQL snippets</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Any MySQL-compatible GUI works. Recommended:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-center justify-between border rounded-md p-2">
                <span><strong>DBeaver</strong> — free, cross-platform</span>
                <Button asChild size="sm" variant="ghost">
                  <a href="https://dbeaver.io/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </li>
              <li className="flex items-center justify-between border rounded-md p-2">
                <span><strong>TablePlus</strong> — polished, macOS/Windows</span>
                <Button asChild size="sm" variant="ghost">
                  <a href="https://tableplus.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </li>
              <li className="flex items-center justify-between border rounded-md p-2">
                <span><strong>HeidiSQL</strong> — free, Windows</span>
                <Button asChild size="sm" variant="ghost">
                  <a href="https://www.heidisql.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </li>
              <li className="flex items-center justify-between border rounded-md p-2">
                <span><strong>phpMyAdmin</strong> — browser-based (if your host provides it)</span>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="cli" className="space-y-3">
            <p className="text-sm text-muted-foreground">Connect from a terminal:</p>
            <SqlBlock code={`mysql -h <host> -P 3306 -u <user> -p litebans`} />
            <p className="text-sm text-muted-foreground">List tables:</p>
            <SqlBlock code={`SHOW TABLES LIKE 'litebans_%';`} />
          </TabsContent>

          <TabsContent value="snippets" className="space-y-5">
            {SNIPPETS.map((s) => (
              <div key={s.title} className="space-y-2">
                <div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  {s.desc && <p className="text-xs text-muted-foreground">{s.desc}</p>}
                </div>
                <SqlBlock code={s.sql} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="safety" className="space-y-3 text-sm">
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Always <strong>BACKUP</strong> before running UPDATE/DELETE: <code className="bg-muted px-1 rounded">mysqldump litebans &gt; backup.sql</code>.</li>
              <li>Time fields (<code className="bg-muted px-1 rounded">time</code>, <code className="bg-muted px-1 rounded">until</code>, <code className="bg-muted px-1 rounded">removed_by_date</code>) are <strong>epoch milliseconds</strong>, not timestamps.</li>
              <li>Prefer soft-unban (set <code className="bg-muted px-1 rounded">active = 0</code>) over <code className="bg-muted px-1 rounded">DELETE</code> to keep punishment history.</li>
              <li>Run <code className="bg-muted px-1 rounded">SELECT</code> first with the same WHERE clause before running the corresponding UPDATE/DELETE.</li>
              <li>In-game commands broadcast to staff — raw SQL does not. Use the game for anything you want announced.</li>
            </ul>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default MySqlAdminSection;
