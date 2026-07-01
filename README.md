# CarnageMC Website

The official website for **CarnageMC** — a Minecraft Lifesteal & Economy server.

**Version:** Unversioned rolling release — changes are tracked by date in the [Changelog](/changelog) and `public/release-notes.json` rather than a semver number. `package.json` intentionally stays at `0.0.0`.


**Live URLs:**
- [carnagemc.lovable.app](https://carnagemc.lovable.app)
- [xylomc.net](https://xylomc.net)
- [carnagemc.net](https://carnagemc.net)
- [alsnetwork.fun](https://alsnetwork.fun)
- [zyphoramc.net](https://zyphoramc.net)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State / Data | TanStack Query |
| Backend | Lovable Cloud (Supabase) — Auth, Database, Storage, Edge Functions |
| Routing | React Router DOM |
| Notifications | Sonner + shadcn Toaster |

---

## Public Pages

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Hero, live server status, player count, Discord member count, event countdown, feature highlights, latest news, reviews |
| **News** | `/news` | News/announcement feed with article cards |
| **News Article** | `/news/:slug` | Full article view with SEO metadata |
| **Staff** | `/staff` | Staff team roster with roles and bios |
| **Vote** | `/vote` | Server voting links with streak tracking |
| **Community** | `/community` | Discord integration, community highlights |
| **Rules** | `/rules` | Server rules (editable by admins) |
| **Support** | `/support` | Support center with ticket creation |
| **Tickets** | `/tickets` | User ticket dashboard |
| **Profile** | `/profile` | User profile settings, Discord linking, MC username |
| **Dashboard** | `/dashboard` | User account dashboard with stats |
| **User Profile** | `/user/:shortId` | Public player profiles |
| **Users** | `/users` | Community member listing |
| **Plugins** | `/plugins` | Server plugins directory |
| **Plugin Detail** | `/plugins/:shortId` | Individual plugin page |
| **Features** | `/features` | Server features showcase |
| **Feature Detail** | `/features/:slug` | Individual feature page |
| **Leaderboard** | `/leaderboard` | Server leaderboards |
| **FAQ** | `/faq` | Frequently asked questions |
| **Events** | `/events` | Server events calendar |
| **Changelog** | `/changelog` | Server update changelog |
| **Apply** | `/apply` | Staff/builder/content creator applications |
| **Link Account** | `/link-account` | Discord account linking flow |
| **Auth** | `/auth` | Sign up / Log in |

---

## Admin Panel (`/admin`)

Role-based access control. Admin users see an **Admin** button in the navbar.

| Section | Description |
|---------|-------------|
| **Dashboard** | Stats: total users, admins, news posts, live server status |
| **Users** | Create, edit, delete users; promote/demote admins |
| **Roles** | Assign roles to members (admin, moderator, builder, etc.) |
| **Permissions** | Define what each role can do (owner-only) |
| **News** | Create, edit, publish/unpublish announcements |
| **Site Content** | Edit hero text, server IP, Discord URL, popup announcements, alerts |
| **Server Status** | Manually override the live status display |
| **Support Tickets** | Triage and reply to user tickets |
| **Admin Logs** | Audit trail of admin role checks |
| **Plugins** | Add, edit, remove server plugins |
| **Changelog** | Publish server updates by date and category |
| **Applications** | Review staff/builder/content creator applications |
| **Features** | Add, edit, reorder features shown on the home page |
| **Rules** | Edit the rules sections on the public Rules page |
| **FAQs** | Manage FAQ entries (questions, answers, categories) |
| **Events** | Create and manage server events |
| **Maintenance** | Toggle maintenance mode and set a custom message |
| **Discord Bot — Dashboard** | Bot status and overview (owner-only) |
| **Discord Bot — Management** | Configure commands and bot integration (owner-only) |

---

## Authentication

- Email/password authentication with email verification
- Google OAuth sign-in/sign-up
- Discord account linking for rank sync
- Role-based access control (`user_roles` table with `has_role()` security definer function)
- Admin protection via RLS policies

---

## Database Tables (Public Schema)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (display name, MC username, avatar) |
| `user_roles` | Role assignments (admin, moderator, builder, etc.) |
| `news` | News/announcement posts |
| `site_content` | Editable site config (hero, server IP, alerts, popup) |
| `server_status` | Cached server status for admin dashboard |
| `admin_check_logs` | Audit log for admin access checks |
| `plugins` | Server plugins directory |
| `changelogs` | Server update changelog entries |
| `applications` | Staff/builder/content creator applications |
| `features` | Homepage feature highlights |
| `rules` | Rule sections |
| `faqs` | FAQ entries |
| `events` | Server events |
| `tickets` | Support tickets |
| `mods` | Mod `.jar` files and metadata |

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| `discord-invite` | Resolve Discord invite URLs to get member counts |
| `admin-create-user` | Admin user creation |
| `admin-delete-user` | Admin user deletion |

---

## Key Features

### Homepage
- Live server status via [mcsrvstat.us](https://api.mcsrvstat.us) API
- Discord member count polling (via edge function)
- Animated particle background + mouse trail
- IP copy-to-clipboard with visual feedback
- Popup announcements (configurable in admin)
- Online/offline alerts (configurable in admin)
- Event countdown timer
- Animated stat counters
- Player reviews carousel

### Mods System
- Public `/mods` page with filtering by loader, MC version, and tags
- Admin `/admin/mods` for uploading `.jar` files or linking external URLs
- Featured/published toggles
- Full-screen branded `PageLoader` on data fetch (inspired by netherite.gg)

### Design
- Dark theme with gradient accents
- Custom `font-display` typography
- Glassmorphism cards + glow effects
- Responsive sidebar navigation on mobile
- SEO-optimized with `react-helmet-async`

---

## Environment Variables

Configured automatically by Lovable Cloud:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

---

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Run tests
bun run test
```

---

## Project Structure

```
src/
├── pages/              # Route pages (public + admin)
├── components/
│   ├── admin/          # Admin panel sections
│   ├── site/           # Shared site components (Navbar, Footer, SEO, etc.)
│   └── ui/             # shadcn/ui components
├── lib/                # Hooks, auth, utilities, roles, permissions
├── integrations/
│   └── supabase/       # Supabase client (auto-generated)
└── App.tsx             # Router + providers
```

---

## `data/plugins.json`

A committed snapshot of every **published** row from the `plugins` table, so the plugin catalog is visible directly on GitHub (not only in the live database).

**Shape:**

```json
{
  "generatedAt": "2026-07-01T00:00:00Z",
  "count": 15,
  "plugins": [
    { "id": "...", "slug": "advancedrtp", "name": "AdvancedRTP", "version": "2.0.3", ... }
  ]
}
```

Internal storage paths (`jar_path`) are stripped; public download URLs (`download_url`) are kept.

**How it stays in sync**

The file is a manual export, not live data. Regenerate it whenever plugins are added, edited, or unpublished:

- Ask the assistant: *"Regenerate data/plugins.json"*, or
- Run against the backend:

  ```sql
  SELECT jsonb_pretty(jsonb_build_object(
    'generatedAt', to_jsonb(now()),
    'count', count(*),
    'plugins', COALESCE(jsonb_agg(to_jsonb(p) - 'jar_path' ORDER BY p.name), '[]'::jsonb)
  ))
  FROM (SELECT * FROM public.plugins WHERE published = true) p;
  ```

  Save the output to `data/plugins.json`. The live source of truth remains the `plugins` table at `/plugins` and `/admin?tab=plugins`.

---


## Custom Domains

The project is deployed with multiple custom domains pointing to the same build:
- `xylomc.net`
- `carnagemc.net`
- `alsnetwork.fun`
- `zyphoramc.net`

---

Built with [Lovable](https://lovable.dev).
