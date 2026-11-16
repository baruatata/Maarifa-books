"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitManualPayment(bookId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  let user = currentUser;
  if (!user) {
    const { data: guest, error: guestError } = await supabase.auth.signInAnonymously({
      options: { data: { preferred_language: "sw" } }
    });
    if (guestError || !guest.user) {
      redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Hatukuweza kuanzisha ununuzi wa haraka. Jaribu tena au wasiliana na msaada."));
    }
    user = guest.user;
  }

  const payerPhone = String(formData.get("payer_phone") || "").trim();
  const reference = String(formData.get("transaction_reference") || "").trim();
  const provider = String(formData.get("payment_provider") || "");
  if (!/^0[67][0-9]{8}$/.test(payerPhone) || reference.length < 5 || reference.length > 80) {
    redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Weka namba ya simu na kumbukumbu sahihi ya muamala."));
  }

  const { data: book } = await supabase.from("books")
    .select("id,title,seller_id,price_tzs,status")
    .eq("id", bookId).eq("status", "approved").gt("price_tzs", 0).maybeSingle();
  if (!book || book.seller_id === user.id) redirect("/?error=" + encodeURIComponent("Kitabu hiki hakiwezi kununuliwa kwa akaunti hii."));

  const { data: payout } = await supabase.from("seller_payout_methods")
    .select("provider,phone_number").eq("seller_id", book.seller_id).maybeSingle();
  if (!payout || provider !== payout.provider) redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Chagua mtandao uleule wa namba ya muuzaji."));

  const { data: order, error: orderError } = await supabase.from("orders")
    .insert({ buyer_id: user.id, total_tzs: book.price_tzs, status: "pending", payment_provider: provider })
    .select("id").single();
  if (orderError || !order) redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Oda haikuweza kuanzishwa. Jaribu tena."));

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id, book_id: book.id, seller_id: book.seller_id, unit_price_tzs: book.price_tzs
  });
  if (itemError) redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Oda imeanzishwa lakini bidhaa haikuongezwa. Wasiliana na msaada kabla ya kulipa tena."));

  const { error: proofError } = await supabase.from("payment_submissions").insert({
    order_id: order.id, buyer_id: user.id, seller_id: book.seller_id, amount_tzs: book.price_tzs,
    payment_provider: provider, payer_phone: payerPhone, transaction_reference: reference
  });
  if (proofError) redirect("/kitabu/" + bookId + "?error=" + encodeURIComponent("Taarifa za malipo hazikuhifadhiwa. Usirudie malipo; wasiliana na msaada."));

  redirect("/kitabu/" + bookId + "?submitted=1&order=" + encodeURIComponent(order.id));
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
