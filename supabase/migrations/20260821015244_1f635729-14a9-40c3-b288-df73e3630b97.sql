INSERT INTO public.wiki_articles (slug, title, category, excerpt, content, published, sort_order)
VALUES (
  'lifesteal-guide',
  'Lifesteal Guide: How Hearts Work on CarnageMC',
  'Game Modes',
  'How hearts are gained and lost on CarnageMC Lifesteal, what happens when you run out, and how to protect your hearts.',
  $md$# Lifesteal Guide: How Hearts Work on CarnageMC

**CarnageMC Lifesteal** is competitive survival where your health bar is the score. Defeat another player and you take a heart from them. Die, and you lose one of your own. Every fight permanently changes how much health you carry into the next one.

Join on Java or Bedrock at `play.carnagemc.net`, then pick the **Lifesteal** world from the server selector.

## The core heart rule

* **Kill a player → you gain a heart, they lose one.** Hearts transfer directly between the two players involved.
* **Die → you lose a heart.** The loss carries over between sessions; hearts do not regenerate on their own over time.
* **Run low → survival gets brutal.** With fewer hearts you die faster, so a losing streak compounds. Retreat, regroup and rebuild before re-engaging.

Because hearts move between players rather than appearing from nowhere, a fight is always a real risk: you are wagering part of your health bar on the outcome.

## Getting hearts back

If you're low, the safest routes back up are:

1. **Win fights you're favoured in.** Full gear, potions and a teammate beat a fair duel every time.
2. **Play the economy.** Sell drops, farm output and rare loot through player shops and the auction house, then buy gear that lets you win fights instead of gambling on them.
3. **Run quests, crates and events.** Daily and weekly quests, crate rewards and community events all feed gear and resources back into your account.

## Protecting the hearts you have

* **Hide your base.** Distance from spawn beats fancy defences. Don't build in the open along main paths.
* **Claim your land.** Player claims stop casual griefing while you're offline.
* **Never carry everything.** Store spare gear in a stash so one bad fight doesn't wipe your kit and your hearts.
* **Watch your alliances.** Teams are powerful, but betrayal is part of Lifesteal — share a base only with people you'd trust with your hearts.
* **Use the resource world.** Gather in the resource world instead of near your base so you don't leave a trail home.

## Gear that changes fights

Lifesteal runs custom enchantments, custom fishing, crates and a full player economy. Since hearts are the stake in every fight, the practical priority order is armour first, then weapon enchants, then utility (pearls, gapples, potions). A player with a heart advantage but no gear still loses to a well-equipped opponent.

## Quick reference

| Action | Heart change |
| --- | --- |
| Kill a player | +1 for you, −1 for them |
| Die to a player | −1 for you, +1 for them |
| Die to the environment | −1 for you |
| Sitting safe in base | No change |

## Related pages

* [Game modes](/gamemodes) — every world on the network
* [How to join](/join) — Java, Bedrock and console setup
* [Rules](/rules) — what counts as fair play in PvP
* [Store](/store) — ranks, keys and kits

Exact heart caps and starting values can change between seasons — check the in-game `/lifesteal` info menu or ask in Discord for the current season's numbers.
$md$,
  true,
  50
)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, excerpt = EXCLUDED.excerpt, category = EXCLUDED.category, published = true;