GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;

GRANT INSERT ON public.faq_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_votes TO authenticated;
GRANT ALL ON public.faq_votes TO service_role;

GRANT SELECT ON public.plugins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugins TO authenticated;
GRANT ALL ON public.plugins TO service_role;