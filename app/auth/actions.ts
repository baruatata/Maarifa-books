"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/posthog-server";

function authRedirect(path: string, message: string, kind: "error" | "success" = "error"): never {
  const params = new URLSearchParams({ [kind]: message });
  if (path.startsWith("/") && !path.startsWith("//")) params.set("next", path);
  redirect("/ingia?" + params.toString());
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const preferred_language = String(formData.get("preferred_language") ?? "sw") === "en" ? "en" : "sw";
  const next = String(formData.get("next") ?? "");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (!full_name || !email || password.length < 8) authRedirect(safeNext, "Jaza taarifa. Nenosiri liwe herufi 8 au zaidi");
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name, phone, preferred_language } } });
  if (error) authRedirect(safeNext, error.message);
  authRedirect(safeNext, "Angalia barua pepe uthibitishe akaunti", "success");
}
export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const next = String(formData.get("next") ?? "");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const { data, error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") });
  if (error) authRedirect(safeNext, error.message);
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.totp ?? []) {
    if (factor.status === "verified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  const user = data.user;
  if (!user?.id) authRedirect(safeNext, "Imeshindikana kuthibitisha akaunti. Jaribu tena.");
  await captureServerEvent(user.id, "user_logged_in", { method: "email" });
  redirect(safeNext);
}

export async function signInForClient(formData: FormData) {
  const supabase = await createClient();
  const next = String(formData.get("next") ?? "");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const { data, error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") });
  if (error) return { ok: false as const, error: error.message };
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.totp ?? []) {
    if (factor.status === "verified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  if (!data.user?.id) return { ok: false as const, error: "Imeshindikana kuthibitisha akaunti. Jaribu tena." };
  await captureServerEvent(data.user.id, "user_logged_in", { method: "email" });
  return {
    ok: true as const,
    user: {
      id: data.user.id,
      email: data.user.email ?? "",
      name: String(data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? ""),
    },
    redirectTo: safeNext,
  };
}
export async function signOut() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await captureServerEvent(user.id, "user_logged_out");
  await supabase.auth.signOut();
  redirect("/");
}
