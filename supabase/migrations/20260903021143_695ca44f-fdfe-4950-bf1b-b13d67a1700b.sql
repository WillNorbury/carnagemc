INSERT INTO public.changelog_entries (id, title, content, category, version, entry_date, published)
VALUES (
  '6de6b6b8-4f69-4c5a-9b52-7cc0d8a9e9f1',
  'Full server dashboard added',
  'Added a full admin server dashboard with live player counts, ping, uptime, latency history, player moderation actions, and map management. The dashboard also keeps the public /tab server animation synchronized with live status.',
  'feature',
  '2026.09.03',
  CURRENT_DATE,
  true
)
ON CONFLICT (id) DO NOTHING;