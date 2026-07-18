CREATE OR REPLACE FUNCTION public.get_popular_store_items(_limit int DEFAULT 8)
RETURNS TABLE(item_id uuid, wishlist_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.item_id, count(*)::bigint AS wishlist_count
  FROM public.store_wishlists w
  JOIN public.store_items i ON i.id = w.item_id AND i.published = true
  GROUP BY w.item_id
  ORDER BY wishlist_count DESC, w.item_id
  LIMIT GREATEST(_limit, 1);
$$;

REVOKE ALL ON FUNCTION public.get_popular_store_items(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_popular_store_items(int) TO anon, authenticated, service_role;