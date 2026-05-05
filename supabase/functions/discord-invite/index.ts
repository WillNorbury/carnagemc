const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function extractCode(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const patterns = [
    /discord\.gg\/([a-zA-Z0-9-]+)/i,
    /discord\.com\/invite\/([a-zA-Z0-9-]+)/i,
    /discordapp\.com\/invite\/([a-zA-Z0-9-]+)/i,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
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
    const fallbacks = ["qAEs87VeXM", "zyphoramc", "zyphora"];
    const candidates = [extractCode(raw), ...fallbacks].filter(Boolean) as string[];

    for (const code of candidates) {
      try {
        const r = await fetch(
          `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true&with_expiration=true`,
          { headers: { "User-Agent": "ZyphoraMC-Site/1.0" } },
        );
        if (!r.ok) continue;
        const j = await r.json();
        if (typeof j.approximate_member_count === "number") {
          return json({
            ok: true,
            code,
            approximate_member_count: j.approximate_member_count,
            approximate_presence_count: j.approximate_presence_count ?? null,
            guild: j.guild ? { id: j.guild.id, name: j.guild.name, icon: j.guild.icon } : null,
          });
        }
      } catch (_) { /* try next */ }
    }

    return json({ ok: false, error: "No valid invite resolved" }, 404);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
