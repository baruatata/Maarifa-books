import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");

  const { data: profile } = await supabase.from("profiles").select("full_name,role,seller_status").eq("id", user.id).single();
  if (profile?.role === "admin") redirect("/admin");

  const [{ data: books }, { data: application }, { data: payments }, { data: sales }] = await Promise.all([
    supabase.from("books").select("id,title,status,price_tzs,format,created_at").eq("seller_id", user.id).order("created_at", { ascending: false }),
    supabase.from("seller_applications").select("store_name,status,review_note").eq("user_id", user.id).maybeSingle(),
    supabase.from("seller_payments").select("amount_tzs,status").eq("seller_id", user.id),
    supabase.from("order_items").select("id").eq("seller_id", user.id),
  ]);

  const rows = books ?? [];
  const approved = rows.filter(book => book.status === "approved").length;
  const pending = rows.filter(book => book.status === "pending").length;
  const paid = (payments ?? []).filter(item => item.status === "paid").reduce((sum, item) => sum + Number(item.amount_tzs || 0), 0);
  const money = (amount: number) => new Intl.NumberFormat("sw-TZ").format(amount);

  if (application?.status === "approved") {
    return <main className="page seller-dashboard">
      <div className="seller-dash-top"><div><p className="eyebrow">DASHIBODI YA MUUZAJI</p><h1>Karibu, {profile.full_name || user.email}</h1><p className="muted">Duka lako: <strong>{application.store_name}</strong></p></div><form action={signOut}><button className="btn btn-outline">Toka kwenye akaunti</button></form></div>
      <section className="seller-metrics">
        <article className="panel"><span>Vitabu vyangu</span><strong>{rows.length}</strong></article>
        <article className="panel"><span>Vilivyoidhinishwa</span><strong>{approved}</strong></article>
        <article className="panel"><span>Vinasubiri ukaguzi</span><strong>{pending}</strong></article>
        <article className="panel"><span>Mauzo yaliyolipwa</span><strong>TSh {money(paid)}</strong></article>
      </section>
      <div className="seller-actions"><Link className="btn" href="/dashboard/kitabu">+ Pakia kitabu kipya</Link><Link className="btn btn-outline" href="/">Tazama maktaba</Link></div>
      <section className="panel seller-books-panel"><h2>Vitabu vyangu</h2>{!rows.length ? <p className="muted">Bado hujapakia kitabu. Bonyeza “Pakia kitabu kipya” kuanza kuuza.</p> : <div className="table-wrap"><table className="table"><thead><tr><th>Kitabu</th><th>Aina</th><th>Bei</th><th>Hali</th></tr></thead><tbody>{rows.map(book => <tr key={book.id}><td>{book.title}</td><td>{String(book.format).toUpperCase()}</td><td>TSh {money(book.price_tzs)}</td><td><span className="status">{book.status === "approved" ? "Kimeidhinishwa" : book.status === "pending" ? "Kinasubiri" : book.status === "rejected" ? "Kimekataliwa" : "Rasimu"}</span></td></tr>)}</tbody></table></div>}</section>
      <section className="panel seller-books-panel"><h2>Muhtasari wa mauzo</h2><p className="muted">Idadi ya nakala zilizouzwa: {(sales ?? []).length}. Malipo yaliyowekwa kuwa yamelipwa: TSh {money(paid)}.</p><p className="muted">Kwa sasa malipo yanafuatiliwa kulingana na taarifa zilizopo kwenye mfumo.</p></section>
    </main>;
  }

  return <main className="page"><p className="eyebrow">DASHIBODI</p><h1>Karibu, {profile?.full_name || user.email}</h1><p className="muted">Akaunti: Mnunuzi</p>
    <div className="dashlinks"><Link href="/wauzaji">Omba kuwa muuzaji</Link><Link href="/">Chunguza maktaba</Link><form action={signOut}><button className="btn">Toka</button></form></div>
    {application && <section className="panel" style={{ padding: 18, marginBottom: 20 }}><h2>Ombi la duka: {application.store_name}</h2><p>Hali ya ombi: <span className="status">{application.status === "pending" ? "Linasubiri idhini" : application.status === "approved" ? "Limeidhinishwa" : "Halijaidhinishwa"}</span></p>{application.review_note && <p className="muted">Maelezo ya Admin: {application.review_note}</p>}{application.status === "pending" && <p className="muted">Tutakujulisha baada ya timu kukagua ombi lako. Ukishakubaliwa, dashibodi ya muuzaji itafunguka hapa.</p>}</section>}
    <section className="panel" style={{ padding: 18 }}><h2>Karibu kwenye MaarifaBooks</h2><p className="muted">Nunua na usome vitabu vya kidijitali. Unataka kuuza vitabu vyako? Tuma ombi la kuwa muuzaji.</p><Link className="btn" href="/wauzaji">Anza kuuza vitabu</Link></section>
  </main>;
}
