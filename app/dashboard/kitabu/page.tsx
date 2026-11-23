import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadBookForm } from "@/components/upload-book-form";
import { AudiobookUploadForm } from "@/components/audiobook-upload-form";

export default async function AddBookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: application } = await supabase.from("seller_applications").select("store_name,status").eq("user_id",user.id).maybeSingle();
  if (application?.status !== "approved") redirect("/wauzaji?error=Ombi+la+muuzaji+linahitaji+kuidhinishwa");
  return <main className="page">
    <p className="eyebrow">DASHIBODI YA MUUZAJI</p><h1>Pakia kitabu kipya</h1>
    <p className="muted">Duka: {application.store_name}. Jaza taarifa na pakia jalada pamoja na faili la kitabu. Admin atakagua kabla hakijaonekana kwa wasomaji.</p>
    <UploadBookForm/>
    <AudiobookUploadForm/>
  </main>;
}
