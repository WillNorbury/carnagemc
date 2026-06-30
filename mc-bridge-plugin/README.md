# CarnageConsoleBridge

Tiny Paper/Spigot plugin that connects your Minecraft server to the CarnageMC
admin **Console** tab. Outbound HTTPS only — no firewall changes.

## Build

Requires JDK 17+ and Maven.

```bash
cd mc-bridge-plugin
mvn package
```

Produces `target/CarnageConsoleBridge-1.0.0.jar`.

## Install

1. Copy the JAR into your server's `plugins/` folder.
2. Start the server once; it generates `plugins/CarnageConsoleBridge/config.yml`.
3. On the website go to **Admin → Console → Servers** and click **Install** on
   your server. Copy the endpoint, slug, and secret into the plugin's
   `config.yml`.
4. Restart the server. Within a few seconds the Console tab dot turns green and
   live log streaming begins.

## What it does

- Captures all log4j console output (server, plugins, chat, joins, errors) and
  POSTs it in batches every second.
- Polls the website for queued console commands every 500 ms and runs them as
  the console operator (`Bukkit.dispatchCommand(Bukkit.getConsoleSender(), …)`).
- Mirrors each command's direct output back to the website.

## Security

- Each server has its own `ingest_secret` — rotate it from the Install dialog
  at any time and update the plugin config.
- The plugin never accepts inbound connections.
