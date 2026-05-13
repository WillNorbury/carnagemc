export type ThemePref = "dark" | "light" | "system";

export type UserPreferences = {
  theme?: ThemePref;
  notify_news?: boolean;
  notify_updates?: boolean;
  notify_tickets?: boolean;
  notify_applications?: boolean;
};

export const DEFAULT_PREFS: Required<UserPreferences> = {
  theme: "dark",
  notify_news: true,
  notify_updates: true,
  notify_tickets: true,
  notify_applications: true,
};

export function applyTheme(theme: ThemePref) {
  const root = document.documentElement;
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
  const useLight = theme === "light" || (theme === "system" && prefersLight);
  root.classList.toggle("dark", !useLight);
  root.classList.toggle("light", useLight);
  try {
    localStorage.setItem("zy-theme", theme);
  } catch {}
}

export function bootstrapTheme() {
  try {
    const stored = (localStorage.getItem("zy-theme") as ThemePref | null) ?? "dark";
    applyTheme(stored);
  } catch {
    applyTheme("dark");
  }
}
