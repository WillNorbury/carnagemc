INSERT INTO public.changelog_entries (id, title, content, category, version, entry_date, published)
VALUES (
  'c3a9d7e1-8f42-4c6b-a105-2b7e9d4f6380',
  'Admin and dashboard rebrand',
  'Updated the admin panel and member dashboard to use Warden Network branding, network-focused labels, and the live teal visual theme.',
  'update',
  '2026.09.03',
  CURRENT_DATE,
  true
)
ON CONFLICT (id) DO NOTHING;