"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type RedeemCouponState = { error?: string };

export async function redeemBookCoupon(_previous: RedeemCouponState, formData: FormData): Promise<RedeemCouponState> {
  const bookId = String(formData.get("book_id") ?? "");
  const code = String(formData.get("coupon_code") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(bookId) || !code) return { error: "Weka coupon sahihi." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Ingia au jisajili kwanza, kisha urudi hapa kuweka coupon." };

  const { data, error } = await supabase.rpc("redeem_book_access_code", { p_code: code });
  if (error) return { error: error.message || "Coupon si sahihi au imeshatumika." };
  if (typeof data !== "string") return { error: "Mfumo haukuweza kuthibitisha coupon. Jaribu tena." };
  redirect("/soma/" + data);
}
