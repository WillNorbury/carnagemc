import {
  Swords,
  Coins,
  Sparkles,
  Gift,
  PartyPopper,
  Zap,
  Heart,
  Crown,
  Shield,
  Star,
  Trophy,
  Rocket,
  Flame,
  Skull,
  Gem,
  Map,
  Hammer,
  Bot,
  ShieldCheck,
  MessageSquare,
  Users,
  Gavel,
  Ban,
  Scale,
  Gamepad2,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Swords,
  Coins,
  Sparkles,
  Gift,
  PartyPopper,
  Zap,
  Heart,
  Crown,
  Shield,
  ShieldCheck,
  Star,
  Trophy,
  Rocket,
  Flame,
  Skull,
  Gem,
  Map,
  Hammer,
  Bot,
  MessageSquare,
  Users,
  Gavel,
  Ban,
  Scale,
  Gamepad2,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

export const getIcon = (name: string | null | undefined): LucideIcon =>
  (name && ICON_REGISTRY[name]) || Sparkles;

export type Feature = {
  id?: string;
  slug: string;
  icon: LucideIcon;
  iconName: string;
  title: string;
  desc: string;
  long: string;
  highlights: string[];
  sort_order?: number;
  published?: boolean;
};

const mapRow = (r: any): Feature => ({
  id: r.id,
  slug: r.slug,
  iconName: r.icon,
  icon: getIcon(r.icon),
  title: r.title,
  desc: r.description,
  long: r.long_description ?? "",
  highlights: r.highlights ?? [],
  sort_order: r.sort_order,
  published: r.published,
});

export const fetchFeatures = async (opts: { includeUnpublished?: boolean } = {}): Promise<Feature[]> => {
  let q = supabase.from("features").select("*").order("sort_order", { ascending: true });
  if (!opts.includeUnpublished) q = q.eq("published", true);
  const { data } = await q;
  return (data ?? []).map(mapRow);
};

export const fetchFeatureBySlug = async (slug: string): Promise<Feature | null> => {
  const { data } = await supabase.from("features").select("*").eq("slug", slug).maybeSingle();
  return data ? mapRow(data) : null;
};
