
-- Perks for rank upgrades
UPDATE public.store_items SET perks = ARRAY['Instant tier jump — keep your existing perks','Pay only the price difference','No rank reset or downtime','Applies across all seasons','Upgrade token delivered in-game instantly']
 WHERE id = '4a4fd8f5-ffc7-43aa-9611-e5d24eceb93e';
UPDATE public.store_items SET perks = ARRAY['Instant tier jump — keep your existing perks','Pay only the price difference','No rank reset or downtime','Applies across all seasons','Upgrade token delivered in-game instantly','Includes Titan cosmetic wings','Early access to new seasons']
 WHERE id = '7fd2bbf3-c3be-4c3a-86d2-7cccb702ff2f';

-- Keys
UPDATE public.store_items SET perks = ARRAY['1 crate key','Common → Rare loot pool','Guaranteed cosmetic drop','Tradeable with other players']
 WHERE id = '9ae54e1c-4b3b-4ec9-906d-5e9e2c88c227';
UPDATE public.store_items SET perks = ARRAY['1 crate key','Common → Rare loot pool','Guaranteed cosmetic drop','Tradeable with other players','AFK-pool exclusive rewards','Chance at enchanted gear']
 WHERE id = '1ce28544-0e01-483c-98a7-0e19d7d8dc75';
UPDATE public.store_items SET perks = ARRAY['1 crate key','Common → Rare loot pool','Guaranteed cosmetic drop','Tradeable with other players','Chance at enchanted gear','KOTH-exclusive loot pool','Chance at a rare cosmetic pet']
 WHERE id = 'bd5810e3-2f4b-4889-adb8-91dca2041f99';
UPDATE public.store_items SET perks = ARRAY['1 crate key','Guaranteed cosmetic drop','Tradeable with other players','Chance at enchanted gear','KOTH-exclusive loot pool','Chance at a rare cosmetic pet','Epic → Legendary loot pool','Guaranteed rare or better']
 WHERE id = 'c0c669e4-29e2-4041-8e1c-1676f4d3aa24';
UPDATE public.store_items SET perks = ARRAY['1 crate key','Guaranteed cosmetic drop','Tradeable with other players','Chance at enchanted gear','KOTH-exclusive loot pool','Chance at a rare cosmetic pet','Epic → Legendary loot pool','Guaranteed rare or better','Guaranteed epic or better','Chance at a season-exclusive title']
 WHERE id = '3301348b-1540-468a-ac09-f7ecdde8dca9';

-- Kits
UPDATE public.store_items SET perks = ARRAY['Full starter armour set','Carnage rank included','500 in-game dollars','Weekly kit cooldown','Colored chat & custom nickname']
 WHERE id = '2b0556fa-3077-450b-8fe6-2a593493abab';
UPDATE public.store_items SET perks = ARRAY['Full starter armour set','Weekly kit cooldown','Colored chat & custom nickname','Enchanted gear set','2000 coins included','Priority queue on full servers','Bonus cosmetic crate key']
 WHERE id = '8f61a616-77b8-4c07-8d74-1b0e1c77f6a7';

-- Coins
UPDATE public.store_items SET perks = ARRAY['500 coins','Spendable on kits & cosmetics','Usable in the player market','Delivered instantly']
 WHERE id = '29fabd32-8304-49ed-b359-e84a8ef981cb';
UPDATE public.store_items SET perks = ARRAY['2000 coins','Spendable on kits & cosmetics','Usable in the player market','Delivered instantly','10% bonus coins','Carries over between seasons']
 WHERE id = 'e083176b-ac90-4dc8-b4ab-dae89e8c5b34';

-- New categories
INSERT INTO public.store_categories (slug, name, description, icon, sort_order, published)
VALUES
 ('gems','Gems','Premium currency for exclusive cosmetics and boosters.','Gem',70,true),
 ('shards','Shards','Craft and reroll cosmetics with shards.','Sparkles',80,true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.store_items (category_id, name, description, price, currency, sort_order, published, perks)
SELECT c.id, v.name, v.description, v.price, 'USD', v.sort_order, true, v.perks
FROM public.store_categories c
JOIN (VALUES
 ('gems','250 Gems','Starter gem pack.',4.99,0,ARRAY['250 gems','Spend on exclusive cosmetics','Never expires','Delivered instantly']),
 ('gems','800 Gems','Best-selling gem pack with bonus gems.',14.99,1,ARRAY['800 gems','Spend on exclusive cosmetics','Never expires','Delivered instantly','15% bonus gems','Unlocks the gem-only cosmetic shop']),
 ('gems','2000 Gems','Best value gem pack.',29.99,2,ARRAY['2000 gems','Spend on exclusive cosmetics','Never expires','Delivered instantly','15% bonus gems','Unlocks the gem-only cosmetic shop','30% bonus gems','Exclusive gem-tier chat prefix','1 free cosmetic reroll each week']),
 ('shards','100 Shards','Reroll and craft cosmetics.',3.99,0,ARRAY['100 shards','Reroll cosmetic drops','Craft cosmetic pieces','Delivered instantly']),
 ('shards','500 Shards','Bulk shard pack with bonus shards.',14.99,1,ARRAY['500 shards','Reroll cosmetic drops','Craft cosmetic pieces','Delivered instantly','20% bonus shards','Unlock shard-only recipes']),
 ('shards','1500 Shards','Best value shard pack.',34.99,2,ARRAY['1500 shards','Reroll cosmetic drops','Craft cosmetic pieces','Delivered instantly','20% bonus shards','Unlock shard-only recipes','35% bonus shards','Guaranteed legendary craft token'])
) AS v(slug, name, description, price, sort_order, perks) ON v.slug = c.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_items i WHERE i.category_id = c.id AND i.name = v.name
);
