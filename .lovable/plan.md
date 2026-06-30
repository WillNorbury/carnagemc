# Owner Console → Live Minecraft Server Console

A web terminal in `/admin?tab=console` (owner-only) that picks a Minecraft server, sends real console commands, and streams the live server log (chat, joins, errors, command output) in real time.

## How the bridge works

The website cannot talk to a Minecraft server directly — most servers are behind NAT/firewalls. We use an **outbound-only bridge plugin** that runs on each MC server. The plugin polls our backend for queued commands and pushes log lines back. No inbound ports need to be opened.

```text
Browser  ──HTTPS──►  Edge fn (queue cmd) ──► Postgres queue
                                                │
   MC server ◄── poll commands ◄── Edge fn ◄────┘
   MC server ── POST log lines ──► Edge fn ──► Postgres logs ──► Realtime ──► Browser
```

## What gets built

### 1. Database (migration)

- `mc_servers` — one row per Minecraft server. Fields: `name`, `slug`, `description`, `ingest_secret` (random, server-stored, used by the plugin to authenticate), `enabled`, `last_seen_at`.
- `mc_console_commands` — command queue. Fields: `server_id`, `command`, `issued_by` (user_id), `status` (`pending|sent|done|error`), `response`, `sent_at`, `completed_at`.
- `mc_console_logs` — streamed log lines. Fields: `server_id`, `level` (`INFO|WARN|ERROR`), `source` (`server|chat|command`), `line`, `logged_at`.
- RLS: owner-only `SELECT/INSERT/UPDATE` on all three. Service role has full access (used by the bridge edge functions). Realtime enabled on `mc_console_logs` and `mc_console_commands` (so the UI updates instantly).

### 2. Edge functions

- `mc-bridge-poll` (called by the plugin)
  - Auth: `X-Server-Slug` + `X-Server-Secret` headers checked against `mc_servers.ingest_secret`.
  - `GET` → returns up to N pending commands, marks them `sent`, stamps `last_seen_at`.
  - `POST` (results) → updates command rows with `response`, sets `status=done|error`.
  - `POST /logs` (or `?kind=logs`) → bulk-insert log lines.
- `mc-console-send` (called by the website)
  - Owner-only (uses existing `is_current_user_admin` + owner role check).
  - Validates `server_id` + `command`, inserts into `mc_console_commands`.
- `mc-server-secret-rotate` — owner regenerates a server's `ingest_secret`.

### 3. Admin UI updates (owner-only)

Replace the current `ConsoleAdminSection` with:

- **Server picker** (dropdown) listing `mc_servers`. Shows green dot if `last_seen_at` is within the last 30s.
- **Live log pane** — subscribes to Realtime `INSERT` on `mc_console_logs` filtered by the selected server. Auto-scroll, color by level, search/filter input, "Pause" toggle.
- **Command input** at the bottom. Submitting inserts via `mc-console-send`. The browser shows the command echo immediately, and the response line streams back when the plugin marks it `done`.
- **Server management subtab** (owner): add/edit/delete servers (`name`, `description`, `enabled`), and a "Show install instructions" button that displays the plugin download link, the server's slug, and a one-time-reveal of `ingest_secret` with a "Rotate" button.

### 4. The bridge plugin

Tiny Paper/Spigot/Folia plugin (`CarnageConsoleBridge`) shipped as a JAR the user uploads to each server's `plugins/` folder. On startup it reads `config.yml`:

```yaml
endpoint: https://<project>.functions.supabase.co/mc-bridge-poll
server-slug: survival
server-secret: <paste from website>
poll-interval-ms: 500
log-batch-ms: 1000
```

Behavior:

- **Console capture**: attaches a `log4j` appender to the root logger to capture every console line (chat, joins, plugin errors, command output). Buffers lines and POSTs them in batches every `log-batch-ms`.
- **Command execution**: every `poll-interval-ms` calls `GET` on the bridge. For each command, runs `Bukkit.dispatchCommand(Bukkit.getConsoleSender(), cmd)` on the main thread, captures any direct response text into a per-command buffer, then POSTs the result.
- **Heartbeat**: every poll also stamps `last_seen_at` so the UI shows online status.
- Plugin source + build instructions live in a new `mc-bridge-plugin/` folder in the repo so it's versioned alongside the website.

## Security

- `ingest_secret` is per-server, generated server-side, shown to the owner once on creation/rotation. Stored hashed at rest if practical (otherwise plain in the row with strict RLS).
- All website endpoints check `owner` role via the existing `usePermissions` + `is_current_user_admin` pattern used by the current Console tab.
- Command audit: every command keeps `issued_by` (user_id) and timestamps forever in `mc_console_commands`.
- Rate limit: edge function caps each server to N commands/min to avoid runaway loops.

## Technical notes

- Polling at 500 ms is cheap (one request, single row select) and works on any host. We can upgrade to SSE/WebSocket later without changing the UI contract.
- Realtime is enabled per-table via `ALTER PUBLICATION supabase_realtime ADD TABLE ...` in the migration. The UI uses one `supabase.channel` per selected server.
- The existing `punishments-lookup` console commands (`lookup`, `unban`, `list`, etc.) stay available as **client-side shortcuts** in the same UI, so the tab does both web-side admin actions and real MC console commands.
- No inbound firewall changes required on the MC host — outbound HTTPS only.

## Out of scope (can be added later)

- Tab-complete suggestions sourced from the MC server.
- Per-server role permissions (e.g. let admins use one server but not another).
- Replaying historical logs older than what's stored in `mc_console_logs` (we'd keep a rolling N days and purge).