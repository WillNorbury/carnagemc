import { CSSProperties, ReactNode } from "react";

// Legacy Minecraft color codes
const LEGACY_COLORS: Record<string, string> = {
  "0": "#000000",
  "1": "#0000AA",
  "2": "#00AA00",
  "3": "#00AAAA",
  "4": "#AA0000",
  "5": "#AA00AA",
  "6": "#FFAA00",
  "7": "#AAAAAA",
  "8": "#555555",
  "9": "#5555FF",
  a: "#55FF55",
  b: "#55FFFF",
  c: "#FF5555",
  d: "#FF55FF",
  e: "#FFFF55",
  f: "#FFFFFF",
};

type McStyle = {
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  obfuscated?: boolean;
};

/**
 * Parses Minecraft-style formatted text into React spans.
 * Supports:
 *  - Legacy codes: &0-9a-f (colors), &l &o &n &m &k &r (formats)
 *  - Hex colors: <#RRGGBB> and &#RRGGBB
 */
export function parseMcText(input: string | null | undefined, keyPrefix = ""): ReactNode[] {
  if (typeof input !== "string" || !input) return [];
  const out: ReactNode[] = [];
  let style: McStyle = {};
  let buf = "";
  let i = 0;
  let k = 0;

  const flush = () => {
    if (!buf) return;
    const css: CSSProperties = {};
    if (style.color) css.color = style.color;
    if (style.bold) css.fontWeight = 700;
    if (style.italic) css.fontStyle = "italic";
    const deco: string[] = [];
    if (style.underline) deco.push("underline");
    if (style.strike) deco.push("line-through");
    if (deco.length) css.textDecoration = deco.join(" ");
    out.push(
      <span key={`${keyPrefix}${k++}`} style={css} className={style.obfuscated ? "mc-obf" : undefined}>
        {buf}
      </span>,
    );
    buf = "";
  };

  while (i < input.length) {
    const ch = input[i];

    // <#RRGGBB>
    if (ch === "<" && input[i + 1] === "#") {
      const m = input.slice(i).match(/^<#([0-9a-fA-F]{6})>/);
      if (m) {
        flush();
        style = { ...style, color: `#${m[1]}` };
        i += m[0].length;
        continue;
      }
    }

    // & codes (&#RRGGBB, &0-9a-f, &l &o &n &m &k &r)
    if (ch === "&" && i + 1 < input.length) {
      const next = input[i + 1];
      if (next === "#") {
        const m = input.slice(i).match(/^&#([0-9a-fA-F]{6})/);
        if (m) {
          flush();
          style = { ...style, color: `#${m[1]}` };
          i += m[0].length;
          continue;
        }
      }
      const lower = next.toLowerCase();
      if (LEGACY_COLORS[lower]) {
        flush();
        // A color code resets formatting (vanilla behavior)
        style = { color: LEGACY_COLORS[lower] };
        i += 2;
        continue;
      }
      if ("lonmkr".includes(lower)) {
        flush();
        if (lower === "r") style = {};
        else if (lower === "l") style = { ...style, bold: true };
        else if (lower === "o") style = { ...style, italic: true };
        else if (lower === "n") style = { ...style, underline: true };
        else if (lower === "m") style = { ...style, strike: true };
        else if (lower === "k") style = { ...style, obfuscated: true };
        i += 2;
        continue;
      }
    }

    buf += ch;
    i += 1;
  }
  flush();
  return out;
}
