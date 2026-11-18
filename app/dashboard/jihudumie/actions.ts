"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendEhubSms } from "@/lib/ehub-sms";

async function requireBuyer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "buyer") redirect("/dashboard");
  return { supabase, user };
}

export async function updateCustomerProfile(formData: FormData) {
  const { supabase, user } = await requireBuyer();
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 120);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 24);
  if (fullName.length < 2) redirect("/dashboard/jihudumie?error=Jina+liwe+na+herufi+angalau+2");
  const { error } = await supabase.from("profiles").update({ full_name: fullName, phone: phone || null }).eq("id", user.id);
  if (error) redirect("/dashboard/jihudumie?error=" + encodeURIComponent("Imeshindikana kuhifadhi taarifa zako."));
  revalidatePath("/dashboard/jihudumie");
  revalidatePath("/dashboard");
  redirect("/dashboard/jihudumie?saved=profile");
}

export async function createCustomerTicket(formData: FormData) {
  const { supabase, user } = await requireBuyer();
  const category = String(formData.get("category") ?? "");
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 120);
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  const smsConsent = formData.get("sms_notifications_consented") === "on";
  const allowed = ["payment", "book_access", "book_quality", "account", "other"];
  if (!allowed.includes(category) || subject.length < 3 || body.length < 5) {
    redirect("/dashboard/jihudumie?error=Jaza+aina+ya+tatizo%2C+mada+na+maelezo+ya+malalamiko");
  }

  const { data: ticket, error } = await supabase.from("support_tickets").insert({
    user_id: user.id,
    category,
    subject,
    sms_notifications_consented: smsConsent,
    sms_notifications_consented_at: smsConsent ? new Date().toISOString() : null,
  }).select("id,reference_code").single();
  if (error || !ticket) redirect("/dashboard/jihudumie?error=Imeshindikana+kufungua+ombi.+Jaribu+tena");

  const { error: messageError } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    body,
  });
  if (messageError) redirect("/dashboard/jihudumie?error=Ombi+limesajiliwa+lakini+ujumbe+haukuhifadhiwa");

  if (smsConsent) {
    const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).single();
    await sendEhubSms(profile?.phone, `MaarifaBooks: Ombi lako ${ticket.reference_code} limepokelewa. Fuatilia maendeleo kupitia Jihudumie.`);
  }

  revalidatePath("/dashboard/jihudumie");
  revalidatePath("/admin/malalamiko");
  redirect("/dashboard/jihudumie?created=" + encodeURIComponent(ticket.reference_code));
}

export async function replyToCustomerTicket(formData: FormData) {
  const { supabase, user } = await requireBuyer();
  const ticketId = String(formData.get("ticket_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  if (!ticketId || body.length < 1) redirect("/dashboard/jihudumie?error=Andika+ujumbe+kwanza");

  const { data: ticket } = await supabase.from("support_tickets")
    .select("id,status").eq("id", ticketId).eq("user_id", user.id).single();
  if (!ticket || ticket.status === "resolved") redirect("/dashboard/jihudumie?error=Ombi+hili+halipokei+ujumbe+mpya");

  const { error } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId, sender_id: user.id, body,
  });
  if (error) redirect("/dashboard/jihudumie?error=Ujumbe+haukuweza+kutumwa");
  revalidatePath("/dashboard/jihudumie");
  revalidatePath("/admin/malalamiko");
  redirect("/dashboard/jihudumie?replied=1");
}
