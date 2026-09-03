# Release Notes

## Unreleased — 2026-08-23

### Changes

- _update_ **CarnageMC Network Changelog – August 23, 2026** — **1. 🤝 Official Partnership with 4Dupe**
We are proud to announce our official partnership with the 4Dupe network!
- **Server Upgrades:** Improved TPS and tick rates across all lobbies.
- **Staff Synergy:** We are merging our mod teams to provide 24/7 moderation coverage.

**2. 🏗️ BoxPvP – Coming Soon (ETA: 2-3 Weeks)**
We heard you loud and clear. The BoxPvP gamemode is currently in final development and is scheduled to launch within the next 2-3 weeks.
- **Features:** 1v1 Box fights, Killstreak leaderboards, and a brand new "Shulker Box" loot system.
- **Beta Access:** Closed Beta for Partners and staff begins next Friday.

## Unreleased — 2026-08-19

### Changes

- _update_ **Support Center polish & public changelog** — The /support page is now fully live: questions sent through the form reach staff for real (previously it only simulated sending), FAQs are pulled from the live knowledge base, your details are pre-filled when signed in, and the page links straight to tickets, the FAQ, and contact. The /changelog page continues to list every real update so visitors can track changes.

## Unreleased — 2026-08-17

### ⚠️ Breaking changes

- **Site polish: navigation, footer, 404 and page cleanup** — A cleanup and polish pass across the whole site:

- Rebuilt the footer as one cohesive block — matching headings, consistent link hover states, an even grid that collapses cleanly on mobile, real Java/Bedrock connection details, and a legal bar. It now uses the correct CarnageMC logo.
- Branded 404 page with navigation and quick links instead of the plain default.
- New /sitemap site index listing every live page.
- Retired duplicate and empty filler pages; their old URLs now redirect to the real equivalents (for example /servers-status now goes to /status), so no links break.
- Cleaned dead links out of the sidebar.
- Mobile and tablet fixes: the Twitch live badge no longer slides under the floating navbar, and the homepage hero no longer has a duplicate gap. No horizontal overflow at phone or tablet widths.

### Changes

- _update_ **Site polish: navigation, footer, 404 and page cleanup** — A cleanup and polish pass across the whole site:

- Rebuilt the footer as one cohesive block — matching headings, consistent link hover states, an even grid that collapses cleanly on mobile, real Java/Bedrock connection details, and a legal bar. It now uses the correct CarnageMC logo.
- Branded 404 page with navigation and quick links instead of the plain default.
- New /sitemap site index listing every live page.
- Retired duplicate and empty filler pages; their old URLs now redirect to the real equivalents (for example /servers-status now goes to /status), so no links break.
- Cleaned dead links out of the sidebar.
- Mobile and tablet fixes: the Twitch live badge no longer slides under the floating navbar, and the homepage hero no longer has a duplicate gap. No horizontal overflow at phone or tablet widths.

## Unreleased — 2026-08-15

### Changes

- _feature_ **Gameplay leaderboards, player stats & gallery videos** — ## Gameplay Leaderboards
The /leaderboard page now has 8 new gameplay stat tabs alongside the existing streak tabs: Kills, Deaths, KDR, Killstreak, Best Streak, Playtime, Balance, and Mob Kills. Each tab shows a podium for the top 3 and a ranked list below.

## Player Stats on Profiles
Public player profiles (/user/:name) now display an in-game stats card showing kills, deaths, KDR, current and best killstreak, playtime, balance, and mob kills — matched by Minecraft username. Stats appear automatically once the server bridge starts reporting.

## Gallery Video Support
The /gallery page now supports video clips (YouTube and Twitch) alongside images. Videos show a play-button thumbnail in the masonry grid and open as an embedded player in the lightbox. Admins can add videos from Admin → Gallery by pasting a URL.

## Server Bridge Stats Pipeline
The CarnageConsoleBridge Minecraft plugin now periodically reports per-player gameplay stats (kills, deaths, killstreak, playtime, balance, mob kills) to the website. The mc-bridge-poll edge function ingests and upserts them. **Action required:** rebuild and redeploy the ConsoleBridge plugin to start sending stats — the leaderboard and profile stats will populate automatically.
- _update_ **Store comparison expanded + Gems & Shards** — The store comparison table now covers Ranks, Rank Upgrades, Keys, Kits, Coins and the brand-new Gems and Shards categories. Switch categories with the tabs above the table to see exactly what each package includes before you buy.

## 1.0.0 — 2026-07-31

### ⚠️ Breaking changes

- **CarnageMC — Website Update** — **Version:** `1.0.0`
**Date:** July 31, 2026
**Type:** 🔧 Website / Applications Update

## ✨ Added

* Added an official announcement regarding application availability.
* Added updated application status information to the website.

## 🔄 Changed

* Updated the status of **Staff Applications** to `Closed`.
* Updated the status of **Admin Applications** to `Closed`.
* Updated the status of **Developer Applications** to `Closed`.

## 🗑️ Removed

* Removed the ability to submit new Staff applications.
* Removed the ability to submit new Admin applications.
* Removed the ability to submit new Developer applications.

## 🐛 Fixed

* Fixed application availability being unclear to members of the community.
* Fixed outdated application information across the website.

## 📢 Notes

Applications may reopen in the future when CarnageMC is looking to expand the team.

Keep an eye on our **website and Discord** for future application openings and announcements.

**Thanks for being part of CarnageMC! ❤️**

— **CarnageMC Team**

### Changes

- _update_ **CarnageMC — Website Update** — **Version:** `1.0.0`
**Date:** July 31, 2026
**Type:** 🔧 Website / Applications Update

## ✨ Added

* Added an official announcement regarding application availability.
* Added updated application status information to the website.

## 🔄 Changed

* Updated the status of **Staff Applications** to `Closed`.
* Updated the status of **Admin Applications** to `Closed`.
* Updated the status of **Developer Applications** to `Closed`.

## 🗑️ Removed

* Removed the ability to submit new Staff applications.
* Removed the ability to submit new Admin applications.
* Removed the ability to submit new Developer applications.

## 🐛 Fixed

* Fixed application availability being unclear to members of the community.
* Fixed outdated application information across the website.

## 📢 Notes

Applications may reopen in the future when CarnageMC is looking to expand the team.

Keep an eye on our **website and Discord** for future application openings and announcements.

**Thanks for being part of CarnageMC! ❤️**

— **CarnageMC Team**

## Unreleased — 2026-07-24

### Changes

- _feature_ **Community Skripts library** — We just shipped a full community Skripts system.

**What's new**
- Browse and download community `.sk` files at `/skripts` with search, tag filters, and sort options.
- Upload your own Skripts straight from `/dashboard` under **My Skripts** — publish or hide anytime.
- Attach a custom icon to each Skript, shown on the library grid and your dashboard.
- Click any Skript card to open a full detail page (`/skripts/:id`) styled to match plugin detail pages — download button, author, size, version, tags, and download counts.
- Downloads now save with the correct `.sk` filename via blob-fetch (no more messy storage-path names).
- Command-center style header on `/skripts` with live stats: total skripts, downloads, tags, and latest upload.

Head over to `/skripts` to see what the community has built, or `/dashboard` to share your own.

## Unreleased — 2026-07-14

### ⚠️ Breaking changes

- **Discord auto-posting disabled for changelog updates** — <p>Automatic Discord notifications for new changelog entries have been turned off. Updates are now sent to Discord manually by staff.</p><ul><li>Removed the database trigger and edge-function call that posted new entries to Discord.</li><li>The <a href="/changelog">changelog page</a> now shows which broadcast channels are active (Website + Email) and clearly marks Discord as manual-only.</li><li>Email subscribers are unaffected — publishing an entry still queues the newsletter.</li></ul>

### Changes

- _update_ **Status page layout refresh** — Cleaned up the Status page with a more natural service-history layout, tighter mobile spacing, and a bottom-sheet style service detail panel that prevents horizontal overflow.
- _update_ **Discord auto-posting disabled for changelog updates** — <p>Automatic Discord notifications for new changelog entries have been turned off. Updates are now sent to Discord manually by staff.</p><ul><li>Removed the database trigger and edge-function call that posted new entries to Discord.</li><li>The <a href="/changelog">changelog page</a> now shows which broadcast channels are active (Website + Email) and clearly marks Discord as manual-only.</li><li>Email subscribers are unaffected — publishing an entry still queues the newsletter.</li></ul>

## Unreleased — 2026-07-13

### ⚠️ Breaking changes

- **Security hardening, MySQL settings editor, and admin fixes** — Recent improvements:

**Security**
- Locked down plugin download tracking: anonymous inserts are no longer accepted directly; all downloads are recorded through the audited `record_plugin_download` server function.
- Hid user notification preferences on the public profile table so they can no longer be pulled in bulk — owners still read their own preferences via a secure server function.

**Admin panel**
- New MySQL connection editor at `/admin?tab=mysql` for updating the LiteBans database host, port, database, username, and password without redeploying.
- Fixed News admin: creating a new post no longer silently emails every subscriber — use the explicit Send button when you're ready.
- Fixed the FAQs and Events admin tabs so they render inside the admin layout and remain accessible to permission-based admins.

**Community**
- Added a `/discord` shortcut that redirects to https://discord.warden.rip.


### Changes

- _update_ **Features page updated with current servers** — The <a href="/features">/features</a> page has been refreshed to highlight the servers you can play right now:

<ul>
  <li><strong>Survival (S1)</strong> — our live flagship Season 1 world with land claims, a player-driven economy, community events, and classic multiplayer survival.</li>
  <li><strong>Lifesteal (Development)</strong> — heart-stealing PvP currently in active development. Steal hearts from kills, face permadeath at zero hearts, and help shape the mode before it launches.</li>
</ul>

Each server gets its own feature card with details on what to expect. More modes and updates will be added as they roll out.
- _update_ **Security hardening, MySQL settings editor, and admin fixes** — Recent improvements:

**Security**
- Locked down plugin download tracking: anonymous inserts are no longer accepted directly; all downloads are recorded through the audited `record_plugin_download` server function.
- Hid user notification preferences on the public profile table so they can no longer be pulled in bulk — owners still read their own preferences via a secure server function.

**Admin panel**
- New MySQL connection editor at `/admin?tab=mysql` for updating the LiteBans database host, port, database, username, and password without redeploying.
- Fixed News admin: creating a new post no longer silently emails every subscriber — use the explicit Send button when you're ready.
- Fixed the FAQs and Events admin tabs so they render inside the admin layout and remain accessible to permission-based admins.

**Community**
- Added a `/discord` shortcut that redirects to https://discord.warden.rip.


## Unreleased — 2026-07-09

### Changes

- _feature_ **Fire Market embed, LiteBans MySQL admin, and auto Discord changelog posts** — <ul>
    <li><strong>/fire-market</strong> — new staff-only page embedding <a href="https://fire-market.dev" target="_blank" rel="noopener noreferrer">fire-market.dev</a>, mirroring the /staffchat setup with an "Open in new tab" shortcut.</li>
    <li><strong>Admin → LiteBans MySQL</strong> (<code>/admin?tab=mysql</code>) — owner-only tab with connection details, recommended GUI/CLI clients, ready-to-copy SQL snippets (lookup, soft-unban, unmute, recent punishments, delete warning), and safety notes. Direct-edit alternative to Admin → Punishments.</li>
    <li><strong>Changelog auto-posts to Discord</strong> — publishing any changelog entry now automatically posts a rich embed to the staff Discord channel via the bot. A per-entry flag prevents double posts, and the manual "Notify" button also fires the Discord post alongside subscriber emails.</li>
  </ul>

## Unreleased — 2026-07-08

### ⚠️ Breaking changes

- **Plugins hub upgrades, dashboard favorites, and embedded Staff Chat** — ## What's new

### Plugins & Dashboard
- **Real download counts** now show on plugin cards across `/plugins` and `/plugin/:slug`, tracked for every visitor (anonymous + signed-in).
- **Trending / Most Downloaded** section added to the top of `/plugins`, ranked by downloads over the last 7 days.
- **Favorite / bookmark buttons** on plugin cards and detail pages, persisted per user with live counts.
- **New "Most downloaded" sort** on the plugins filter bar.
- **Dashboard: My Favorites & Recently Downloaded** — new panel on `/dashboard` listing plugins you've favorited and your recent downloads, with inline unfavorite.
- Download and version dropdown menus on plugin pages now use a smooth expand/collapse animation.

### Staff Chat
- Staff Chat is now embedded directly at `/staffchat` (staff-only), with an "Open in new tab" fallback. Sidebar link updated to open it in-app.

### Site-wide
- **Update prompt**: a small GUI now pops up whenever the site has a new version, prompting you to reload.

### Security
- Quiz results can no longer be forged — all attempt submissions go through a server-side scoring function.
- Quiz answer explanations are no longer readable before/during an attempt.

### Changes

- _update_ **Plugins hub upgrades, dashboard favorites, and embedded Staff Chat** — ## What's new

### Plugins & Dashboard
- **Real download counts** now show on plugin cards across `/plugins` and `/plugin/:slug`, tracked for every visitor (anonymous + signed-in).
- **Trending / Most Downloaded** section added to the top of `/plugins`, ranked by downloads over the last 7 days.
- **Favorite / bookmark buttons** on plugin cards and detail pages, persisted per user with live counts.
- **New "Most downloaded" sort** on the plugins filter bar.
- **Dashboard: My Favorites & Recently Downloaded** — new panel on `/dashboard` listing plugins you've favorited and your recent downloads, with inline unfavorite.
- Download and version dropdown menus on plugin pages now use a smooth expand/collapse animation.

### Staff Chat
- Staff Chat is now embedded directly at `/staffchat` (staff-only), with an "Open in new tab" fallback. Sidebar link updated to open it in-app.

### Site-wide
- **Update prompt**: a small GUI now pops up whenever the site has a new version, prompting you to reload.

### Security
- Quiz results can no longer be forged — all attempt submissions go through a server-side scoring function.
- Quiz answer explanations are no longer readable before/during an attempt.

## Unreleased — 2026-07-04

### Changes

- _update_ **Molten Forge polish, /status fix & tighter storage security** — ## Plugins
- Redesigned the plugin download dialog with the **Molten Forge** treatment — glowing header slab, ember-lit game/platform selectors, and a fiery gradient download CTA.
- Applied the Molten Forge theme across `/plugins` and `/plugin/:slug` (forge hero band, radial glow slabs, gradient-underline tabs, glowing download buttons).
- Exported a public `data/plugins.json` snapshot of published plugins and documented it in the README.

## Status page
- Fixed a crash on `/status` caused by a range-selector type mismatch (default range now defaults to 90 days as intended).

## Security
- **mc-bridge-jars** bucket: read access is now restricted to owners only (previously any signed-in user could download bridge jars).
- **skripts** bucket: users can only read their own files; admins can read any.
- **resource-packs** bucket: users can only read their own uploads; admins can read any (the bucket was effectively public despite being marked private).

## Wiki
- Seeded `/wiki` with 8 starter articles (Getting Started, Server Rules Summary, Common Commands, Ranks & Perks, Voting & Rewards, Applying for Staff, Ban Appeals, Getting Support), all editable at `/admin?tab=wiki`.

## Site chrome
- Added a visible app version indicator in the footer, sourced from `package.json`.

## Unreleased — 2026-06-30

### Changes

- _feature_ **Owner Console: live Minecraft server bridge** — The owner-only Console now connects to your real Minecraft servers via a small bridge plugin.

- Multi-server picker with online/offline indicator
- Live tail of all server console output (chat, joins, errors, command results)
- Run real console commands from the browser; response streams back
- Add/manage servers from Admin → Console → Servers, with per-server ingest secret and one-click install instructions
- Outbound HTTPS only — no firewall changes needed on the MC host

Plugin source: mc-bridge-plugin/ in the repo.

## Unreleased — 2026-06-29

### Changes

- _feature_ **News email opt-out and delivery log** — ## What's new

- **News-only unsubscribe** — every news email now includes a one-click "Unsubscribe from news updates" link. Account and transactional emails keep flowing.
- **Per-news delivery log** — open any announcement in Admin → Announcements and click the new log icon to see who the email was queued to, whether it sent, was suppressed, or failed (with the error message).
- **Smarter broadcasts** — opt-outs and previously suppressed addresses are skipped automatically and counted in the broadcast result.
- _feature_ **Admin Punishments page with silent unban** — Added a Punishments tab in the admin panel. Filter bans, mutes, kicks, and warnings by player, type, and date range. Owners and admins can unban or unmute players directly from the web — silent by default (mirrors the in-game -s flag).

## Unreleased — 2026-06-28

### Changes

- _balance_ **Resetted everyones money** — The economy has been reset on **SMP**

What has been reset:
- **Balance**
- **Teams**
- **Shards**
- **Bounties**

## Unreleased — 2026-06-26

### Changes

- _feature_ **Interactive U.S. Tornado Deaths Map** — The /weather/tornado-deaths page now shows a real interactive choropleth map of the United States, color-coded green→red by tornado fatalities. Toggle between per-million-residents and total-deaths views, and hover any state for exact numbers.
- _feature_ **Editable application status emails + admin live clock** — - **Editable application emails** — From Admin → Applications, edit the subject and Markdown body sent for **approved**, **rejected**, and **pending** application status changes. Toggle each variant on/off and use variables like `{{mcUsername}}`, `{{applicationType}}`, `{{reviewerNotes}}`, and `{{dashboardUrl}}`.
- **Live clock in admin** — Your current local time and date now show in the admin top bar (mobile and desktop).

## Unreleased — 2026-06-25

### ⚠️ Breaking changes

- **Dependency Security Updates** — Upgraded @supabase/supabase-js, react-router-dom, and recharts to patch high-severity advisories in transitive dependencies.

### Changes

- _feature_ **Cart & Wishlist** — Added a local cart and wishlist for Discover listings. Save items, move between cart and wishlist, and sort your wishlist by newest, price, or name.
- _feature_ **Mock Checkout & Order History** — Cart checkout now generates a mock order and clears your cart. Purchase history is recorded locally and downloadable items unlock from the Orders page.
- _feature_ **Free / Paid Filters** — Mods, Plugins, Modpacks, Data Packs, Resource Packs, Shaders, and Skripts now display a Free/Paid badge and support filtering by pricing.
- _update_ **Dashboard: Shopping Panel** — Dashboard now shows your cart, wishlist, and order history at a glance with quick links to each page.
- _security_ **Dependency Security Updates** — Upgraded @supabase/supabase-js, react-router-dom, and recharts to patch high-severity advisories in transitive dependencies.
- _feature_ **Create from Dashboard** — Dashboard now has a Create section with a one-click shortcut to upload a Skript (.sk) and manage your plugins and Discover listings.
- _feature_ **Changelog Email Notifications** — New published changelog entries now email every confirmed user (excluding unsubscribed addresses) with a branded update from notify.warden.rip.
- _feature_ **Clickable changelog entries with detail pages** — Each changelog entry on /changelog is now clickable and opens a dedicated detail page at /changelog/<slug>.

**What's new:**
- Entries on the timeline are clickable cards with a hover affordance
- New detail route renders the full entry content as Markdown (headings, lists, links, code)
- Slugs are generated from the entry title (e.g. /changelog/dependency-security-updates)
- Back-to-changelog navigation and proper document title per entry
- _feature_ **Create Skripts from the dashboard + updates@ sender** — Two small improvements:

- **Upload Skripts without leaving /dashboard.** The Create panel now embeds the full skript upload form (file picker + metadata + publish toggle). The standalone /discover/skripts/new page still works and shares the same form.
- **Changelog notification emails now come from `updates@warden.rip`** instead of `noreply@`, with the friendly name "CarnageMC Updates".
- _server_ **Practice Server** — We have a new **Practice** server

**Commands**:
- /p announce
- /p invite <player>
- /duel <player>

## Unreleased — 2026-06-18

### ⚠️ Breaking changes

- **Security hardening: profile, quiz, and streak data** — Locked down sensitive columns and leaderboard reads: Discord identifiers are no longer exposed to anonymous visitors, quiz correct-answer flags are hidden from the client, and streak leaderboards now use a safe server-side function instead of broad public table access.

### Changes

- _security_ **Security hardening: profile, quiz, and streak data** — Locked down sensitive columns and leaderboard reads: Discord identifiers are no longer exposed to anonymous visitors, quiz correct-answer flags are hidden from the client, and streak leaderboards now use a safe server-side function instead of broad public table access.

## Unreleased — 2026-06-12

### ⚠️ Breaking changes

- **Two-factor enforcement at sign-in** — Accounts with an authenticator enrolled now must enter their 6-digit code during login before the session is granted.

### Changes

- _security_ **Two-factor enforcement at sign-in** — Accounts with an authenticator enrolled now must enter their 6-digit code during login before the session is granted.

## Unreleased — 2026-06-04

### Changes

- _fix_ **Bug fixes across admin tools** — Fixed sorting on the applications queue, broken pagination on the gallery admin, and a stale-cache issue on the FAQ editor.

## Unreleased — 2026-05-25

### Changes

- _update_ **Performance & mobile polish** — Sidebar swipe-to-open, faster route loading, reduced layout shift, and tighter mobile spacing across the site.

## Unreleased — 2026-05-07

### Changes

- _feature_ **Partners group added to sidebar** — New "Partners" group in the main navigation, starting with 4Dupe as the first listed partner.

## Unreleased — 2026-04-25

### Changes

- _update_ **Maintenance mode gate** — Admins can flip the site into maintenance mode, showing a branded gate to non-staff visitors.

## Unreleased — 2026-04-10

### Changes

- _feature_ **Global search & notifications bell** — Site-wide search palette (Cmd/Ctrl+K) and a notifications bell in the navbar for in-app alerts.

## Unreleased — 2026-03-21

### Changes

- _feature_ **User Reports admin area** — New /admin?tab=reports section lets staff review, triage, and resolve reports about accounts, plugins, and other content. Status filters, admin notes, and reporter details are all included.

## Unreleased — 2026-02-24

### Changes

- _feature_ **Organizations & team profiles** — Players can create organizations, invite members, and publish a public org profile page.

## Unreleased — 2026-02-04

### Changes

- _update_ **Admin alerts for new reports** — Whenever a user submits a report, every admin/owner gets an in-app notification, and an email is sent to the alert address when configured.

## Unreleased — 2026-01-15

### Changes

- _addition_ **Mods, modpacks, resource & data packs** — Browse pages for mods, modpacks, resource packs, and data packs, with detail views, likes, saves, and reviews.

## Unreleased — 2025-12-31

### Changes

- _update_ **Transactional email pipeline** — Migrated transactional email to a queued dispatcher with suppression list, unsubscribe tokens, and React Email templates.

## Unreleased — 2025-12-06

### Changes

- _feature_ **Uptime monitoring & status page** — Live uptime checks, incident timeline, and per-service 30-day uptime percentages on the status page.

## Unreleased — 2025-11-11

### Changes

- _addition_ **Login & vote streaks** — Daily login and vote streaks now track current and best runs, with a global streak leaderboard.

## Unreleased — 2025-10-17

### Changes

- _feature_ **Quiz system with leaderboards** — Added quizzes with timed attempts, scoring, per-quiz leaderboards, and an admin authoring area.

## Unreleased — 2025-09-22

### Changes

- _feature_ **Plugin marketplace beta** — Introduced the plugin marketplace with versions, screenshots, JAR uploads, likes, saves, and reviews.

## Unreleased — 2025-08-23

### Changes

- _feature_ **Ban appeals system launched** — New public ban appeal form with admin review queue, status updates, and email notifications to both the appellant and staff.

## Unreleased — 2025-07-29

### Changes

- _feature_ **Discord account linking** — Players can now link their Discord account from their profile, syncing username and avatar back to the site.

## v0.12.0 — 2025-06-19

### Changes

- _update_ **Sitemap & SEO pass** — Generated dynamic sitemap, added per-page Open Graph and Twitter cards, and structured data on detail pages.

## v0.11.1 — 2025-05-20

### Changes

- _fix_ **Bug fixes: tickets & search** — Fixed unread badge on tickets, garbled emojis in ticket replies, and search returning archived items.

## v0.11.0 — 2025-04-20

### ⚠️ Breaking changes

- **Email infrastructure: domain setup** — Configured a verified sender subdomain, SPF/DKIM, and a hardened From: address for all outgoing mail.

### Changes

- _security_ **Email infrastructure: domain setup** — Configured a verified sender subdomain, SPF/DKIM, and a hardened From: address for all outgoing mail.

## v0.10.1 — 2025-03-11

### Changes

- _addition_ **Reviews on mods & plugins** — Star ratings and written reviews on mods and plugins with one-review-per-user enforcement.

## v0.10.0 — 2025-01-30

### Changes

- _addition_ **Discover items hub** — Unified discover hub for community-submitted builds, datapacks, and resources with slugged detail pages.

## v0.9.1 — 2024-12-21

### Changes

- _feature_ **Support tickets** — Players can open private support tickets with threaded messaging between user and staff.

## v0.9.0 — 2024-11-11

### Changes

- _feature_ **Custom roles & permissions** — Granular custom roles and a permissions matrix so owners can scope what each role can do in the admin panel.

## v0.8.0 — 2024-10-02

### Changes

- _feature_ **Wiki articles** — Admins can publish long-form wiki articles with rich formatting and a public browse page.

## v0.7.1 — 2024-08-23

### Changes

- _feature_ **FAQ with voting** — New FAQ section with categories, search, and helpful/unhelpful voting.

## v0.7.0 — 2024-07-24

### Changes

- _feature_ **Gallery launched** — Community gallery with screenshot uploads, captions, and an admin moderation queue.

## v0.6.2 — 2024-06-14

### Changes

- _fix_ **Bug fixes: auth & avatars** — Fixed sign-in redirect loops, avatar upload size errors, and a profile save race condition.

## v0.6.1 — 2024-05-15

### Changes

- _update_ **Performance pass** — Reduced bundle size, added route-level code splitting, and improved Lighthouse scores across the board.

## v0.6.0 — 2024-04-15

### Changes

- _feature_ **Events calendar** — Public events listing with start/end times, descriptions, and an admin scheduler.

## v0.5.0 — 2024-03-06

### Changes

- _feature_ **Server status widget** — Live online/offline status and player count badge in the navbar and on the homepage.

## v0.4.1 — 2024-01-26

### Changes

- _addition_ **Contact form** — Visitors can send contact messages to staff with email confirmation and an admin inbox.

## v0.4.0 — 2023-12-17

### Changes

- _feature_ **News & announcements** — Added a news section with cover images, article pages, and pinned announcements.

## v0.3.1 — 2023-11-02

### Changes

- _update_ **Rules page overhaul** — Rebuilt rules page with collapsible sections, anchored links, and an admin editor.

## v0.3.0 — 2023-09-28

### Changes

- _feature_ **Staff applications** — Public application form for staff roles with an admin review queue and status updates.

## v0.2.0 — 2023-08-19

### Changes

- _feature_ **Player accounts & profiles** — Sign up, sign in, and a basic profile page with display name and avatar.

## v0.1.0 — 2023-07-10

### Changes

- _feature_ **CarnageMC website launched** — First public release of the CarnageMC site with home, rules, staff, and apply pages.
