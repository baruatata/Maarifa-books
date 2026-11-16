import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { saveSellerPayoutMethod } from "@/app/dashboard/kitabu/actions";
import { reviewManualPayment } from "@/app/kitabu/[id]/actions";

export default async function Dashboard({searchParams}:{searchParams:Promise<{error?:string;saved?:string;deleted?:string}>}) {
  const query=await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");

  const { data: profile } = await supabase.from("profiles").select("full_name,role,seller_status").eq("id", user.id).single();
  if (profile?.role === "admin") redirect("/admin");

  const [{ data: books }, { data: application }, { data: sales }, { data: paidOrders }, { data: payout }, { data: paymentSubmissions }] = await Promise.all([
    supabase.from("books").select("id,title,status,price_tzs,format,created_at").eq("seller_id", user.id).order("created_at", { ascending: false }),
    supabase.from("seller_applications").select("store_name,status,review_note").eq("user_id", user.id).maybeSingle(),
    supabase.from("order_items").select("id,order_id,unit_price_tzs").eq("seller_id", user.id),
    supabase.from("orders").select("id,total_tzs").eq("status", "paid"),
    supabase.from("seller_payout_methods").select("provider,phone_number,account_name").eq("seller_id",user.id).maybeSingle(),
    supabase.from("payment_submissions").select("id,order_id,amount_tzs,payment_provider,payer_phone,transaction_reference,status,created_at").eq("seller_id",user.id).order("created_at",{ascending:false}).limit(30),
  ]);

  const rows = books ?? [];
  const approved = rows.filter(book => book.status === "approved").length;
  const pending = rows.filter(book => book.status === "pending").length;
  const paidOrderIds = new Set((paidOrders ?? []).map(order => order.id));
  const soldCount = (sales ?? []).filter(item => paidOrderIds.has(item.order_id)).length;
  const paid = (sales ?? []).filter(item => paidOrderIds.has(item.order_id)).reduce((sum, item) => sum + Number(item.unit_price_tzs || 0), 0);
  const money = (amount: number) => new Intl.NumberFormat("sw-TZ").format(amount);

  if (application?.status === "approved") {
    return <main className="page seller-dashboard">
      <div className="seller-dash-top"><div><p className="eyebrow">DASHIBODI YA MUUZAJI</p><h1>Karibu, {profile?.full_name || user.email}</h1><p className="muted">Duka lako: <strong>{application?.store_name || "Duka lako"}</strong></p></div><form action={signOut}><button className="btn btn-outline">Toka kwenye akaunti</button></form></div>
      <section className="seller-metrics">
        <article className="panel"><span>Vitabu vyangu</span><strong>{rows.length}</strong></article>
        <article className="panel"><span>Vilivyoidhinishwa</span><strong>{approved}</strong></article>
        <article className="panel"><span>Vinasubiri ukaguzi</span><strong>{pending}</strong></article>
        <article className="panel"><span>Mauzo yaliyolipwa</span><strong>TSh {money(paid)}</strong></article>
      </section>
      <div className="seller-actions"><Link className="btn" href="/dashboard/kitabu">+ Pakia kitabu kipya</Link><Link className="btn btn-outline" href="/dashboard/usalama">Usalama wa akaunti</Link><Link className="btn btn-outline" href="/">Tazama maktaba</Link></div>
      <section className="panel seller-books-panel"><h2>Vitabu vyangu</h2>{!rows.length ? <p className="muted">Bado hujapakia kitabu. Bonyeza “Pakia kitabu kipya” kuanza kuuza.</p> : <div className="table-wrap"><table className="table"><thead><tr><th>Kitabu</th><th>Aina</th><th>Bei</th><th>Hali</th><th>Vitendo</th></tr></thead><tbody>{rows.map(book => <tr key={book.id}><td>{book.title}</td><td>{String(book.format).toUpperCase()}</td><td>TSh {money(book.price_tzs)}</td><td><span className="status">{book.status === "approved" ? "Kimeidhinishwa" : book.status === "pending" ? "Kinasubiri" : book.status === "rejected" ? "Kimekataliwa" : "Rasimu"}</span></td><td><Link href={"/dashboard/kitabu/"+book.id}>Hariri</Link></td></tr>)}</tbody></table></div>}</section>
      {query.error && <p className="message">{query.error}</p>}{query.saved && <p className="notice">Taarifa zimehifadhiwa.</p>}{query.deleted && <p className="notice">Kitabu kimefutwa.</p>}
      <section className="panel seller-books-panel"><h2>Njia ya kupokea malipo</h2><p className="muted">Weka namba yako ya simu ya kupokea fedha za mauzo. Hii ni taarifa ya akaunti yako ya malipo.</p><form action={async (formData)=>{ "use server"; const result=await saveSellerPayoutMethod(formData); if(!result.ok) redirect("/dashboard?error="+encodeURIComponent(result.error)); redirect("/dashboard?saved=payout"); }} className="form"><div className="field"><label htmlFor="payout-provider">Mtandao wa simu</label><select id="payout-provider" name="provider" defaultValue={payout?.provider||"mixx"}><option value="mixx">Mixx by Yas</option><option value="mpesa">M-Pesa</option><option value="airtel_money">Airtel Money</option><option value="tigo_pesa">Tigo Pesa</option></select></div><div className="field"><label htmlFor="payout-phone">Namba ya kupokea malipo</label><input id="payout-phone" name="phone_number" defaultValue={payout?.phone_number||""} placeholder="07XXXXXXXX" required /></div><div className="field"><label htmlFor="payout-name">Jina la mmiliki wa namba</label><input id="payout-name" name="account_name" defaultValue={payout?.account_name||""} required /></div><button className="btn">Hifadhi njia ya malipo</button></form></section>
      <section className="panel seller-books-panel"><h2>Uthibitishaji wa malipo ya wateja</h2>{!(paymentSubmissions ?? []).length ? <p className="muted">Bado hakuna uthibitisho wa malipo uliowasilishwa.</p> : <div className="table-wrap"><table className="table"><thead><tr><th>Oda</th><th>Kiasi</th><th>Mtandao</th><th>Namba ya mlipaji</th><th>Muamala</th><th>Hali / hatua</th></tr></thead><tbody>{(paymentSubmissions ?? []).map(item => <tr key={item.id}><td>{item.order_id.slice(0,8)}</td><td>TSh {money(item.amount_tzs)}</td><td>{item.payment_provider}</td><td>{item.payer_phone}</td><td>{item.transaction_reference}</td><td>{item.status === "submitted" ? <form action={reviewManualPayment} className="seller-payment-review"><input type="hidden" name="submission_id" value={item.id}/><input type="hidden" name="order_id" value={item.order_id}/><button className="btn" name="decision" value="confirmed">Thibitisha</button><button className="btn btn-outline" name="decision" value="rejected">Kataa</button></form> : item.status === "confirmed" ? "Imethibitishwa" : "Imekataliwa"}</td></tr>)}</tbody></table></div>}</section>
      <section className="panel seller-books-panel"><h2>Muhtasari wa mauzo</h2><p className="muted">Idadi ya nakala zilizouzwa: {soldCount}. Malipo yaliyowekwa kuwa yamelipwa: TSh {money(paid)}.</p><p className="muted">Kwa sasa malipo yanafuatiliwa kulingana na taarifa zilizopo kwenye mfumo.</p></section>
    </main>;
  }

  return <main className="page"><p className="eyebrow">DASHIBODI</p><h1>Karibu, {profile?.full_name || user.email}</h1><p className="muted">Akaunti: Mnunuzi</p>
    <div className="dashlinks"><Link href="/dashboard/vitabu">Vitabu nilivyonunua</Link><Link href="/dashboard/usalama">Usalama wa akaunti</Link><Link href="/wauzaji">Omba kuwa muuzaji</Link><Link href="/">Chunguza maktaba</Link><form action={signOut}><button className="btn">Toka</button></form></div>
    {application && <section className="panel" style={{ padding: 18, marginBottom: 20 }}><h2>Ombi la duka: {application.store_name}</h2><p>Hali ya ombi: <span className="status">{application.status === "pending" ? "Linasubiri idhini" : application.status === "approved" ? "Limeidhinishwa" : "Halijaidhinishwa"}</span></p>{application.review_note && <p className="muted">Maelezo ya Admin: {application.review_note}</p>}{application.status === "pending" && <p className="muted">Tutakujulisha baada ya timu kukagua ombi lako. Ukishakubaliwa, dashibodi ya muuzaji itafunguka hapa.</p>}</section>}
    <section className="panel" style={{ padding: 18 }}><h2>Karibu kwenye MaarifaBooks</h2><p className="muted">Nunua na usome vitabu vya kidijitali. Unataka kuuza vitabu vyako? Tuma ombi la kuwa muuzaji.</p><Link className="btn" href="/wauzaji">Anza kuuza vitabu</Link></section>
  </main>;
}
