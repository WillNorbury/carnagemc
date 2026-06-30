package net.carnagemc.consolebridge;

import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.core.LogEvent;
import org.apache.logging.log4j.core.Logger;
import org.apache.logging.log4j.core.appender.AbstractAppender;
import org.apache.logging.log4j.core.config.Property;
import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Bridges this Minecraft server with the CarnageMC admin web console.
 *  - Captures all log4j console output and POSTs it in batches.
 *  - Polls the website for pending commands, runs them on the main thread,
 *    captures their direct output, and POSTs the result back.
 *
 * Outbound HTTPS only — no inbound ports needed.
 */
public final class ConsoleBridgePlugin extends JavaPlugin {

    private final HttpClient http = HttpClient.newHttpClient();
    private final ConcurrentLinkedQueue<LogLine> pendingLogs = new ConcurrentLinkedQueue<>();
    private BridgeAppender appender;
    private BukkitTask pollTask;
    private BukkitTask flushTask;

    private String endpoint;
    private String slug;
    private String secret;
    private long pollMs;
    private long flushMs;

    // While a command runs we redirect console output into this list so we can
    // mirror the response back to the website.
    private volatile List<String> capture = null;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        endpoint = getConfig().getString("endpoint", "");
        slug = getConfig().getString("server-slug", "");
        secret = getConfig().getString("server-secret", "");
        pollMs = getConfig().getLong("poll-interval-ms", 500);
        flushMs = getConfig().getLong("log-batch-ms", 1000);

        if (endpoint.isBlank() || slug.isBlank() || secret.isBlank()) {
            getLogger().severe("ConsoleBridge: endpoint/slug/secret not configured. Disabling.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        // Attach log appender
        appender = new BridgeAppender();
        appender.start();
        ((Logger) LogManager.getRootLogger()).addAppender(appender);

        // Schedule poll + flush on async scheduler
        pollTask = Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::pollCommands,
                20L, Math.max(1L, pollMs / 50L));
        flushTask = Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::flushLogs,
                20L, Math.max(1L, flushMs / 50L));

        getLogger().info("ConsoleBridge enabled for server slug `" + slug + "`.");
    }

    @Override
    public void onDisable() {
        if (pollTask != null) pollTask.cancel();
        if (flushTask != null) flushTask.cancel();
        if (appender != null) {
            ((Logger) LogManager.getRootLogger()).removeAppender(appender);
            appender.stop();
        }
        flushLogs();
    }

    // ------------------------------------------------------------------
    // Log capture
    // ------------------------------------------------------------------

    private record LogLine(String level, String line, String iso) {}

    private final class BridgeAppender extends AbstractAppender {
        BridgeAppender() {
            super("CarnageConsoleBridge", null, null, true, Property.EMPTY_ARRAY);
        }
        @Override public void append(LogEvent event) {
            String msg = event.getMessage().getFormattedMessage();
            if (msg == null || msg.isEmpty()) return;
            String lvl = mapLevel(event.getLevel());
            pendingLogs.add(new LogLine(lvl, msg, Instant.ofEpochMilli(event.getTimeMillis()).toString()));
            List<String> cap = capture;
            if (cap != null) cap.add(msg);
        }
        private String mapLevel(Level l) {
            if (l == Level.ERROR || l == Level.FATAL) return "ERROR";
            if (l == Level.WARN) return "WARN";
            if (l == Level.DEBUG || l == Level.TRACE) return "DEBUG";
            return "INFO";
        }
    }

    private void flushLogs() {
        if (pendingLogs.isEmpty()) return;
        List<LogLine> batch = new ArrayList<>();
        for (int i = 0; i < 500; i++) {
            LogLine l = pendingLogs.poll();
            if (l == null) break;
            batch.add(l);
        }
        if (batch.isEmpty()) return;
        StringBuilder sb = new StringBuilder("{\"lines\":[");
        for (int i = 0; i < batch.size(); i++) {
            LogLine l = batch.get(i);
            if (i > 0) sb.append(',');
            sb.append("{\"level\":\"").append(l.level)
              .append("\",\"source\":\"server\",\"logged_at\":\"").append(l.iso)
              .append("\",\"line\":\"").append(escape(l.line)).append("\"}");
        }
        sb.append("]}");
        post(endpoint + "?kind=logs", sb.toString());
    }

    // ------------------------------------------------------------------
    // Command polling
    // ------------------------------------------------------------------

    private void pollCommands() {
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(endpoint))
                    .header("X-Server-Slug", slug)
                    .header("X-Server-Secret", secret)
                    .GET().build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) return;
            String body = resp.body();
            int idx = body.indexOf("\"commands\":[");
            if (idx < 0) return;
            String arr = body.substring(idx + 12, body.lastIndexOf(']'));
            if (arr.isBlank()) return;

            List<String[]> cmds = new ArrayList<>(); // [id, command]
            int i = 0;
            while (i < arr.length()) {
                int objStart = arr.indexOf('{', i);
                if (objStart < 0) break;
                int objEnd = arr.indexOf('}', objStart);
                if (objEnd < 0) break;
                String obj = arr.substring(objStart, objEnd + 1);
                String id = extract(obj, "id");
                String cmd = extract(obj, "command");
                if (id != null && cmd != null) cmds.add(new String[]{ id, unescape(cmd) });
                i = objEnd + 1;
            }

            for (String[] c : cmds) executeAndReport(c[0], c[1]);
        } catch (Exception ignored) { }
    }

    private void executeAndReport(String id, String cmd) {
        Bukkit.getScheduler().runTask(this, () -> {
            List<String> cap = new ArrayList<>();
            capture = cap;
            String status = "done";
            try {
                Bukkit.dispatchCommand(Bukkit.getConsoleSender(), cmd);
            } catch (Throwable t) {
                cap.add("Error: " + t.getMessage());
                status = "error";
            } finally {
                capture = null;
            }
            String joined = String.join("\n", cap);
            String body = "{\"results\":[{\"id\":\"" + id + "\",\"status\":\"" + status
                    + "\",\"response\":\"" + escape(joined) + "\"}]}";
            // Send asynchronously so we don't block the main thread
            Bukkit.getScheduler().runTaskAsynchronously(this, () -> post(endpoint + "?kind=results", body));
        });
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private void post(String url, String json) {
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .header("X-Server-Slug", slug)
                    .header("X-Server-Secret", secret)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();
            http.send(req, HttpResponse.BodyHandlers.discarding());
        } catch (Exception ignored) { }
    }

    private static String escape(String s) {
        StringBuilder sb = new StringBuilder(s.length() + 8);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '\\' -> sb.append("\\\\");
                case '"'  -> sb.append("\\\"");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
                }
            }
        }
        return sb.toString();
    }

    private static String unescape(String s) {
        return s.replace("\\n", "\n").replace("\\\"", "\"").replace("\\\\", "\\");
    }

    private static String extract(String obj, String key) {
        String needle = "\"" + key + "\":\"";
        int k = obj.indexOf(needle);
        if (k < 0) return null;
        int start = k + needle.length();
        StringBuilder sb = new StringBuilder();
        for (int i = start; i < obj.length(); i++) {
            char c = obj.charAt(i);
            if (c == '\\' && i + 1 < obj.length()) { sb.append(c).append(obj.charAt(++i)); continue; }
            if (c == '"') return sb.toString();
            sb.append(c);
        }
        return null;
    }
}
