"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type RedeemCouponState = { error?: string };

export async function redeemBookCoupon(_previous: RedeemCouponState, formData: FormData): Promise<RedeemCouponState> {
  const bookId = String(formData.get("book_id") ?? "");
  const code = String(formData.get("coupon_code") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(bookId) || !code) return { error: "Weka coupon sahihi." };

  const supabase = await createClient();
  let { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { data: anonymousSession, error: anonymousError } = await supabase.auth.signInAnonymously();
    if (anonymousError || !anonymousSession.user) {
      console.error("anonymous coupon session failed", anonymousError?.message);
      return { error: "Imeshindikana kuanzisha kikao cha mteja. Jaribu tena baada ya muda." };
    }
    user = anonymousSession.user;
  }

  const { data, error } = await supabase.rpc("redeem_book_access_code", { p_code: code });
  if (error) return { error: error.message || "Coupon si sahihi au imeshatumika." };
  if (typeof data !== "string") return { error: "Mfumo haukuweza kuthibitisha coupon. Jaribu tena." };
  redirect("/soma/" + data);
}

export type CouponRequestState = { success?: boolean; error?: string; whatsappUrl?: string | null };

export async function createBookCouponRequest(_previous: CouponRequestState, formData: FormData): Promise<CouponRequestState> {
  const bookId = String(formData.get("book_id") ?? "");
  const rawPhone = String(formData.get("phone") ?? "").trim().replace(/[\s()+-]/g, "");
  const phone = rawPhone.startsWith("0") ? "255" + rawPhone.slice(1) : rawPhone;
  const customerName = String(formData.get("customer_name") ?? "").trim().slice(0, 120);
  const reference = String(formData.get("transaction_reference") ?? "").trim().slice(0, 100);
  if (!/^[0-9a-f-]{36}$/i.test(bookId) || !/^255[67][0-9]{8}$/.test(phone) || reference.length < 3) {
    return { error: "Weka namba sahihi ya simu na kumbukumbu ya muamala." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: book } = await supabase.from("books").select("id,title,seller_id,status,price_tzs")
    .eq("id", bookId).eq("status", "approved").gt("price_tzs", 0).maybeSingle();
  if (!book) return { error: "Kitabu hiki hakipokei maombi ya coupon kwa sasa." };

  let name = customerName || null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    name = name || profile?.full_name || null;
  }

  const { error } = await supabase.from("book_coupon_requests").insert({
    book_id: book.id,
    seller_id: book.seller_id,
    customer_user_id: user?.id ?? null,
    customer_name: name,
    customer_phone: phone,
    transaction_reference: reference
  });
  if (error) {
    console.error("book coupon request insert failed", { code: error.code, message: error.message });
    return { error: "Ombi halikutumwa. Hakikisha taarifa ni sahihi kisha jaribu tena." };
  }

  const { data: sellerPhone } = await supabase.rpc("get_seller_whatsapp", { p_seller_id: book.seller_id });
  const whatsappNumber = String(sellerPhone ?? "").replace(/[^0-9]/g, "");
  const whatsappMessage = [
    "Habari, nimetuma ombi la coupon kupitia MaarifaBooks.",
    "Kitabu: " + book.title,
    "Jina: " + (name || "Halikutolewa"),
    "Simu ya malipo: " + phone,
    "Kumbukumbu ya muamala: " + reference,
    "Naomba uhakiki wa malipo na coupon."
  ].join("\n");
  const whatsappUrl = whatsappNumber
    ? "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(whatsappMessage)
    : null;

  return { success: true, whatsappUrl };
}
