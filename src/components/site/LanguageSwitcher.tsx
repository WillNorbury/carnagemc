import { useEffect, useState } from "react";
import { Check, Globe, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Lang = { code: string; label: string; flag: string; short: string };

export const LANGUAGES: Lang[] = [
  { code: "en", label: "English", flag: "🇬🇧", short: "EN" },
  { code: "es", label: "Español", flag: "🇪🇸", short: "ES" },
  { code: "fr", label: "Français", flag: "🇫🇷", short: "FR" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", short: "DE" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", short: "NL" },
  { code: "it", label: "Italiano", flag: "🇮🇹", short: "IT" },
  { code: "pt", label: "Português", flag: "🇵🇹", short: "PT" },
  { code: "pl", label: "Polski", flag: "🇵🇱", short: "PL" },
  { code: "sv", label: "Svenska", flag: "🇸🇪", short: "SV" },
  { code: "da", label: "Dansk", flag: "🇩🇰", short: "DA" },
  { code: "fi", label: "Suomi", flag: "🇫🇮", short: "FI" },
  { code: "no", label: "Norsk", flag: "🇳🇴", short: "NO" },
  { code: "cs", label: "Čeština", flag: "🇨🇿", short: "CS" },
  { code: "ro", label: "Română", flag: "🇷🇴", short: "RO" },
  { code: "hu", label: "Magyar", flag: "🇭🇺", short: "HU" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷", short: "EL" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", short: "TR" },
  { code: "ru", label: "Русский", flag: "🇷🇺", short: "RU" },
  { code: "uk", label: "Українська", flag: "🇺🇦", short: "UK" },
  { code: "ar", label: "العربية", flag: "🇸🇦", short: "AR" },
  { code: "he", label: "עברית", flag: "🇮🇱", short: "HE" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳", short: "HI" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩", short: "ID" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", short: "VI" },
  { code: "th", label: "ไทย", flag: "🇹🇭", short: "TH" },
  { code: "ja", label: "日本語", flag: "🇯🇵", short: "JA" },
  { code: "ko", label: "한국어", flag: "🇰🇷", short: "KO" },
  { code: "zh-CN", label: "中文 (简体)", flag: "🇨🇳", short: "ZH" },
  { code: "zh-TW", label: "中文 (繁體)", flag: "🇹🇼", short: "TW" },
  { code: "fil", label: "Filipino", flag: "🇵🇭", short: "FIL" },
];

const COOKIE = "googtrans";

const readCurrent = (): string => {
  try {
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (m) {
      const parts = decodeURIComponent(m[1]).split("/");
      const code = parts[2];
      if (code) return code;
    }
  } catch {}
  return "en";
};

const setCookie = (code: string) => {
  const value = `/en/${code}`;
  const host = window.location.hostname;
  const bases = [`${COOKIE}=${value};path=/`];
  if (host && !/^\d+\.\d+\.\d+\.\d+$/.test(host) && host !== "localhost") {
    const root = host.split(".").slice(-2).join(".");
    bases.push(`${COOKIE}=${value};path=/;domain=.${host}`);
    bases.push(`${COOKIE}=${value};path=/;domain=.${root}`);
  }
  bases.forEach((c) => {
    document.cookie = c;
  });
};

const clearCookie = () => {
  const host = window.location.hostname;
  const root = host.split(".").slice(-2).join(".");
  [
    `${COOKIE}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `${COOKIE}=;path=/;domain=.${host};expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `${COOKIE}=;path=/;domain=.${root};expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ].forEach((c) => {
    document.cookie = c;
  });
};

const STORAGE_KEY = "cmc-lang";
const URL_PARAM = "lang";

const readStored = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const store = (code: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {}
};

const normalize = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const val = raw.trim();
  const exact = LANGUAGES.find((l) => l.code.toLowerCase() === val.toLowerCase());
  if (exact) return exact.code;
  const base = val.split("-")[0].toLowerCase();
  if (base === "zh") return val.toLowerCase().includes("tw") || val.toLowerCase().includes("hant") ? "zh-TW" : "zh-CN";
  const partial = LANGUAGES.find((l) => l.code.split("-")[0].toLowerCase() === base);
  return partial ? partial.code : null;
};

const readUrlLang = (): string | null => {
  try {
    return normalize(new URLSearchParams(window.location.search).get(URL_PARAM));
  } catch {
    return null;
  }
};

const detectBrowserLang = (): string | null => {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const l of list) {
    const match = normalize(l);
    if (match) return match;
  }
  return null;
};

const syncUrl = (code: string, replace = true) => {
  try {
    const url = new URL(window.location.href);
    if (code === "en") url.searchParams.delete(URL_PARAM);
    else url.searchParams.set(URL_PARAM, code);
    const next = url.pathname + url.search + url.hash;
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    if (next !== currentPath) window.history[replace ? "replaceState" : "pushState"]({}, "", next);
  } catch {}
};

let scriptLoaded = false;

const loadTranslateScript = () => {
  if (scriptLoaded || document.getElementById("google-translate-script")) return;
  scriptLoaded = true;
  if (!document.getElementById("google_translate_element")) {
    const host = document.createElement("div");
    host.id = "google_translate_element";
    host.style.display = "none";
    document.body.appendChild(host);
  }
  (window as any).googleTranslateElementInit = () => {
    const g = (window as any).google;
    if (!g?.translate?.TranslateElement) return;
    new g.translate.TranslateElement(
      { pageLanguage: "en", autoDisplay: false },
      "google_translate_element",
    );
  };
  const s = document.createElement("script");
  s.id = "google-translate-script";
  s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.body.appendChild(s);
};

const applyLang = (code: string) => {
  if (code === "en") clearCookie();
  else setCookie(code);
  store(code);
};

export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const [current, setCurrent] = useState<string>("en");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const cookieLang = readCurrent();
    // Priority: URL param > saved preference > cookie > browser language
    const desired = readUrlLang() ?? readStored() ?? (cookieLang !== "en" ? cookieLang : null) ?? detectBrowserLang() ?? "en";

    if (desired !== cookieLang) {
      applyLang(desired);
      syncUrl(desired);
      window.location.reload();
      return;
    }

    store(desired);
    setCurrent(desired);
    syncUrl(desired);
    document.documentElement.lang = desired;
    if (desired !== "en") loadTranslateScript();
  }, []);

  // Keep the ?lang= param present across client-side navigation
  useEffect(() => {
    if (current === "en") return;
    const keep = () => syncUrl(current);
    const id = window.setInterval(keep, 600);
    window.addEventListener("popstate", keep);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("popstate", keep);
    };
  }, [current]);

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  const filtered = LANGUAGES.filter((l) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      l.label.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      l.short.toLowerCase().includes(q)
    );
  });

  const pick = (code: string) => {
    if (code === current) return;
    applyLang(code);
    syncUrl(code);
    window.location.reload();
  };

  return (
    <DropdownMenu onOpenChange={(o) => !o && setQuery("")}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`rounded-full gap-1.5 px-2 h-9 notranslate ${className ?? ""}`}
          aria-label="Change language"
          title="Change language"
        >
          <span className="text-base leading-none" aria-hidden>
            {active.flag}
          </span>
          <span className="text-xs font-semibold tracking-wide hidden sm:inline">{active.short}</span>
          <Globe className="h-3.5 w-3.5 sm:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 bg-popover z-50 notranslate">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" && filtered[0]) pick(filtered[0].code);
              }}
              placeholder="Search languages…"
              className="h-8 pl-7 text-sm"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-72">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No languages found</div>
          )}
          {filtered.map((l) => (
            <DropdownMenuItem key={l.code} onSelect={() => pick(l.code)} className="gap-2">
              <span className="text-base leading-none" aria-hidden>
                {l.flag}
              </span>
              <span className="flex-1 truncate">{l.label}</span>
              {l.code === current && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
