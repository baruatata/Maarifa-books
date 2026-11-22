-- Allow approved sellers to confirm payment for their own coupon requests
-- and create access codes for their own approved paid books.
GRANT UPDATE (payment_status, payment_confirmed_at, payment_confirmed_by, status, fulfilled_at)
ON TABLE public.book_coupon_requests TO authenticated;

GRANT INSERT (book_id, seller_id, code_hash, request_id)
ON TABLE public.book_access_codes TO authenticated;

DROP POLICY IF EXISTS "seller creates own book access codes" ON public.book_access_codes;
CREATE POLICY "seller creates own book access codes"
ON public.book_access_codes
FOR INSERT
TO authenticated
WITH CHECK (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND seller_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.books b
    JOIN public.seller_applications sa ON sa.user_id = b.seller_id
    WHERE b.id = book_access_codes.book_id
      AND b.seller_id = (SELECT auth.uid())
      AND b.status = 'approved'
      AND b.price_tzs > 0
      AND sa.status = 'approved'
  )
  AND (
    request_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.book_coupon_requests r
      WHERE r.id = book_access_codes.request_id
        AND r.book_id = book_access_codes.book_id
        AND r.seller_id = (SELECT auth.uid())
        AND r.status = 'pending'
        AND r.payment_status = 'received'
    )
  )
);
