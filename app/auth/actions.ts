"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const preferred_language = String(formData.get("preferred_language") ?? "sw") === "en" ? "en" : "sw";
  if (!full_name || !email || password.length < 8) redirect("/ingia?error=Jaza+taarifa.+Nenosiri+liwe+herufi+8+au+zaidi");
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name, phone, preferred_language } } });
  if (error) redirect("/ingia?error=" + encodeURIComponent(error.message));
  redirect("/ingia?success=Angalia+barua+pepe+uthibitishe+akaunti");
}
export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") });
  if (error) redirect("/ingia?error=" + encodeURIComponent(error.message));
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") redirect("/mfa/challenge");
  redirect("/dashboard");
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
