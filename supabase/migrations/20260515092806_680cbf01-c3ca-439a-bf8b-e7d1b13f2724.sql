
CREATE TABLE public.features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  icon text NOT NULL DEFAULT 'Sparkles',
  description text NOT NULL,
  long_description text NOT NULL DEFAULT '',
  highlights text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Features published public read"
  ON public.features FOR SELECT
  USING (published);

CREATE POLICY "Admins view all features"
  ON public.features FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage features"
  ON public.features FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER features_set_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.features (slug, title, icon, description, long_description, highlights, sort_order) VALUES
('lifesteal-pvp','Lifesteal PvP','Swords','Kill or be killed. Steal hearts from your enemies, lose yours when you die. Permadeath at zero.','Every player starts with 10 hearts. Slay another player and steal one of theirs — lose all your hearts and you''re banned from the server until the next season reset. Hearts can be crafted, traded, and even gambled. The risk is real, and so is the reward. Learn the meta, build your base, and rise to the top of the leaderboard.', ARRAY['Steal hearts from kills','Permadeath at zero hearts','Tradeable & craftable hearts','Seasonal leaderboard resets'], 10),
('economy-system','Economy System','Coins','A player-driven market. Trade, auction, and build empires with our balanced economy.','An entirely player-driven economy with shops, auctions, and a global marketplace. Set up your own shop, list rare drops in the auction house, and build wealth through trade. Currency is earned in-game — no pay-to-win shortcuts. Smart traders can corner markets and become server-renowned tycoons.', ARRAY['Player shops & auctions','Global marketplace','No pay-to-win','Earn currency in-game'], 20),
('custom-enchants','Custom Enchants','Sparkles','Over 80 unique enchantments crafted to give you the edge in combat and survival.','More than 80 custom enchantments designed exclusively for ZyphoraMC. From Lifesteal V and Soulbound to Implants and Rocket Escape, every enchant is balanced for both PvP and PvE. Discover them through enchantment books found in crates, mob drops, and special events.', ARRAY['80+ exclusive enchants','Balanced for PvP & PvE','Found in crates & drops','Books & tomes system'], 30),
('daily-rewards','Daily Rewards','Gift','Login streaks, vote crates, and seasonal bundles you can claim every single day.','Log in daily to claim escalating rewards — currency, keys, custom items, and exclusive cosmetics. Maintain your streak for bonus seasonal bundles. Vote on listing sites for additional crate keys, and claim seasonal pass rewards as you level up your account.', ARRAY['Daily login streaks','Vote crate keys','Seasonal pass rewards','Exclusive cosmetics'], 40),
('events-and-giveaways','Events & Giveaways','PartyPopper','Weekly tournaments, boss raids, and giveaways with real and in-game prizes.','Weekly PvP tournaments, world-boss raids, capture-the-flag, parkour challenges, and treasure hunts. Win in-game items, currency, and even real-world prizes including gift cards and merch. Special seasonal events run during holidays with exclusive cosmetics you can''t get any other way.', ARRAY['Weekly tournaments','World boss raids','Real-world prizes','Holiday-exclusive cosmetics'], 50),
('lag-free-gameplay','Lag-Free Gameplay','Zap','Dedicated hardware, optimized Paper builds, and 99.9% uptime. Smooth at every TPS.','Hosted on dedicated enterprise-grade hardware with NVMe storage, DDoS protection, and 99.9% uptime. Running optimized Paper and Purpur builds with custom plugins tuned for performance. Server-wide TPS rarely dips below 19.8 — even during massive raids and events.', ARRAY['Dedicated hardware + NVMe','DDoS protection','99.9% uptime SLA','TPS 19.8+ under load'], 60),
('friendly-community','Friendly Community','Heart','An active Discord, dedicated staff, and zero tolerance for toxicity. You belong here.','Thousands of active members across our Discord and in-game. A dedicated, trained staff team is online 24/7 to help with questions, disputes, and reports. Strict zero-tolerance policy on harassment, slurs, and cheating. We pride ourselves on being one of the friendliest servers in the scene.', ARRAY['24/7 staff coverage','Active Discord community','Zero-tolerance moderation','Welcoming culture'], 70),
('ranked-seasons','Ranked Seasons','Crown','Climb the leaderboard, earn exclusive cosmetics, and lock your name in our hall of fame.','Compete across 3-month seasons for placement on the global leaderboard. Top players earn exclusive titles, cosmetic items, custom particles, and a permanent place in the ZyphoraMC Hall of Fame. Each new season brings a fresh map, balance updates, and new content to master.', ARRAY['3-month seasons','Exclusive cosmetic rewards','Hall of fame','Fresh map each season'], 80);
