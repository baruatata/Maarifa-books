"use server";

import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export type CouponActionState = { code?: string; error?: string };

export async function createBookAccessCoupon(_previous: CouponActionState, formData: FormData): Promise<CouponActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Ingia kwanza kwenye akaunti yako." };

  const bookId = String(formData.get("book_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(bookId)) return { error: "Kitabu hakijatambulika." };

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
  const normalized = raw.replace(/[^A-Z0-9]/g, "");
  const codeHash = createHash("sha256").update(normalized).digest("hex");

  const { error } = await supabase.from("book_access_codes").insert({
    book_id: book.id,
    seller_id: user.id,
    code_hash: codeHash,
  });
  if (error) return { error: "Imeshindikana kutengeneza coupon. Tafadhali jaribu tena." };

  return { code };
}
