export const ALL_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "developer", label: "Developer" },
  { value: "sr_admin", label: "Sr Admin" },
  { value: "admin", label: "Admin" },
  { value: "jr_admin", label: "Jr Admin" },
  { value: "sr_mod", label: "Sr Mod" },
  { value: "mod", label: "Mod" },
  { value: "sr_helper", label: "Sr Helper" },
  { value: "helper", label: "Helper" },
  { value: "champion", label: "Champion" },
  { value: "media", label: "Media" },
  { value: "elite", label: "Elite" },
  { value: "mvp", label: "MVP" },
  { value: "vip", label: "VIP" },
  { value: "booster", label: "Booster" },
  { value: "default", label: "Default" },
] as const;

export type AppRole = typeof ALL_ROLES[number]["value"];

export const STAFF_ROLES: AppRole[] = [
  "owner",
  "manager",
  "developer",
  "sr_admin",
  "admin",
  "jr_admin",
  "sr_mod",
  "mod",
  "sr_helper",
  "helper",
];

export const isStaffRole = (v: string) => STAFF_ROLES.includes(v as AppRole);

export const roleLabel = (v: string) =>
  ALL_ROLES.find((r) => r.value === v)?.label ?? v;
