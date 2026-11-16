import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function Dashboard({searchParams}:{searchParams:Promise<{error?:string;saved?:string;deleted?:string}>}) {
  const query=await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");

  const { data: profile } = await supabase.from("profiles").select("full_name,role,seller_status").eq("id", user.id).single();
  if (profile?.role === "admin") redirect("/admin");

  const [{ data: books }, { data: application }] = await Promise.all([
    supabase.from("books").select("id,title,status,price_tzs,format,created_at").eq("seller_id", user.id).order("created_at", { ascending: false }),
    supabase.from("seller_applications").select("store_name,status,review_note").eq("user_id", user.id).maybeSingle(),
  ]);

  const rows = books ?? [];
  const approved = rows.filter(book => book.status === "approved").length;
  const pending = rows.filter(book => book.status === "pending").length;

  if (application?.status === "approved") {
    return <main className="page seller-dashboard">
      <div className="seller-dash-top"><div><p className="eyebrow">DASHIBODI YA MUUZAJI</p><h1>Karibu, {profile?.full_name || user.email}</h1><p className="muted">Duka lako: <strong>{application?.store_name || "Duka lako"}</strong></p></div><form action={signOut}><button className="btn btn-outline">Toka kwenye akaunti</button></form></div>
      <section className="seller-metrics">
        <article className="panel"><span>Vitabu vyangu</span><strong>{rows.length}</strong></article>
        <article className="panel"><span>Vilivyoidhinishwa</span><strong>{approved}</strong></article>
        <article className="panel"><span>Vinasubiri ukaguzi</span><strong>{pending}</strong></article>
        <article className="panel"><span>Bei kwa wasomaji</span><strong>BURE</strong></article>
      </section>
      <div className="seller-actions"><Link className="btn" href="/dashboard/kitabu">+ Pakia kitabu kipya</Link><Link className="btn btn-outline" href="/dashboard/usalama">Usalama wa akaunti</Link><Link className="btn btn-outline" href="/">Tazama maktaba</Link></div>
      <section className="panel seller-books-panel"><h2>Vitabu vyangu</h2>{!rows.length ? <p className="muted">Bado hujapakia kitabu. Bonyeza “Pakia kitabu kipya” kuanza kuuza.</p> : <div className="table-wrap"><table className="table"><thead><tr><th>Kitabu</th><th>Aina</th><th>Bei</th><th>Hali</th><th>Vitendo</th></tr></thead><tbody>{rows.map(book => <tr key={book.id}><td>{book.title}</td><td>{String(book.format).toUpperCase()}</td><td>BURE</td><td><span className="status">{book.status === "approved" ? "Kimeidhinishwa" : book.status === "pending" ? "Kinasubiri" : book.status === "rejected" ? "Kimekataliwa" : "Rasimu"}</span></td><td><Link href={"/dashboard/kitabu/"+book.id}>Hariri</Link></td></tr>)}</tbody></table></div>}</section>
      {query.error && <p className="message">{query.error}</p>}{query.saved && <p className="notice">Taarifa zimehifadhiwa.</p>}{query.deleted && <p className="notice">Kitabu kimefutwa.</p>}
      <section className="panel seller-books-panel"><h2>Vitabu vya bure</h2><p className="muted">Kwa sasa mfumo hauna malipo. Wasomaji wanaweza kufungua na kusoma vitabu vilivyoidhinishwa bila kulipa.</p></section>
    </main>;
  }

  return <main className="page"><p className="eyebrow">DASHIBODI</p><h1>Karibu, {profile?.full_name || user.email}</h1><p className="muted">Akaunti: Mnunuzi</p>
    <div className="dashlinks"><Link href="/dashboard/vitabu">Maktaba ya bure</Link><Link href="/dashboard/usalama">Usalama wa akaunti</Link><Link href="/wauzaji">Omba kuwa muuzaji</Link><Link href="/">Chunguza maktaba</Link><form action={signOut}><button className="btn">Toka</button></form></div>
    {application && <section className="panel" style={{ padding: 18, marginBottom: 20 }}><h2>Ombi la duka: {application.store_name}</h2><p>Hali ya ombi: <span className="status">{application.status === "pending" ? "Linasubiri idhini" : application.status === "approved" ? "Limeidhinishwa" : "Halijaidhinishwa"}</span></p>{application.review_note && <p className="muted">Maelezo ya Admin: {application.review_note}</p>}{application.status === "pending" && <p className="muted">Tutakujulisha baada ya timu kukagua ombi lako. Ukishakubaliwa, dashibodi ya muuzaji itafunguka hapa.</p>}</section>}
    <section className="panel" style={{ padding: 18 }}><h2>Karibu kwenye MaarifaBooks</h2><p className="muted">Soma vitabu vya kidijitali bure. Unataka kuchangia maktaba kwa kupakia kitabu? Tuma ombi la kuwa muuzaji.</p><Link className="btn" href="/wauzaji">Anza kuuza vitabu</Link></section>
  </main>;
}
