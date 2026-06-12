# Add Ban Appeals, Wiki, Gallery, Contact pages

Four new public pages, each with an admin tab for editing, and a shared notifier that posts an event to the saved website webhook URL whenever admins create/update/delete content (and when a user submits a ban appeal or contact message).

## 1. Database (one migration)

Four new tables in `public`, all with standard `id`, `created_at`, `updated_at` + RLS + GRANTs:

- **ban_appeals** — `user_id` (nullable), `minecraft_username`, `discord_tag`, `ban_reason`, `appeal_text`, `email`, `status` (`pending`/`approved`/`denied`), `admin_response`, `reviewed_by`, `reviewed_at`
  - Anyone (incl. anon) can INSERT; users can SELECT their own; admins/owners full access.
- **wiki_articles** — `slug` (unique), `title`, `category`, `content` (markdown), `excerpt`, `published`, `sort_order`
  - Anon/auth SELECT where `published=true`; admins/owners full access.
- **gallery_items** — `title`, `caption`, `image_url`, `category`, `sort_order`, `published`
  - Anon/auth SELECT where `published=true`; admins/owners full access.
- **contact_methods** — `label`, `type` (email/discord/link/etc.), `value`, `icon`, `sort_order`, `published`
  - Anon/auth SELECT where `published=true`; admins/owners full access.
- **contact_messages** — `user_id` (nullable), `name`, `email`, `subject`, `message`, `handled` (bool), `handled_by`, `handled_at`
  - Anyone can INSERT; admins/owners SELECT/UPDATE.

## 2. Shared webhook notifier (edge function)

New edge function `website-log-event` accepts `{ kind, title, detail, url?, actor? }`, reads `alert_settings.website_webhook_url`, POSTs a Discord-style embed, and logs the result to `website_webhook_deliveries` (`kind` like `wiki_update`, `gallery_create`, `ban_appeal_new`, `contact_message`, etc.). Reuses the existing deliveries table so the Status tab table already shows them.

Called from:
- Admin create/update/delete in the 4 new admin tabs
- Public submit on Ban Appeals form
- Public submit on Contact form

## 3. Public pages

- `/ban-appeals` — intro + appeal submission form. Logged-in users see their previous appeals + status.
- `/wiki` — list grouped by category, with search. `/wiki/:slug` for article view (markdown rendered).
- `/gallery` — responsive masonry/grid with lightbox.
- `/contact` — list of contact methods + a message form.

All four added as routes in `App.tsx` and linked from the sidebar (`AppSidebar`).

## 4. Admin tabs

In `Admin.tsx`, add four tabs reachable via `/admin?tab=ban-appeals|wiki|gallery|contact`:

- **ban-appeals** — list pending/all appeals, change status, write admin response.
- **wiki** — list, create, edit (title, slug, category, markdown content, published toggle), delete.
- **gallery** — upload to `plugin-screenshots` bucket (or new bucket if preferred), edit caption, reorder, delete.
- **contact** — manage contact methods + view/mark-handled contact messages.

Every mutating action invokes `website-log-event` so changes show up in the Status tab deliveries table.

## Technical details

- Migration order per table: CREATE TABLE → GRANT (authenticated + service_role; anon SELECT only where published list is public) → ENABLE RLS → CREATE POLICY.
- `has_role(auth.uid(), 'admin')` / `'owner'` reused for admin policies.
- New storage bucket `gallery` (public) for images; if simpler, reuse existing `news-covers`.
- Webhook payload format matches existing uptime embeds (title, color, fields) so Discord display stays consistent.
- Markdown rendering: reuse whatever is already used for news/changelog (likely `react-markdown`); if not present, render as `<pre>` until added.
- Wiki slug auto-generated from title via a small client helper; unique constraint enforces collisions.
- All inputs validated with zod on submit (max lengths, email format) before insert.

## Files

- `supabase/migrations/<ts>_appeals_wiki_gallery_contact.sql` (new)
- `supabase/functions/website-log-event/index.ts` (new)
- `src/pages/BanAppeals.tsx`, `Wiki.tsx`, `WikiArticle.tsx`, `Gallery.tsx`, `Contact.tsx` (new)
- `src/pages/Admin.tsx` (4 new tab sections + sidebar entries)
- `src/components/site/AppSidebar.tsx` (4 nav links)
- `src/App.tsx` (5 new routes)

Approve and I'll build it.
