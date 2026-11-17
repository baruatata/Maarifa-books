"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/ingia");
  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (error || profile?.role !== "admin") redirect("/dashboard?error=Huna+ruhusa+ya+admin");
  return { supabase, user };
}

export async function reviewSeller(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const applicationId = String(formData.get("application_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("review_note") ?? "").trim().slice(0, 1000);
  if (!applicationId || !userId || !["approved", "rejected"].includes(decision)) {
    redirect("/admin?error=Taarifa+za+ombi+si+sahihi");
  }

  const { data: application, error: lookupError } = await supabase
    .from("seller_applications").select("id,user_id,status").eq("id", applicationId).eq("user_id", userId).single();
  if (lookupError || !application) redirect("/admin?error=Ombi+halijapatikana");

  const { error: appError } = await supabase.from("seller_applications").update({
    status: decision,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    review_note: note || null,
  }).eq("id", applicationId);
  if (appError) redirect("/admin?error=" + encodeURIComponent(appError.message));

  const { error: profileError } = await supabase.from("profiles").update({
    seller_status: decision,
    ...(decision === "approved" ? { role: "seller" } : {}),
  }).eq("id", userId);
  if (profileError) redirect("/admin?error=Ombi+limesasishwa+lakini+hali+ya+akaunti+haikubadilika%3A+" + encodeURIComponent(profileError.message));

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect("/admin?success=Uamuzi+wa+muuzaji+umehifadhiwa");
}

export async function reviewBook(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const bookId = String(formData.get("book_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("rejection_note") ?? "").trim().slice(0, 1000);
  if (!bookId || !["approved", "rejected"].includes(decision)) redirect("/admin?error=Taarifa+za+kitabu+si+sahihi");

  const { data: book, error: bookLookupError } = await supabase.from("books")
    .select("id,file_path,preview_path,cover_path,price_tzs,status").eq("id", bookId).eq("status", "pending").single();
  if (bookLookupError || !book) redirect("/admin?error=Kitabu+hakijapatikana");
  if (decision === "approved" && (!book.file_path || !book.cover_path || (book.price_tzs > 0 && !book.preview_path))) {
    redirect("/admin?error=Kitabu+cha+kulipia+kinahitaji+faili+kamili%2C+sampuli+ya+bure+na+jalada");
  }

  const update = decision === "approved"
    ? { status: "approved", approved_by: user.id, approved_at: new Date().toISOString(), rejection_note: null }
    : { status: "rejected", approved_by: null, approved_at: null, rejection_note: note || "Hakijaidhinishwa na msimamizi." };

  const { error } = await supabase.from("books").update(update).eq("id", bookId).eq("status", "pending");
  if (error) redirect("/admin?error=" + encodeURIComponent(error.message));

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin?success=Uamuzi+wa+kitabu+umehifadhiwa");
}


export async function removeBookFromLibrary(formData: FormData) {
  const { supabase } = await requireAdmin();
  const bookId = String(formData.get("book_id") ?? "");
  if (!bookId) redirect("/admin?error=Kitabu+hakijachaguliwa");
  const { data: book, error: lookupError } = await supabase.from("books").select("id,file_path,preview_path,cover_path").eq("id", bookId).maybeSingle();
  if (lookupError || !book) redirect("/admin?error=Kitabu+hakijapatikana");
  const { count, error: salesError } = await supabase.from("order_items").select("id", { count: "exact", head: true }).eq("book_id", bookId);
  if (salesError) redirect("/admin?error=Imeshindikana+kukagua+historia+ya+kitabu");
  if ((count ?? 0) > 0) {
    const { error } = await supabase.from("books").update({ status: "archived" }).eq("id", bookId);
    if (error) redirect("/admin?error=" + encodeURIComponent(error.message));
    revalidatePath("/admin"); revalidatePath("/");
    redirect("/admin?success=Kitabu+kimeondolewa+kwenye+maktaba%2C+historia+imehifadhiwa");
  }
  const { error } = await supabase.from("books").delete().eq("id", bookId);
  if (error) redirect("/admin?error=" + encodeURIComponent(error.message));
  const paths = [book.file_path, book.preview_path, book.cover_path].filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from("book-files").remove(paths);
  revalidatePath("/admin"); revalidatePath("/");
  redirect("/admin?success=Kitabu+kimefutwa+kabisa");
}
