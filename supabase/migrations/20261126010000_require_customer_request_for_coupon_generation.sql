-- Require every newly generated paid-book coupon to belong to one
-- customer request that is still pending and has confirmed payment.
-- Historical coupons with a NULL request_id are retained unchanged.

DROP POLICY IF EXISTS "seller creates own book access codes" ON public.book_access_codes;

CREATE POLICY "seller creates own book access codes"
ON public.book_access_codes
FOR INSERT
TO authenticated
WITH CHECK (
  COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND seller_id = (SELECT auth.uid())
  AND request_id IS NOT NULL
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
  AND EXISTS (
    SELECT 1
    FROM public.book_coupon_requests r
    WHERE r.id = book_access_codes.request_id
      AND r.book_id = book_access_codes.book_id
      AND r.seller_id = (SELECT auth.uid())
      AND r.status = 'pending'
      AND r.payment_status = 'received'
  )
);
