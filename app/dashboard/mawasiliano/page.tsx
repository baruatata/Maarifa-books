import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SupportChat from "@/components/support-chat";

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
    <Link href="/dashboard" className="muted">← Rudi kwenye dashibodi</Link>
    <p className="eyebrow">MSAADA WA MUUZAJI</p><h1>Wasiliana na Admin</h1>
    <p className="muted">Tuma swali au ripoti tatizo. Admin atakujibu hapa ndani ya akaunti yako.</p>
    {params.error && <p className="message">{params.error}</p>}
    {params.sent && <p className="notice">Ujumbe umetumwa.</p>}
    {error ? <p className="message">Imeshindikana kufungua mazungumzo. Jaribu tena baadaye.</p> :
      <SupportChat sellerId={user.id} currentUserId={user.id} messages={messages ?? []}/>}
  </main>;
}
