import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Terminal, Search, Filter, Copy, X } from "lucide-react";

type Cmd = {
  cmd: string;
  desc: string;
  category: string;
  rank: "Player" | "Donor" | "Staff" | "Admin";
  aliases?: string[];
};

const COMMANDS: Cmd[] = [
  { cmd: "/spawn", desc: "Teleport back to the main server spawn.", category: "Teleport", rank: "Player" },
  { cmd: "/home <name>", desc: "Teleport to one of your saved homes.", category: "Teleport", rank: "Player", aliases: ["/h"] },
  { cmd: "/sethome <name>", desc: "Save your current location as a home.", category: "Teleport", rank: "Player" },
  { cmd: "/delhome <name>", desc: "Delete a saved home.", category: "Teleport", rank: "Player" },
  { cmd: "/tpa <player>", desc: "Request to teleport to another player.", category: "Teleport", rank: "Player" },
  { cmd: "/tpaccept", desc: "Accept an incoming teleport request.", category: "Teleport", rank: "Player", aliases: ["/tpyes"] },
  { cmd: "/rtp", desc: "Randomly teleport into the wild.", category: "Teleport", rank: "Player", aliases: ["/wild"] },
  { cmd: "/back", desc: "Return to your previous location or death point.", category: "Teleport", rank: "Donor" },

  { cmd: "/msg <player> <text>", desc: "Send a private message.", category: "Chat", rank: "Player", aliases: ["/w", "/tell"] },
  { cmd: "/r <text>", desc: "Reply to the last private message.", category: "Chat", rank: "Player" },
  { cmd: "/ignore <player>", desc: "Hide chat and messages from a player.", category: "Chat", rank: "Player" },
  { cmd: "/nick <name>", desc: "Set a display nickname.", category: "Chat", rank: "Donor" },
  { cmd: "/staffchat <text>", desc: "Talk in the staff-only channel.", category: "Chat", rank: "Staff", aliases: ["/sc"] },

  { cmd: "/balance", desc: "Check your in-game balance.", category: "Economy", rank: "Player", aliases: ["/bal"] },
  { cmd: "/pay <player> <amount>", desc: "Send money to another player.", category: "Economy", rank: "Player" },
  { cmd: "/shop", desc: "Open the server shop menu.", category: "Economy", rank: "Player" },
  { cmd: "/ah", desc: "Browse the player auction house.", category: "Economy", rank: "Player", aliases: ["/auction"] },
  { cmd: "/sell hand", desc: "Sell the item you are holding.", category: "Economy", rank: "Player" },
  { cmd: "/baltop", desc: "View the richest players on the server.", category: "Economy", rank: "Player" },

  { cmd: "/vote", desc: "Get the vote links and claim rewards.", category: "Rewards", rank: "Player" },
  { cmd: "/rewards", desc: "Open your pending reward crate keys.", category: "Rewards", rank: "Player" },
  { cmd: "/daily", desc: "Claim your daily login bonus.", category: "Rewards", rank: "Player" },
  { cmd: "/kit <name>", desc: "Claim a kit you have access to.", category: "Rewards", rank: "Player" },
  { cmd: "/kits", desc: "List every kit and its cooldown.", category: "Rewards", rank: "Player" },

  { cmd: "/land claim", desc: "Claim the chunk you are standing in.", category: "Land", rank: "Player" },
  { cmd: "/land trust <player>", desc: "Give a player build access in your land.", category: "Land", rank: "Player" },
  { cmd: "/land unclaim", desc: "Release the current claimed chunk.", category: "Land", rank: "Player" },
  { cmd: "/land info", desc: "See who owns the land you are standing on.", category: "Land", rank: "Player" },

  { cmd: "/report <player> <reason>", desc: "Report a rule breaker to staff.", category: "Moderation", rank: "Player" },
  { cmd: "/mute <player> <time>", desc: "Temporarily mute a player.", category: "Moderation", rank: "Staff" },
  { cmd: "/kick <player> <reason>", desc: "Remove a player from the server.", category: "Moderation", rank: "Staff" },
  { cmd: "/ban <player> <reason>", desc: "Ban a player from the network.", category: "Moderation", rank: "Staff" },
  { cmd: "/history <player>", desc: "View a player's punishment history.", category: "Moderation", rank: "Staff" },
  { cmd: "/vanish", desc: "Become invisible to other players.", category: "Moderation", rank: "Staff", aliases: ["/v"] },
  { cmd: "/unban <player>", desc: "Lift a ban after a successful appeal.", category: "Moderation", rank: "Admin" },

  { cmd: "/gamemode <mode>", desc: "Switch your game mode.", category: "Admin", rank: "Admin", aliases: ["/gm"] },
  { cmd: "/broadcast <text>", desc: "Send a server-wide announcement.", category: "Admin", rank: "Admin", aliases: ["/bc"] },
  { cmd: "/reload confirm", desc: "Reload server configuration files.", category: "Admin", rank: "Admin" },
  { cmd: "/whitelist <on|off>", desc: "Toggle the server whitelist.", category: "Admin", rank: "Admin" },
];

const RANK_TONE: Record<Cmd["rank"], string> = {
  Player: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  Donor: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  Staff: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  Admin: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

const Commands = () => {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [rank, setRank] = useState<Cmd["rank"] | null>(null);

  useEffect(() => {
    document.title = "Command Reference — CarnageMC";
    const desc =
      "Every CarnageMC in-game command: teleports, economy, land claims, chat, rewards and staff tools, searchable by rank.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(COMMANDS.map((c) => c.category))),
    [],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return COMMANDS.filter((c) => {
      if (category && c.category !== category) return false;
      if (rank && c.rank !== rank) return false;
      if (!s) return true;
      return (
        c.cmd.toLowerCase().includes(s) ||
        c.desc.toLowerCase().includes(s) ||
        c.category.toLowerCase().includes(s) ||
        (c.aliases ?? []).some((a) => a.toLowerCase().includes(s))
      );
    });
  }, [q, category, rank]);

  const copy = async (cmd: string) => {
    const base = cmd.split(" ")[0];
    try {
      await navigator.clipboard.writeText(base);
      toast.success(`Copied ${base}`);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const hasFilters = !!(q || category || rank);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16 max-w-[1400px]">
        {/* Command-center header */}
        <div className="relative mb-6 rounded-2xl border border-orange-500/30 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.2),transparent_60%),linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--background))_100%)] overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-0">
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-orange-500/20">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-orange-300 mb-4">
                <Terminal className="h-3 w-3" /> In-game · Reference
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight leading-[0.95]">
                Command{" "}
                <span className="bg-gradient-to-br from-orange-300 via-orange-500 to-rose-600 bg-clip-text text-transparent">
                  Reference
                </span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-lg">
                Every command available on the network, grouped by system and filtered by the rank
                that unlocks it. Click any row to copy it.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-orange-500/10">
              {[
                { label: "Commands", value: COMMANDS.length, tone: "text-orange-300" },
                { label: "Categories", value: categories.length, tone: "text-emerald-300" },
                {
                  label: "Free to use",
                  value: COMMANDS.filter((c) => c.rank === "Player").length,
                  tone: "text-amber-300",
                },
                {
                  label: "Staff tools",
                  value: COMMANDS.filter((c) => c.rank === "Staff" || c.rank === "Admin").length,
                  tone: "text-rose-300",
                },
              ].map((s) => (
                <div key={s.label} className="bg-card/60 p-4 md:p-5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </div>
                  <div className={`font-display font-black text-2xl md:text-3xl mt-1 ${s.tone}`}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-6 md:px-8 py-2.5 border-t border-orange-500/20 bg-black/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Reference synced
            </span>
            <span>·</span>
            <span>{filtered.length} matching</span>
          </div>
        </div>

        {/* Controls */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-3 mb-3 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search commands, aliases, descriptions..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 h-10 bg-background/70"
              />
            </div>
            {hasFilters && (
              <Button
                variant="outline"
                className="h-10"
                onClick={() => {
                  setQ("");
                  setCategory(null);
                  setRank(null);
                }}
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">
              <Filter className="h-3 w-3 text-orange-400" /> Group
            </div>
            {categories.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(active ? null : c)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-mono transition-colors ${
                    active
                      ? "border-orange-500/60 bg-orange-500/15 text-orange-200"
                      : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">
              <Filter className="h-3 w-3 text-orange-400" /> Rank
            </div>
            {(["Player", "Donor", "Staff", "Admin"] as const).map((r) => {
              const active = rank === r;
              return (
                <button
                  key={r}
                  onClick={() => setRank(active ? null : r)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-mono transition-colors ${
                    active ? RANK_TONE[r] : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/70 bg-card/40 overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(220px,1.1fr)_2fr_140px_120px] gap-4 px-4 py-2.5 border-b border-border/60 bg-black/20 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <div>Command</div>
            <div>Description</div>
            <div>Group</div>
            <div>Access</div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground font-mono">
              No commands match those filters.
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.cmd}
                onClick={() => copy(c.cmd)}
                className="w-full text-left grid md:grid-cols-[minmax(220px,1.1fr)_2fr_140px_120px] gap-1 md:gap-4 px-4 py-3 border-b border-border/40 last:border-b-0 hover:bg-orange-500/5 transition-colors group"
              >
                <div className="font-mono text-sm text-orange-200 flex items-center gap-2">
                  <span className="truncate">{c.cmd}</span>
                  <Copy className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-70 transition-opacity" />
                </div>
                <div className="text-sm text-muted-foreground">
                  {c.desc}
                  {c.aliases?.length ? (
                    <span className="ml-2 font-mono text-[11px] text-muted-foreground/70">
                      aka {c.aliases.join(", ")}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs font-mono text-muted-foreground md:pt-0.5">{c.category}</div>
                <div>
                  <Badge variant="outline" className={`font-mono text-[10px] ${RANK_TONE[c.rank]}`}>
                    {c.rank}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Commands;
