import { MessageCircle, Zap, Github, BookOpen, Bug, Globe, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SupportBadge = {
  key: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: LucideIcon;
  color: string; // tailwind color base, e.g. "emerald", "indigo"
};

const COLOR_STYLES: Record<string, { border: string; bg: string; icon: string; text: string }> = {
  emerald: {
    border: "border-emerald-500/40 hover:border-emerald-400/70",
    bg: "from-emerald-500/10 via-emerald-500/5",
    icon: "bg-emerald-500/20 text-emerald-400",
    text: "text-emerald-300",
  },
  indigo: {
    border: "border-indigo-500/40 hover:border-indigo-400/70",
    bg: "from-indigo-500/10 via-indigo-500/5",
    icon: "bg-indigo-500/20 text-indigo-400",
    text: "text-indigo-300",
  },
  sky: {
    border: "border-sky-500/40 hover:border-sky-400/70",
    bg: "from-sky-500/10 via-sky-500/5",
    icon: "bg-sky-500/20 text-sky-400",
    text: "text-sky-300",
  },
  amber: {
    border: "border-amber-500/40 hover:border-amber-400/70",
    bg: "from-amber-500/10 via-amber-500/5",
    icon: "bg-amber-500/20 text-amber-400",
    text: "text-amber-300",
  },
  rose: {
    border: "border-rose-500/40 hover:border-rose-400/70",
    bg: "from-rose-500/10 via-rose-500/5",
    icon: "bg-rose-500/20 text-rose-400",
    text: "text-rose-300",
  },
  slate: {
    border: "border-slate-500/40 hover:border-slate-400/70",
    bg: "from-slate-500/10 via-slate-500/5",
    icon: "bg-slate-500/20 text-slate-300",
    text: "text-slate-200",
  },
};

const BadgeCard = ({ badge }: { badge: SupportBadge }) => {
  const c = COLOR_STYLES[badge.color] ?? COLOR_STYLES.slate;
  const Icon = badge.icon;
  return (
    <a
      href={badge.href}
      target="_blank"
      rel="noreferrer noopener"
      className={`flex items-center gap-3 rounded-lg border ${c.border} bg-gradient-to-r ${c.bg} to-transparent px-4 py-3 transition-colors`}
    >
      <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${c.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className={`text-sm font-semibold ${c.text}`}>{badge.label}</div>
        {badge.sublabel && (
          <div className="text-xs text-muted-foreground truncate">{badge.sublabel}</div>
        )}
      </div>
    </a>
  );
};

type Props = {
  loaders?: string[];
  platforms?: string[];
  discordUrl?: string | null;
  sourceUrl?: string | null;
  wikiUrl?: string | null;
  issuesUrl?: string | null;
  websiteUrl?: string | null;
  extra?: SupportBadge[];
  className?: string;
};

const buildBadges = (p: Props): SupportBadge[] => {
  const badges: SupportBadge[] = [];
  const platforms = [
    ...(p.loaders ?? []),
    ...(p.platforms ?? []),
  ].map((x) => x.toLowerCase());

  if (platforms.includes("folia")) {
    badges.push({
      key: "folia",
      label: "Folia supported",
      sublabel: "PaperMC's multithreaded server",
      href: "https://papermc.io/software/folia",
      icon: Zap,
      color: "emerald",
    });
  }
  if (platforms.includes("paper")) {
    badges.push({
      key: "paper",
      label: "Paper supported",
      sublabel: "High-performance Minecraft server",
      href: "https://papermc.io/",
      icon: Server,
      color: "sky",
    });
  }
  if (p.discordUrl) {
    badges.push({
      key: "discord",
      label: "Join our Discord",
      sublabel: "Chat and support",
      href: p.discordUrl,
      icon: MessageCircle,
      color: "indigo",
    });
  }
  if (p.sourceUrl) {
    badges.push({
      key: "source",
      label: "Source code",
      sublabel: p.sourceUrl.replace(/^https?:\/\//, ""),
      href: p.sourceUrl,
      icon: Github,
      color: "slate",
    });
  }
  if (p.wikiUrl) {
    badges.push({
      key: "wiki",
      label: "Documentation",
      sublabel: "Wiki & guides",
      href: p.wikiUrl,
      icon: BookOpen,
      color: "amber",
    });
  }
  if (p.issuesUrl) {
    badges.push({
      key: "issues",
      label: "Report issues",
      sublabel: "Bug tracker",
      href: p.issuesUrl,
      icon: Bug,
      color: "rose",
    });
  }
  if (p.websiteUrl) {
    badges.push({
      key: "website",
      label: "Website",
      sublabel: p.websiteUrl.replace(/^https?:\/\//, ""),
      href: p.websiteUrl,
      icon: Globe,
      color: "sky",
    });
  }
  return [...badges, ...(p.extra ?? [])];
};

const PluginSupportBadges = (props: Props) => {
  const badges = buildBadges(props);
  if (badges.length === 0) return null;
  return (
    <div className={`not-prose ${props.className ?? "my-4"}`}>
      <div className="grid gap-2 sm:grid-cols-2">
        {badges.map((b) => (
          <BadgeCard key={b.key} badge={b} />
        ))}
      </div>
    </div>
  );
};

export default PluginSupportBadges;
