"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CouponActionState = { code?: string; error?: string };

export async function createBookAccessCoupon(_previous: CouponActionState, formData: FormData): Promise<CouponActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Ingia kwanza kwenye akaunti yako." };

  const bookId = String(formData.get("book_id") ?? "");
  const requestId = String(formData.get("request_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(bookId)) return { error: "Kitabu hakijatambulika." };
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return { error: "Coupon lazima itengenezwe kwa ombi maalumu la mteja." };

  const { data: application } = await supabase.from("seller_applications")
    .select("status").eq("user_id", user.id).maybeSingle();
  if (application?.status !== "approved") return { error: "Akaunti yako ya muuzaji haijaidhinishwa." };

  const { data: book } = await supabase.from("books")
    .select("id,price_tzs,status").eq("id", bookId).eq("seller_id", user.id).maybeSingle();
  if (!book || book.status !== "approved" || book.price_tzs <= 0) {
    return { error: "Coupon inaweza kutengenezwa kwa kitabu cha kulipia kilichoidhinishwa pekee." };
  }

  const raw = randomBytes(12).toString("hex").toUpperCase();
  const code = raw.match(/.{1,6}/g)?.join("-") ?? raw;
  const codeHash = createHash("sha256").update(raw).digest("hex");
  const { error } = await supabase.rpc("create_book_coupon_for_request", {
    p_request_id: requestId,
    p_code_hash: codeHash,
  });
  if (error) return { error: error.message.includes("Thibitisha") ? error.message : "Imeshindikana kutengeneza coupon ya ombi hili. Hakiki uthibitisho wa malipo na ujaribu tena." };

  revalidatePath("/dashboard/kuponi");
  return { code };
}
export type PaymentConfirmationState = { ok?: boolean; error?: string };

export async function setCouponRequestPaymentStatus(_previous: PaymentConfirmationState, formData: FormData): Promise<PaymentConfirmationState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Ingia kwanza kwenye akaunti yako." };

  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("payment_status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(requestId) || !["received", "not_received"].includes(status)) {
    return { error: "Taarifa za uthibitisho hazijatambulika." };
  }

  const { error } = await supabase.rpc("set_book_coupon_payment_status", {
    p_request_id: requestId,
    p_status: status,
  });
  if (error) return { error: error.message.includes("Ombi halijapatikana") ? error.message : "Imeshindikana kuhifadhi uthibitisho wa malipo. Jaribu tena." };

  revalidatePath("/dashboard/kuponi");
  revalidatePath("/dashboard");
  return { ok: true };
}

export type FulfillRequestState = { ok?: boolean; error?: string };

export async function markBookCouponRequestFulfilled(_previous: FulfillRequestState, formData: FormData): Promise<FulfillRequestState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Ingia kwanza kwenye akaunti yako." };

  const requestId = String(formData.get("request_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return { error: "Ombi halijatambulika." };

  const { data: application } = await supabase.from("seller_applications")
    .select("status").eq("user_id", user.id).maybeSingle();
  if (application?.status !== "approved") return { error: "Akaunti yako ya muuzaji haijaidhinishwa." };

  const { data: updated, error } = await supabase.from("book_coupon_requests")
    .update({ status: "fulfilled", fulfilled_at: new Date().toISOString() })
    .eq("id", requestId).eq("seller_id", user.id).eq("status", "pending")
    .select("id").maybeSingle();

  if (error) return { error: "Ombi haliwezi kufungwa. Hakikisha malipo yamethibitishwa na coupon ya ombi hili imetengenezwa." };
  if (updated) {
    revalidatePath("/dashboard/kuponi");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const { data: existing } = await supabase.from("book_coupon_requests")
    .select("status").eq("id", requestId).eq("seller_id", user.id).maybeSingle();
  if (existing?.status === "fulfilled") return { ok: true };
  return { error: "Ombi halijapatikana au tayari limekataliwa." };
}
