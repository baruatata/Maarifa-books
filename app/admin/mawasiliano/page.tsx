import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SupportChat from "@/components/support-chat";

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ seller?: string; error?: string; sent?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard?error=Huna+ruhusa+ya+admin");

  const [{ data: sellers }, { data: allMessages }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email").eq("role", "seller").order("full_name"),
    supabase.from("support_messages").select("seller_id,sender_id,body,created_at,read_at").order("created_at", { ascending: false }),
  ]);
  const latestBySeller = new Map<string, { body: string; created_at: string; unread: number }>();
  for (const message of allMessages ?? []) {
    const current = latestBySeller.get(message.seller_id);
    if (!current) latestBySeller.set(message.seller_id, {
      body: message.body, created_at: message.created_at,
      unread: message.sender_id !== message.seller_id && !message.read_at ? 1 : 0
    });
    else if (message.sender_id !== message.seller_id && !message.read_at) current.unread++;
  }
  const selected = (sellers ?? []).find(s => s.id === params.seller) ?? (sellers ?? []).find(s => latestBySeller.has(s.id));
  const { data: messages, error } = selected ? await supabase.from("support_messages")
    .select("id,sender_id,body,created_at,read_at").eq("seller_id", selected.id).order("created_at", { ascending: true }) : { data: [], error: null };
  const unread = (messages ?? []).filter(m => m.sender_id === selected?.id && !m.read_at).map(m => m.id);
  if (unread.length) await supabase.from("support_messages").update({ read_at: new Date().toISOString() }).in("id", unread);

  return <main className="page">
    <Link href="/admin" className="muted">← Rudi kwenye Admin</Link>
    <p className="eyebrow">KITUO CHA MAWASILIANO</p><h1>Admin na wauzaji</h1>
    <p className="muted">Chagua muuzaji ili kusoma na kujibu ujumbe wake. Mazungumzo ni ya faragha.</p>
    {params.error && <p className="message">{params.error}</p>}
    {params.sent && <p className="notice">Ujumbe umetumwa.</p>}
    <section className="panel" style={{ padding: 16, marginTop: 18 }}>
      <h2>Orodha ya wauzaji</h2>
      {!sellers?.length && <p className="muted">Hakuna muuzaji aliyeidhinishwa bado.</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {(sellers ?? []).map(seller => {
          const latest = latestBySeller.get(seller.id);
          return <Link key={seller.id} href={"/admin/mawasiliano?seller=" + seller.id}
            className="btn btn-outline" style={{ display: "flex", justifyContent: "space-between", gap: 12, textAlign: "left" }}>
            <span><strong>{seller.full_name || seller.email || "Muuzaji"}</strong>
              {latest && <small style={{ display: "block", opacity: .75 }}>{latest.body.slice(0, 75)}</small>}</span>
            {latest?.unread ? <strong>{latest.unread} mpya</strong> : <span>Fungua →</span>}
          </Link>;
        })}
      </div>
    </section>
    {selected && (error ? <p className="message">Imeshindikana kupakia ujumbe.</p> :
      <><h2 style={{ marginTop: 24 }}>Mazungumzo: {selected.full_name || selected.email || "Muuzaji"}</h2>
      <SupportChat sellerId={selected.id} currentUserId={user.id} messages={messages ?? []} adminMode/></>)}
  </main>;
}
