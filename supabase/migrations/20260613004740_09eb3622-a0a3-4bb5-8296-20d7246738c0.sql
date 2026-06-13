
-- Tighten overly permissive INSERT policies on public submission forms
DROP POLICY IF EXISTS "anyone can submit appeal" ON public.ban_appeals;
CREATE POLICY "anyone can submit appeal"
ON public.ban_appeals
FOR INSERT
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND status = 'pending'
  AND admin_response IS NULL
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND length(minecraft_username) BETWEEN 1 AND 64
  AND length(appeal_text) BETWEEN 1 AND 5000
  AND (discord_tag IS NULL OR length(discord_tag) <= 64)
  AND (email IS NULL OR length(email) <= 255)
  AND (ban_reason IS NULL OR length(ban_reason) <= 1000)
);

DROP POLICY IF EXISTS "anyone can send message" ON public.contact_messages;
CREATE POLICY "anyone can send message"
ON public.contact_messages
FOR INSERT
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND handled = false
  AND handled_by IS NULL
  AND handled_at IS NULL
  AND length(name) BETWEEN 1 AND 100
  AND length(email) BETWEEN 3 AND 255
  AND length(message) BETWEEN 1 AND 5000
  AND (subject IS NULL OR length(subject) <= 200)
);
