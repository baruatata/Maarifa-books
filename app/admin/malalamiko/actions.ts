"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendEhubSms } from "@/lib/ehub-sms";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  return { supabase, user };
}

const statusMessages: Record<string, string> = {
  received: "Limepokelewa",
  in_progress: "Linafanyiwa kazi",
  resolved: "Limetatuliwa",
};

export async function updateCustomerTicket(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const ticketId = String(formData.get("ticket_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  if (!ticketId || !["received", "in_progress", "resolved"].includes(status)) {
    redirect("/admin/malalamiko?error=Taarifa+za+ombi+si+sahihi");
  }

  const { data: ticket, error: lookupError } = await supabase.from("support_tickets")
    .select("id,user_id,reference_code,status,sms_notifications_consented")
    .eq("id", ticketId).single();
  if (lookupError || !ticket) redirect("/admin/malalamiko?error=Ombi+halijapatikana");

  if (ticket.status !== status) {
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
    if (error) redirect("/admin/malalamiko?error=Imeshindikana+kubadilisha+hali+ya+ombi");
  }

  if (body) {
    const { error } = await supabase.from("support_ticket_messages").insert({
      ticket_id: ticketId, sender_id: user.id, body,
    });
    if (error) redirect("/admin/malalamiko?error=Jibu+halikuweza+kutumwa");
  }

  if (ticket.sms_notifications_consented && (body || ticket.status !== status)) {
    const { data: customer } = await supabase.from("profiles").select("phone").eq("id", ticket.user_id).single();
    const message = body
      ? `MaarifaBooks: Kuna jibu jipya kwenye ombi ${ticket.reference_code}. Ingia Jihudumie kufuatilia.`
      : `MaarifaBooks: Hali ya ombi ${ticket.reference_code} imebadilika: ${statusMessages[status]}.`;
    await sendEhubSms(customer?.phone, message);
  }

  revalidatePath("/admin/malalamiko");
  revalidatePath("/dashboard/jihudumie");
  redirect("/admin/malalamiko?saved=1");
}
