// Dynamic Open Graph image generator.
// Renders a 1200x630 PNG with a title, optional subtitle/eyebrow and the CarnageMC brand.
// Query params: ?title=...&subtitle=...&eyebrow=...
//
// Uses resvg_wasm to rasterize an SVG to PNG. Cached at the edge for 24h.

import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let wasmReady: Promise<void> | null = null;
const ensureWasm = () => {
  if (!wasmReady) {
    wasmReady = fetch("https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm")
      .then((r) => r.arrayBuffer())
      .then((buf) => initWasm(buf));
  }
  return wasmReady;
};

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!)
  );

// Naive word-wrap by character count for the chosen font size.
const wrap = (text: string, maxChars: number, maxLines: number) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = (cur ? cur + " " : "") + w;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  // Truncate last line with ellipsis if text overflows.
  const used = lines.join(" ").length;
  if (used < text.length && lines.length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] =
      (last.length > maxChars - 1 ? last.slice(0, maxChars - 1) : last) + "…";
  }
  return lines;
};

const buildSvg = ({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) => {
  const titleLines = wrap(title, 26, 3);
  const titleStart = 230 + (3 - titleLines.length) * 30;
  const subLines = subtitle ? wrap(subtitle, 60, 2) : [];

  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0b14"/>
      <stop offset="100%" stop-color="#161a2e"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.9">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.1" cy="0.95" r="0.7">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>

  <!-- subtle grid -->
  <g stroke="#ffffff" stroke-opacity="0.04">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="630"/>`).join("")}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="1200" y2="${i * 100}"/>`).join("")}
  </g>

  <!-- card -->
  <rect x="60" y="60" width="1080" height="510" rx="28"
        fill="#0f1222" fill-opacity="0.55" stroke="#ffffff" stroke-opacity="0.08"/>

  <!-- brand row -->
  <g transform="translate(110, 130)">
    <rect width="48" height="48" rx="12" fill="url(#brand)"/>
    <text x="68" y="33" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
          font-size="28" font-weight="800" fill="#ffffff" letter-spacing="2">
      XYLO<tspan fill="#a78bfa">MC</tspan>
    </text>
  </g>

  ${
    eyebrow
      ? `<text x="110" y="225" font-family="Inter, system-ui, sans-serif"
              font-size="22" font-weight="600" fill="#a78bfa" letter-spacing="4">
          ${escapeXml(eyebrow.toUpperCase())}
        </text>`
      : ""
  }

  <!-- title -->
  <g font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
     font-weight="800" fill="#ffffff">
    ${titleLines
      .map(
        (line, i) =>
          `<text x="110" y="${titleStart + i * 78}" font-size="68">${escapeXml(line)}</text>`
      )
      .join("")}
  </g>

  <!-- subtitle -->
  ${
    subLines.length
      ? `<g font-family="Inter, system-ui, sans-serif" font-weight="500" fill="#cbd5e1" fill-opacity="0.85">
          ${subLines
            .map(
              (line, i) =>
                `<text x="110" y="${500 + i * 38}" font-size="28">${escapeXml(line)}</text>`
            )
            .join("")}
        </g>`
      : ""
  }

  <!-- footer -->
  <text x="110" y="540" font-family="Inter, system-ui, sans-serif" font-size="22"
        font-weight="500" fill="#94a3b8" fill-opacity="0.9">xylomc.net</text>

  <!-- accent bar -->
  <rect x="60" y="60" width="6" height="510" rx="3" fill="url(#brand)"/>
</svg>`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const title = (url.searchParams.get("title") || "CarnageMC").slice(0, 200);
    const subtitle = (url.searchParams.get("subtitle") || "").slice(0, 240) || undefined;
    const eyebrow = (url.searchParams.get("eyebrow") || "").slice(0, 40) || undefined;

    await ensureWasm();
    const svg = buildSvg({ title, subtitle, eyebrow });
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
    const png = resvg.render().asPng();

    return new Response(png, {
      headers: {
        ...corsHeaders,
        "content-type": "image/png",
        "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  } catch (e) {
    console.error("og-image error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
