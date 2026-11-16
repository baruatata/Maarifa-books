-- Seller applications no longer require SMS OTP verification.
drop trigger if exists seller_application_requires_verified_phone on public.seller_applications;
drop function if exists public.require_verified_seller_phone();
