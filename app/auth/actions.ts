"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/dashboard";
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const preferred_language = String(formData.get("preferred_language") ?? "sw") === "en" ? "en" : "sw";
  const next = String(formData.get("next") ?? "");
  const safeNext = safeNextPath(next);

  if (!full_name || !email || password.length < 8) {
    redirect("/ingia?error=Jaza+taarifa.+Nenosiri+liwe+herufi+8+au+zaidi");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://maarifabooks.vercel.app";
  const confirmationUrl = new URL("/auth/callback", siteUrl);
  confirmationUrl.searchParams.set("next", safeNext);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone, preferred_language },
      emailRedirectTo: confirmationUrl.toString(),
    },
  });

  if (error) redirect("/ingia?error=" + encodeURIComponent(error.message));
  redirect("/ingia?success=Angalia+barua+pepe+uthibitishe+akaunti&next=" + encodeURIComponent(safeNext));
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const next = String(formData.get("next") ?? "");
  const safeNext = safeNextPath(next);
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect("/ingia?error=" + encodeURIComponent(error.message));
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.totp ?? []) {
    if (factor.status === "verified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  redirect(safeNext);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
