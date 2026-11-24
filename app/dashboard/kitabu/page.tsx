import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadBookForm } from "@/components/upload-book-form";
import { AudiobookUploadForm } from "@/components/audiobook-upload-form";
import { LanguageText } from "@/components/language-provider";

export default async function AddBookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: application } = await supabase.from("seller_applications").select("store_name,status").eq("user_id",user.id).maybeSingle();
  if (application?.status !== "approved") redirect("/wauzaji?error=Ombi+la+muuzaji+linahitaji+kuidhinishwa");
  return <main className="page">
    <p className="eyebrow"><LanguageText sw="DASHIBODI YA MUUZAJI" en="SELLER DASHBOARD"/></p><h1><LanguageText sw="Pakia kitabu kipya" en="Upload a new book"/></h1>
    <p className="muted"><LanguageText sw={`Duka: ${application.store_name}. Jaza taarifa na pakia jalada pamoja na faili la kitabu. Admin atakagua kabla hakijaonekana kwa wasomaji.`} en={`Store: ${application.store_name}. Enter the details and upload the cover and book file. The administrator will review it before readers can see it.`}/></p>
    <UploadBookForm/>
    <AudiobookUploadForm/>
  </main>;
}
