const KEY = "carnage:store:recently-viewed";
const MAX = 8;

export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(id: string) {
  if (typeof window === "undefined" || !id) return;
  try {
    const cur = getRecentlyViewedIds().filter((x) => x !== id);
    cur.unshift(id);
    window.localStorage.setItem(KEY, JSON.stringify(cur.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent("recently-viewed:changed"));
  } catch {
    /* ignore */
  }
}

export function clearRecentlyViewed() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("recently-viewed:changed"));
  } catch {
    /* ignore */
  }
}
