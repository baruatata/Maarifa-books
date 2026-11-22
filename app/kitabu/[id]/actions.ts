"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitManualPayment(bookId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    const { data: guest, error: guestError } = await supabase.auth.signInAnonymously({
      options: { data: { preferred_language: "sw" } }
    });
    if (guestError || !guest.user) {
      redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Hatukuweza kuanzisha ununuzi wa haraka. Jaribu tena."));
    }
  }

  const payerPhone = String(formData.get("payer_phone") || "").trim();
  const reference = String(formData.get("transaction_reference") || "").trim();
  const provider = String(formData.get("payment_provider") || "");

  if (!/^0[67][0-9]{8}$/.test(payerPhone) || reference.length < 5 || reference.length > 80) {
    redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Weka namba ya simu na kumbukumbu sahihi ya muamala."));
  }

  // One database transaction creates the order, its book item and the payment proof.
  // If any insert fails, PostgreSQL rolls back all three records.
  const { data: orderId, error } = await supabase.rpc("submit_book_payment", {
    p_book_id: bookId,
    p_payer_phone: payerPhone,
    p_transaction_reference: reference,
    p_payment_provider: provider
  });

  if (error || !orderId) {
    redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent(
      error?.message || "Ombi la ununuzi halikuhifadhiwa. Hakuna malipo mapya yanayotakiwa."
    ));
  }

  redirect("/kitabu/" + bookId + "?submitted=1&order=" + encodeURIComponent(orderId));
}

export async function reviewManualPayment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const submissionId = String(formData.get("submission_id") || "");
  const orderId = String(formData.get("order_id") || "");
  const decision = String(formData.get("decision") || "");
  if (!submissionId || !orderId || !["confirmed", "rejected"].includes(decision)) redirect("/dashboard");

  const { data: submission } = await supabase.from("payment_submissions")
    .select("id,order_id,seller_id,status").eq("id", submissionId).eq("order_id", orderId)
    .eq("seller_id", user.id).eq("status", "submitted").maybeSingle();
  if (!submission) redirect("/dashboard?error=" + encodeURIComponent("Ombi hili halipo au tayari limepitiwa."));

  if (decision === "confirmed") {
    const { data: order, error } = await supabase.from("orders").update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", orderId).eq("status", "pending").select("id").maybeSingle();
    if (error || !order) redirect("/dashboard?error=" + encodeURIComponent("Oda haikuweza kuthibitishwa. Hakikisha malipo yameingia kwanza."));
  }
  const { error: reviewError } = await supabase.from("payment_submissions").update({
    status: decision, reviewed_at: new Date().toISOString()
  }).eq("id", submissionId).eq("seller_id", user.id).eq("status", "submitted");
  if (reviewError) redirect("/dashboard?error=" + encodeURIComponent("Malipo yamepitiwa lakini hali ya uthibitisho haikuhifadhiwa. Wasiliana na msaada."));
  redirect("/dashboard?payment=" + decision);
}

export async function requestBookCoupon(bookId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) {
    redirect("/ingia?next=" + encodeURIComponent("/kitabu/" + bookId));
  }

  const phoneInput = String(formData.get("customer_phone") || "").trim().replace(/\\s+/g, "");
  const customerPhone = phoneInput.startsWith("0") ? "255" + phoneInput.slice(1) : phoneInput;
  const reference = String(formData.get("transaction_reference") || "").trim();
  const customerName = String(formData.get("customer_name") || "").trim().slice(0, 100);

  if (!/^255[67][0-9]{8}$/.test(customerPhone) || reference.length < 3 || reference.length > 100) {
    redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Weka namba sahihi ya simu na kumbukumbu ya malipo."));
  }

  const { data: book } = await supabase.from("books")
    .select("id,seller_id,status,price_tzs").eq("id", bookId).eq("status", "approved").maybeSingle();
  if (!book || book.price_tzs <= 0) {
    redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Kitabu hiki hakipokei maombi ya coupon."));
  }

  const { error } = await supabase.from("book_coupon_requests").insert({
    book_id: book.id,
    seller_id: book.seller_id,
    customer_user_id: user.id,
    customer_name: customerName || null,
    customer_phone: customerPhone,
    transaction_reference: reference,
    status: "pending",
    payment_status: "unverified"
  });
  if (error) {
    redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Ombi la coupon halikuhifadhiwa. Tafadhali jaribu tena."));
  }
  redirect("/kitabu/" + bookId + "?requested=1");
}
