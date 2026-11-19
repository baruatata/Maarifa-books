-- Require every newly generated paid-book coupon to belong to a verified customer request.
-- Existing coupons remain redeemable; this only closes the unlinked coupon-creation path.
drop policy if exists "seller creates own book access codes" on public.book_access_codes;
revoke insert on public.book_access_codes from authenticated;

-- Coupon creation remains available through the checked SECURITY DEFINER RPC only.
-- That RPC verifies seller ownership, approved paid book, pending request and received payment.
