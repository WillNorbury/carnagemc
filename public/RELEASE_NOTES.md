# Release Notes

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
