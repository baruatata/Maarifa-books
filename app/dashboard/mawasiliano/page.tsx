import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SupportChat from "@/components/support-chat";
import { LanguageText } from "@/components/language-provider";

export default async function SellerMessagesPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "seller") redirect("/dashboard?error=Sehemu+ya+wauzaji+pekee");
  const { data: messages, error } = await supabase.from("support_messages")
    .select("id,sender_id,body,created_at,read_at").eq("seller_id", user.id).order("created_at", { ascending: true });
  const unread = (messages ?? []).filter(m => m.sender_id !== user.id && !m.read_at).map(m => m.id);
  if (unread.length) await supabase.from("support_messages").update({ read_at: new Date().toISOString() }).in("id", unread);
  return <main className="page">
    <Link href="/dashboard" className="muted"><LanguageText sw="← Rudi kwenye dashibodi" en="← Back to dashboard"/></Link>
    <p className="eyebrow"><LanguageText sw="MSAADA WA MUUZAJI" en="SELLER SUPPORT"/></p><h1><LanguageText sw="Wasiliana na Admin" en="Contact administrator"/></h1>
    <p className="muted"><LanguageText sw="Tuma swali au ripoti tatizo. Admin atakujibu hapa ndani ya akaunti yako." en="Send a question or report a problem. The administrator will reply here in your account."/></p>
    {params.error && <p className="message">{params.error}</p>}
    {params.sent && <p className="notice"><LanguageText sw="Ujumbe umetumwa." en="Message sent."/></p>}
    {error ? <p className="message"><LanguageText sw="Imeshindikana kufungua mazungumzo. Jaribu tena baadaye." en="Could not open the conversation. Please try again later."/></p> :
      <SupportChat sellerId={user.id} currentUserId={user.id} messages={messages ?? []}/>}
  </main>;
}
