"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendSupportMessage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");

  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  const requestedSellerId = String(formData.get("seller_id") ?? "");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const sellerId = profile?.role === "admin" ? requestedSellerId : user.id;

  if (!body || !sellerId) redirect("/dashboard/mawasiliano?error=Andika+ujumbe+kwanza");
  const { error } = await supabase.from("support_messages").insert({
    seller_id: sellerId,
    sender_id: user.id,
    body,
  });
  if (error) redirect((profile?.role === "admin" ? "/admin" : "/dashboard") + "/mawasiliano?error=" + encodeURIComponent(error.message));

  revalidatePath("/admin/mawasiliano");
  revalidatePath("/dashboard/mawasiliano");
  redirect(profile?.role === "admin"
    ? "/admin/mawasiliano?seller=" + sellerId + "&sent=1"
    : "/dashboard/mawasiliano?sent=1");
}
