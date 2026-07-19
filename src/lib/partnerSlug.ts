export const partnerSlug = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "partner";

export type PartnerStatus = {
  online: boolean;
  players?: { online: number; max: number };
  version?: string;
  motd?: string;
  loading: boolean;
  error?: string;
};

const cache = new Map<string, { at: number; data: Omit<PartnerStatus, "loading"> }>();
const TTL = 60_000;

// Strip protocol/path so mcsrvstat gets a bare host[:port]
const normalizeIp = (raw: string) => {
  let s = raw.trim();
  s = s.replace(/^[a-z]+:\/\//i, "");
  s = s.split("/")[0];
  return s;
};

export async function fetchPartnerStatus(ip: string): Promise<Omit<PartnerStatus, "loading">> {
  const host = normalizeIp(ip);
  const now = Date.now();
  const hit = cache.get(host);
  if (hit && now - hit.at < TTL) return hit.data;

  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(host)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = {
      online: !!json.online,
      players: json.players ? { online: json.players.online ?? 0, max: json.players.max ?? 0 } : undefined,
      version: json.version,
      motd: Array.isArray(json.motd?.clean) ? json.motd.clean.join(" ").trim() : undefined,
    };
    cache.set(host, { at: now, data });
    return data;
  } catch (e: any) {
    const data = { online: false, error: e?.message ?? "failed" };
    cache.set(host, { at: now, data });
    return data;
  }
}
