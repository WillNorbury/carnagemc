export type UserSlugProfile = {
  id: string;
  display_name: string | null;
  mc_username: string | null;
};

export const toUserSlug = (value: string | null | undefined) => {
  const slug = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || null;
};

export const userProfileSlug = (profile: UserSlugProfile) =>
  toUserSlug(profile.mc_username) ?? toUserSlug(profile.display_name) ?? profile.id.slice(0, 8).toLowerCase();

export const userProfilePath = (profile: UserSlugProfile) => `/user/${userProfileSlug(profile)}`;

export const matchesUserSlug = (profile: UserSlugProfile, slug: string) => {
  const normalized = toUserSlug(slug);
  if (!normalized) return false;

  return (
    toUserSlug(profile.mc_username) === normalized ||
    toUserSlug(profile.display_name) === normalized ||
    profile.id.toLowerCase().startsWith(normalized)
  );
};