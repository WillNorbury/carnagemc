export const ALL_ROLES = [
  { value: "owner", label: "Owner", emoji: "👑" },
  { value: "director", label: "Director", emoji: "🎬" },
  { value: "exec_manager", label: "Executive Manager", emoji: "💼" },
  { value: "sr_manager", label: "Senior Manager", emoji: "📋" },
  { value: "manager", label: "Manager", emoji: "📌" },
  { value: "community_manager", label: "Community Manager", emoji: "🌟" },
  { value: "lead_developer", label: "Lead Developer", emoji: "🧠" },
  { value: "developer", label: "Developer", emoji: "🔧" },
  { value: "jr_developer", label: "Jr Developer", emoji: "✏️" },
  { value: "bot_developer", label: "Bot Developer", emoji: "🤖" },
  { value: "sr_admin", label: "Senior Admin", emoji: "🛡️" },
  { value: "admin", label: "Admin", emoji: "🛡️" },
  { value: "trial_admin", label: "Trial Admin", emoji: "⚔️" },
  { value: "jr_admin", label: "Jr Admin", emoji: "🛠️" },
  { value: "sr_mod", label: "Senior Moderator", emoji: "⚡" },
  { value: "mod", label: "Moderator", emoji: "🔨" },
  { value: "trial_mod", label: "Trial Moderator", emoji: "🌿" },
  { value: "chat_monitor", label: "Chat Monitor", emoji: "💬" },
  { value: "sr_helper", label: "Senior Helper", emoji: "💚" },
  { value: "helper", label: "Helper", emoji: "🟢" },
  { value: "trainee", label: "Trainee", emoji: "🌱" },
  { value: "partner", label: "Partner", emoji: "🤝" },
  { value: "content_creator", label: "Content Creator", emoji: "🎥" },
  { value: "og", label: "OG", emoji: "✨" },
  { value: "champion", label: "Champion", emoji: "🏆" },
  { value: "media", label: "Media", emoji: "📰" },
  { value: "elite", label: "Elite", emoji: "💎" },
  { value: "mvp", label: "MVP", emoji: "🌟" },
  { value: "vip", label: "VIP", emoji: "⭐" },
  { value: "booster", label: "Booster", emoji: "🚀" },
  { value: "member", label: "Member", emoji: "👤" },
  { value: "default", label: "Default", emoji: "👤" },
] as const;

export type AppRole = typeof ALL_ROLES[number]["value"];

export const STAFF_ROLES: AppRole[] = [
  "owner",
  "director",
  "exec_manager",
  "sr_manager",
  "manager",
  "community_manager",
  "lead_developer",
  "developer",
  "jr_developer",
  "bot_developer",
  "sr_admin",
  "admin",
  "trial_admin",
  "jr_admin",
  "sr_mod",
  "mod",
  "trial_mod",
  "chat_monitor",
  "sr_helper",
  "helper",
  "trainee",
];

export const isStaffRole = (v: string) => STAFF_ROLES.includes(v as AppRole);

export const roleLabel = (v: string) => {
  const r = ALL_ROLES.find((x) => x.value === v);
  return r ? `${r.emoji} ${r.label}` : v;
};

export const roleEmoji = (v: string) =>
  ALL_ROLES.find((r) => r.value === v)?.emoji ?? "";

export const roleLabelWithEmoji = (v: string) => {
  const r = ALL_ROLES.find((x) => x.value === v);
  return r ? `${r.emoji} ${r.label}` : v;
};
