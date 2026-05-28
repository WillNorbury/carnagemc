import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Newspaper,
  Puzzle,
  Sparkles,
  Users as UsersIcon,
  HelpCircle,
  Calendar,
  Home,
  ShieldCheck,
  Vote as VoteIcon,
  ScrollText,
  LifeBuoy,
  Trophy,
  ClipboardList,
} from "lucide-react";

type Hit = { id: string; type: string; title: string; subtitle?: string; to: string; icon: any };

const PAGES: Hit[] = [
  { id: "p-home", type: "page", title: "Home", to: "/", icon: Home },
  { id: "p-news", type: "page", title: "News", to: "/news", icon: Newspaper },
  { id: "p-changelog", type: "page", title: "Changelog", to: "/changelog", icon: ClipboardList },
  { id: "p-staff", type: "page", title: "Staff", to: "/staff", icon: ShieldCheck },
  { id: "p-vote", type: "page", title: "Vote", to: "/vote", icon: VoteIcon },
  { id: "p-rules", type: "page", title: "Rules", to: "/rules", icon: ScrollText },
  { id: "p-plugins", type: "page", title: "Plugins", to: "/discover/plugins", icon: Puzzle },
  { id: "p-features", type: "page", title: "Features", to: "/features", icon: Sparkles },
  { id: "p-faq", type: "page", title: "FAQ", to: "/faq", icon: HelpCircle },
  { id: "p-events", type: "page", title: "Events", to: "/events", icon: Calendar },
  { id: "p-leaderboard", type: "page", title: "Leaderboard", to: "/leaderboard", icon: Trophy },
  { id: "p-users", type: "page", title: "Users", to: "/users", icon: UsersIcon },
  { id: "p-support", type: "page", title: "Support", to: "/support", icon: LifeBuoy },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        const target = e.target as HTMLElement | null;
        if (target && /input|textarea/i.test(target.tagName)) return;
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const like = `%${term}%`;
      const results: Hit[] = [];
      const [news, plugins, features, profiles, faqs, events] = await Promise.all([
        supabase.from("news").select("id,title,slug,excerpt").eq("published", true).ilike("title", like).limit(5),
        supabase.from("plugins").select("id,short_id,name,description").eq("published", true).ilike("name", like).limit(5),
        supabase.from("features").select("id,title,slug,description").eq("published", true).ilike("title", like).limit(5),
        supabase.from("profiles").select("id,display_name,mc_username").or(`display_name.ilike.${like},mc_username.ilike.${like}`).limit(5),
        (supabase.from("faqs" as any) as any).select("id,question").eq("published", true).ilike("question", like).limit(5),
        (supabase.from("events" as any) as any).select("id,title,slug").eq("published", true).ilike("title", like).limit(5),
      ]);
      (news.data ?? []).forEach((n: any) =>
        results.push({ id: `n-${n.id}`, type: "News", title: n.title, subtitle: n.excerpt ?? undefined, to: `/news/${n.slug}`, icon: Newspaper })
      );
      (plugins.data ?? []).forEach((p: any) =>
        results.push({ id: `pl-${p.id}`, type: "Plugin", title: p.name, subtitle: p.description ?? undefined, to: `/discover/plugins/${p.short_id}`, icon: Puzzle })
      );
      (features.data ?? []).forEach((f: any) =>
        results.push({ id: `f-${f.id}`, type: "Feature", title: f.title, subtitle: f.description ?? undefined, to: `/features/${f.slug}`, icon: Sparkles })
      );
      (profiles.data ?? []).forEach((u: any) =>
        results.push({ id: `u-${u.id}`, type: "Player", title: u.display_name || u.mc_username || "Player", subtitle: u.mc_username ?? undefined, to: `/users`, icon: UsersIcon })
      );
      (faqs.data ?? []).forEach((f: any) =>
        results.push({ id: `q-${f.id}`, type: "FAQ", title: f.question, to: `/faq`, icon: HelpCircle })
      );
      (events.data ?? []).forEach((e: any) =>
        results.push({ id: `e-${e.id}`, type: "Event", title: e.title, to: `/events`, icon: Calendar })
      );
      if (!cancelled) setHits(results);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const go = (to: string) => {
    setOpen(false);
    setQ("");
    nav(to);
  };

  const filteredPages = PAGES.filter((p) => p.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search…</span>
        <kbd className="hidden md:inline pointer-events-none ml-1 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search news, plugins, players, FAQs…" value={q} onValueChange={setQ} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {filteredPages.length > 0 && (
            <CommandGroup heading="Pages">
              {filteredPages.slice(0, 8).map((p) => {
                const Icon = p.icon;
                return (
                  <CommandItem key={p.id} value={`${p.title} ${p.to}`} onSelect={() => go(p.to)}>
                    <Icon className="h-4 w-4 mr-2" />
                    {p.title}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          {hits.length > 0 && <CommandSeparator />}
          {hits.length > 0 && (
            <CommandGroup heading="Results">
              {hits.map((h) => {
                const Icon = h.icon;
                return (
                  <CommandItem key={h.id} value={`${h.type} ${h.title}`} onSelect={() => go(h.to)}>
                    <Icon className="h-4 w-4 mr-2 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{h.title}</span>
                      {h.subtitle && (
                        <span className="text-xs text-muted-foreground truncate">{h.subtitle}</span>
                      )}
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">{h.type}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
