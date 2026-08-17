# CarnageMC Route Audit + Recommendations

No pages created or deleted yet. This is the audit and the shortlist for your approval.

## 1. What already exists (full inventory)

**Core / marketing**
`/` `/features` `/features/:slug` `/gamemodes` `/gamemodes/:slug` `/gallery` `/live` `/map` `/partners` `/partners/:slug` `/vote` `/events` `/community` `/discord` `/trust` `/fire-market`

**Onboarding**
`/join` `/install` `/how-to-join` (CMS page) `/commands`

**News / updates**
`/news` (+ `/announcements` alias) `/news/:slug` `/changelog` `/changelog/:slug` `/release-notes`

**Status**
`/status` `/status/:number` `/status/unsubscribe` `/servers-status`

**Competitive**
`/leaderboard` `/punishments` `/punishments/:player` `/quiz` (+ 3 sub-routes)

**Community content**
`/plugins` `/plugins/:slug` `/skripts` `/skripts/:id` `/servers` `/servers/:slug` `/modrinth-plugins` `/resource-packs` `/modpacks` `/data-packs` `/shaders` `/mod/:slug` (+ detail routes) `/wiki` `/wiki/:slug` `/wiki/more` `/users` `/user/:slug` `/org/:slug` `/org/:slug/settings`

**Support / staff**
`/support` `/tickets` `/contact` `/faq` `/rules` `/staff` `/staffchat` `/apply` `/apply/:slug` `/appeal` `/ban-appeals`

**Account**
`/auth` `/reset-password` `/dashboard` `/profile` `/me` `/me/orders` `/me/status` `/me/wishlist` `/link-account` `/subscribe` `/unsubscribe`

**Store** (untouched)
`/store` `/store/category/:slug` `/store/package/:id` `/checkout`

**Legal**
`/privacy` `/terms` `/refund`

**Admin**
`/admin` + `/admin/*` tab routes

**CMS pages** (31 rows in `site_pages`, all auto-generated 3–4 section stubs)
guides, ranks-comparison, how-to-join, server-map, achievements, hall-of-fame, clans, suggestions, polls, media-team, about, roadmap, press-kit, credits, sitemap, anti-cheat, seasons, staff-handbook, bug-bounty, discord-rules, appeals-guide, pvp-guide, economy-guide, building-guide, community-standards, glossary, network-history, safety, brand-guidelines, support-guide, applications

**Redirect aliases already in place** (keep — they preserve URLs)
`/game-modes` `/privacy-policy` `/tos` `/refund-policy` `/mods` `/mod-tiers` `/discover*` `/cart` `/wishlist` `/orders` `/staff-chat` `/firemarket` `/announcements`

## 2. Verdict on your examples

Every page you named already exists: `/status`, `/how-to-join`, `/leaderboard`, `/store`, `/faq`, `/changelog`, `/staff`, `/support`, `/gamemodes`. Player profiles exist as `/user/:slug` and `/punishments/:player`. So: no `/how-to-play`, no `/server-status`, no `/rankings`, no `/player/:username`.

## 3. Genuinely missing — recommended additions (5)

1. **Branded 404** — `NotFound.tsx` is still the untouched template (plain grey box, no nav, no branding). Not a new route; a rewrite of the existing catch-all with navbar, crimson styling, and links to Home / Store / Status / Discord.
2. **Player profile by IGN** — `/user/:slug` is keyed to website accounts. Leaderboard rows point at in-game names with no destination. Add resolution from Minecraft username to a profile view (stats, punishments, rank) reusing existing `get_player_stats_by_name`. Can be folded into `/user/:slug` rather than a new route if you prefer.
3. **Search results page** — `GlobalSearch` is a modal only. A `/search?q=` results page makes search linkable and indexable.
4. **Seasons / season archive with real data** — `seasons` is a CMS stub. If seasons matter competitively, it deserves a real data-backed page (season, dates, winners) rather than static text.
5. **Sitemap page fed by real routes** — the `sitemap` CMS stub is hand-written and already stale. Replace with a generated index of live routes.

Nothing else in the audit looked like a real gap. Everything else worth doing is polish on pages that already exist.

## 4. Recommended deletions

**Delete (duplicates or empty filler, low/zero value)**
- `/servers-status` — duplicates `/status`. Convert to a redirect so the URL doesn't break.
- CMS stubs with no unique content and an existing equivalent: `ranks-comparison` (→ `/store` comparison), `server-map` (→ `/map`), `appeals-guide` (→ `/appeal`), `support-guide` (→ `/support`), `discord-rules` (→ `/rules`), `applications` (→ `/apply`), `sitemap` (replace per item 5 above).
- Low-value stubs unless you want to write real copy: `polls`, `suggestions`, `clans`, `hall-of-fame`, `media-team`, `glossary`, `network-history`, `bug-bounty`, `brand-guidelines`, `credits`.

**Keep** (thin today, but genuinely needed): about, guides, how-to-join, roadmap, press-kit, anti-cheat, seasons, staff-handbook, pvp-guide, economy-guide, building-guide, community-standards, safety, achievements.

Deletions would unpublish the `site_pages` rows and remove the sidebar links, leaving redirects where a URL was previously public — no hard 404s.

## 5. Proposed order once approved

1. Branded 404 + delete/redirect the filler set.
2. Polish pass on `/how-to-join`, `/status`, `/leaderboard` (hierarchy, server IP, loading/empty/error states, mobile).
3. Player-profile-by-IGN linking from the leaderboard.
4. `/search` results page.
5. Seasons + generated sitemap.

Store stays untouched throughout.
