export const ALL_ROLES = [
  { value: "owner", label: "Owner", emoji: "👑" },
  { value: "manager", label: "Manager", emoji: "📌" },
  { value: "developer", label: "Developer", emoji: "🔧" },
  { value: "sr_admin", label: "SrAdmin", emoji: "🛡️" },
  { value: "admin", label: "Admin", emoji: "🛡️" },
  { value: "sr_mod", label: "SrMod", emoji: "⚡" },
  { value: "mod", label: "Mod", emoji: "🔨" },
  { value: "sr_helper", label: "SrHelper", emoji: "💚" },
  { value: "helper", label: "Helper", emoji: "🟢" },
  { value: "media", label: "Media", emoji: "📰" },
  { value: "havoc_plus", label: "Havoc+", emoji: "💎" },
  { value: "havoc", label: "Havoc", emoji: "🔥" },
  { value: "donut_plus", label: "Donut+", emoji: "🍩" },
  { value: "default", label: "Member", emoji: "👤" },
] as const;

export type AppRole = typeof ALL_ROLES[number]["value"];

export const STAFF_ROLES: AppRole[] = [
  "owner",
  "manager",
  "developer",
  "sr_admin",
  "admin",
  "sr_mod",
  "mod",
  "sr_helper",
  "helper",
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
