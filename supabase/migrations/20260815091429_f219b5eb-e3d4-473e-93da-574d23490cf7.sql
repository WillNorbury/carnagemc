alter table public.store_items add column if not exists perks text[] not null default '{}';

update public.store_items set perks = array[
 'Colored chat & custom nickname','Priority queue on full servers','/kit carnage (weekly)','2 extra home points','Access to /hat and /nick','1.1x mob loot multiplier'
] where name = 'Carnage Rank';

update public.store_items set perks = array[
 'Everything in Carnage','/kit blood (weekly)','5 extra home points','Access to /feed and /heal (5m cooldown)','1.25x mob loot multiplier','Blood chat prefix & particle trail'
] where name = 'Blood Rank';

update public.store_items set perks = array[
 'Everything in Blood','/kit chaos (weekly)','10 extra home points','Access to /fly in claimed regions','1.5x mob loot multiplier','2 extra auction house slots','Chaos cosmetic pet'
] where name = 'Chaos Rank';

update public.store_items set perks = array[
 'Everything in Chaos','/kit titan (weekly)','Unlimited home points','Access to /fly server-wide (non-PvP)','2x mob loot multiplier','5 extra auction house slots','Titan cosmetic wings','Early access to new seasons'
] where name = 'Titan Rank';