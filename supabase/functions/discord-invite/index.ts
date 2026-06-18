const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function extractCodeFromUrl(input: string): string | null {
  if (!input) return null;
  const patterns = [
    /discord\.gg\/([a-zA-Z0-9-]+)/i,
    /discord\.com\/invite\/([a-zA-Z0-9-]+)/i,
    /discordapp\.com\/invite\/([a-zA-Z0-9-]+)/i,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

const ALLOWED_FETCH_HOSTS = new Set([
  "discord.gg",
  "discord.com",
  "www.discord.com",
  "discordapp.com",
  "www.discordapp.com",
]);

async function extractCode(input: string): Promise<string | null> {
  if (!input) return null;
  const trimmed = input.trim();
  const direct = extractCodeFromUrl(trimmed);
  if (direct) return direct;
  // Vanity/redirect URL — allow any https origin, but only accept the code
  // if the FINAL resolved URL lands on a Discord-owned host.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "https:") return null;
      // Follow redirects from arbitrary HTTPS hosts (vanity domains like
      // discord.carnagemc.net), but only accept the code if the FINAL resolved
      // URL lands on a Discord-owned host.
      const r = await fetch(parsed.toString(), {
        redirect: "follow",
        headers: { "User-Agent": "CarnageMC-Site/1.0" },
      });
      const finalUrl = new URL(r.url);
      await r.body?.cancel();
      if (!ALLOWED_FETCH_HOSTS.has(finalUrl.hostname)) return null;
      const code = extractCodeFromUrl(r.url);
      if (code) return code;
    } catch (_) { /* ignore */ }
    return null;
  }
  // Already a bare code
  if (/^[a-zA-Z0-9-]+$/.test(trimmed)) return trimmed;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get("invite") ?? url.searchParams.get("code") ?? "";
    const fallbacks: string[] = [];
    const resolved = await extractCode(raw);
    const candidates = [resolved, ...fallbacks].filter(Boolean) as string[];

    let lastError = "No valid invite resolved";
    for (const code of candidates) {
      try {
        const r = await fetch(
          `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true&with_expiration=true`,
          { headers: { "User-Agent": "CarnageMC-Site/1.0" } },
        );
        const j = await r.json().catch(() => null);
        if (!r.ok) {
          lastError = j?.message ? `${j.message} (${code})` : `Discord ${r.status} for ${code}`;
          continue;
        }
        if (j && typeof j.approximate_member_count === "number") {
          return json({
            ok: true,
            code,
            approximate_member_count: j.approximate_member_count,
            approximate_presence_count: j.approximate_presence_count ?? null,
            guild: j.guild ? { id: j.guild.id, name: j.guild.name, icon: j.guild.icon } : null,
          });
        }
      } catch (e) { lastError = (e as Error).message; }
    }

    // Always return 200 so the SDK doesn't throw; clients check `ok`.
    return json({ ok: false, error: lastError });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message });
  }
});
