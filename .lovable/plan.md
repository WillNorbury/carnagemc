## Context

The site already has working, backend-connected versions of most requested pages: Home, News, Leaderboards, Staff, Store, Rules, FAQ, Status, Gallery, Vote, Events, Support, Dashboard, and Careers (via `/apply`). Replacing those with placeholder-data rebuilds would remove real functionality, so the plan keeps their data layers and upgrades presentation instead.

Genuinely missing: Game Modes pages, Privacy Policy, Terms of Service, Refund Policy.

## Phase 1 — New pages (nothing exists today)

**Game Modes**
- `/gamemodes` — grid of glass cards for Survival, Lifesteal, 4Dupe, Hub-2, each with banner art, tagline, live player count, and hover lift.
- `/gamemodes/:slug` — detail page: full-width banner, gameplay description, feature list, screenshots strip with lightbox, "Join Server" IP copy button, related modes.
- Content stored in a `game_modes` table so you can edit modes from the admin panel rather than hardcoding.

**Legal pages**
- `/privacy`, `/terms`, `/refund` — clean long-form editorial layout, sticky section nav, last-updated date. Copy drafted from your actual store/ticket/data flows, marked for your review before publishing.

## Phase 2 — Shared design system pass

Introduce reusable primitives so every page inherits the AAA feel instead of one-off styling:
- `GlassCard`, `SectionHeader`, `StatTile`, `GradientButton`, `PageHero`
- Scroll-reveal wrapper (IntersectionObserver, respects reduced-motion)
- Animated counters reused across Home / Status / Leaderboards
- Consistent radius, spacing scale, and orange→amber gradient tokens in `index.css`

## Phase 3 — Upgrade existing pages (data untouched)

- **Home**: animated hero with parallax layers, IP copy button, live player count + status pill, featured game modes row, "Why CarnageMC", recent announcements, triple CTA.
- **Leaderboards**: animated podium for top 3, tab set expanded to Richest / Kills / Deaths / Killstreak / Playtime / Votes / Balance / Mob Kills.
- **Staff**: grouped by rank (Owner → Builder), avatar, role colour, description, Discord button.
- **News**: featured post hero, category chips, tag filter, search, pagination.
- **Gallery**: true masonry, video support, hover zoom, improved lightbox.
- **Vote / Events / Support / Rules / FAQ / Status / Store**: styling and layout polish to match the new system; existing logic preserved.

## Technical notes

- Orange / black / dark-gray branding kept; all colour via semantic tokens, no hardcoded hex in components.
- New tables (`game_modes`, screenshots) get RLS + GRANTs; public read, admin write.
- Pages are lazy-loaded via route-level code splitting to protect load time.
- Each page gets `<SEO>` with unique title, description, canonical, and JSON-LD where applicable.

## Suggested order

Phase 1 first (real gaps), then Phase 2, then Phase 3 in batches so you can review as we go rather than in one giant unreviewable change.
