import { supabase } from "@/integrations/supabase/client";

export type GameMode = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  long_description: string | null;
  banner_url: string | null;
  icon: string;
  accent: string;
  features: string[];
  screenshots: string[];
  server_ip: string | null;
  status: string;
  sort_order: number;
  published: boolean;
};

const COLUMNS =
  "id, slug, name, tagline, description, long_description, banner_url, icon, accent, features, screenshots, server_ip, status, sort_order, published";

export async function fetchGameModes(): Promise<GameMode[]> {
  const { data } = await supabase
    .from("game_modes")
    .select(COLUMNS)
    .eq("published", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as GameMode[];
}

export async function fetchGameMode(slug: string): Promise<GameMode | null> {
  const { data } = await supabase
    .from("game_modes")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return (data as GameMode) ?? null;
}

export const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  beta: "Beta",
  soon: "Coming soon",
  maintenance: "Maintenance",
};
