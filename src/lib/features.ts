import {
  Swords,
  Coins,
  Sparkles,
  Gift,
  PartyPopper,
  Zap,
  Heart,
  Crown,
  type LucideIcon,
} from "lucide-react";

export type Feature = {
  slug: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  long: string;
  highlights: string[];
};

export const FEATURES: Feature[] = [
  {
    slug: "lifesteal-pvp",
    icon: Swords,
    title: "Lifesteal PvP",
    desc: "Kill or be killed. Steal hearts from your enemies, lose yours when you die. Permadeath at zero.",
    long:
      "Every player starts with 10 hearts. Slay another player and steal one of theirs — lose all your hearts and you're banned from the server until the next season reset. Hearts can be crafted, traded, and even gambled. The risk is real, and so is the reward. Learn the meta, build your base, and rise to the top of the leaderboard.",
    highlights: [
      "Steal hearts from kills",
      "Permadeath at zero hearts",
      "Tradeable & craftable hearts",
      "Seasonal leaderboard resets",
    ],
  },
  {
    slug: "economy-system",
    icon: Coins,
    title: "Economy System",
    desc: "A player-driven market. Trade, auction, and build empires with our balanced economy.",
    long:
      "An entirely player-driven economy with shops, auctions, and a global marketplace. Set up your own shop, list rare drops in the auction house, and build wealth through trade. Currency is earned in-game — no pay-to-win shortcuts. Smart traders can corner markets and become server-renowned tycoons.",
    highlights: ["Player shops & auctions", "Global marketplace", "No pay-to-win", "Earn currency in-game"],
  },
  {
    slug: "custom-enchants",
    icon: Sparkles,
    title: "Custom Enchants",
    desc: "Over 80 unique enchantments crafted to give you the edge in combat and survival.",
    long:
      "More than 80 custom enchantments designed exclusively for ZyphoraMC. From Lifesteal V and Soulbound to Implants and Rocket Escape, every enchant is balanced for both PvP and PvE. Discover them through enchantment books found in crates, mob drops, and special events.",
    highlights: ["80+ exclusive enchants", "Balanced for PvP & PvE", "Found in crates & drops", "Books & tomes system"],
  },
  {
    slug: "daily-rewards",
    icon: Gift,
    title: "Daily Rewards",
    desc: "Login streaks, vote crates, and seasonal bundles you can claim every single day.",
    long:
      "Log in daily to claim escalating rewards — currency, keys, custom items, and exclusive cosmetics. Maintain your streak for bonus seasonal bundles. Vote on listing sites for additional crate keys, and claim seasonal pass rewards as you level up your account.",
    highlights: ["Daily login streaks", "Vote crate keys", "Seasonal pass rewards", "Exclusive cosmetics"],
  },
  {
    slug: "events-and-giveaways",
    icon: PartyPopper,
    title: "Events & Giveaways",
    desc: "Weekly tournaments, boss raids, and giveaways with real and in-game prizes.",
    long:
      "Weekly PvP tournaments, world-boss raids, capture-the-flag, parkour challenges, and treasure hunts. Win in-game items, currency, and even real-world prizes including gift cards and merch. Special seasonal events run during holidays with exclusive cosmetics you can't get any other way.",
    highlights: ["Weekly tournaments", "World boss raids", "Real-world prizes", "Holiday-exclusive cosmetics"],
  },
  {
    slug: "lag-free-gameplay",
    icon: Zap,
    title: "Lag-Free Gameplay",
    desc: "Dedicated hardware, optimized Paper builds, and 99.9% uptime. Smooth at every TPS.",
    long:
      "Hosted on dedicated enterprise-grade hardware with NVMe storage, DDoS protection, and 99.9% uptime. Running optimized Paper and Purpur builds with custom plugins tuned for performance. Server-wide TPS rarely dips below 19.8 — even during massive raids and events.",
    highlights: ["Dedicated hardware + NVMe", "DDoS protection", "99.9% uptime SLA", "TPS 19.8+ under load"],
  },
  {
    slug: "friendly-community",
    icon: Heart,
    title: "Friendly Community",
    desc: "An active Discord, dedicated staff, and zero tolerance for toxicity. You belong here.",
    long:
      "Thousands of active members across our Discord and in-game. A dedicated, trained staff team is online 24/7 to help with questions, disputes, and reports. Strict zero-tolerance policy on harassment, slurs, and cheating. We pride ourselves on being one of the friendliest servers in the scene.",
    highlights: ["24/7 staff coverage", "Active Discord community", "Zero-tolerance moderation", "Welcoming culture"],
  },
  {
    slug: "ranked-seasons",
    icon: Crown,
    title: "Ranked Seasons",
    desc: "Climb the leaderboard, earn exclusive cosmetics, and lock your name in our hall of fame.",
    long:
      "Compete across 3-month seasons for placement on the global leaderboard. Top players earn exclusive titles, cosmetic items, custom particles, and a permanent place in the ZyphoraMC Hall of Fame. Each new season brings a fresh map, balance updates, and new content to master.",
    highlights: ["3-month seasons", "Exclusive cosmetic rewards", "Hall of fame", "Fresh map each season"],
  },
];

export const featureBySlug = (slug?: string) => FEATURES.find((f) => f.slug === slug);
