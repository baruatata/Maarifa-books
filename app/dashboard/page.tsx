import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { LanguageText } from "@/components/language-provider";

export default async function Dashboard({searchParams}:{searchParams:Promise<{error?:string;saved?:string;deleted?:string}>}) {
  const query=await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");

  const { data: profile } = await supabase.from("profiles").select("full_name,role,seller_status").eq("id", user.id).single();
  if (profile?.role === "admin") redirect("/admin");

  const [{ data: books }, { data: application }, { data: couponRequests, count: couponRequestCount }] = await Promise.all([
    supabase.from("books").select("id,title,status,price_tzs,format,created_at").eq("seller_id", user.id).order("created_at", { ascending: false }),
    supabase.from("seller_applications").select("store_name,status,review_note,phone_number").eq("user_id", user.id).maybeSingle(),
    supabase.from("book_coupon_requests").select("id,book_id,customer_phone,created_at", { count: "exact" })
      .eq("seller_id", user.id).eq("status", "pending").order("created_at", { ascending: false }).limit(5),
  ]);

  const rows = books ?? [];
  const approved = rows.filter(book => book.status === "approved").length;
  const pending = rows.filter(book => book.status === "pending").length;
  const paidBooks = rows.filter(book => book.price_tzs > 0).length;
  const pendingCouponCount = couponRequestCount ?? 0;
  const bookById = new Map(rows.map(book => [book.id, book]));

  if (application?.status === "approved") {
    return <main className="page seller-dashboard">
      <div className="seller-dash-top"><div><p className="eyebrow"><LanguageText sw="DASHIBODI YA MUUZAJI" en="SELLER DASHBOARD" /></p><h1><LanguageText sw="Karibu," en="Welcome," /> {profile?.full_name || user.email}</h1><p className="muted"><LanguageText sw="Duka lako:" en="Your store:" /> <strong>{application?.store_name || "Duka lako"}</strong></p></div><form action={signOut}><button className="btn btn-outline"><LanguageText sw="Toka kwenye akaunti" en="Sign out" /></button></form></div>
      <section className="seller-metrics">
        <article className="panel"><span><LanguageText sw="Vitabu vyangu" en="My books" /></span><strong>{rows.length}</strong></article>
        <article className="panel"><span><LanguageText sw="Vilivyoidhinishwa" en="Approved" /></span><strong>{approved}</strong></article>
        <article className="panel"><span><LanguageText sw="Vinasubiri ukaguzi" en="Awaiting review" /></span><strong>{pending}</strong></article>
        <article className="panel"><span><LanguageText sw="Vitabu vya kulipia" en="Paid books" /></span><strong>{paidBooks}</strong></article>
      </section>
      <section className="panel seller-books-panel" aria-live="polite">
        <h2><LanguageText sw="Maombi ya coupon" en="Coupon requests" /> {pendingCouponCount > 0 && <span className="status">{pendingCouponCount} mapya</span>}</h2>
        {pendingCouponCount > 0 ? <>
          <p className="muted"><LanguageText sw={`Una maombi ${pendingCouponCount} ya coupon yanayosubiri. Kagua taarifa za malipo kabla ya kuthibitisha kupokea fedha.`} en={`You have ${pendingCouponCount} pending coupon requests. Check payment details before confirming receipt.`} /></p>
          <ul>{(couponRequests ?? []).map(request => <li key={request.id}>{bookById.get(request.book_id)?.title || "Kitabu"} — {request.customer_phone}</li>)}</ul>
        </> : <p className="muted"><LanguageText sw="Hakuna ombi jipya la coupon linalosubiri kwa sasa." en="There are no new pending coupon requests." /></p>}
        <Link className="btn btn-outline" href="/dashboard/kuponi"><LanguageText sw="Fungua maombi ya coupon" en="View coupon requests" /></Link>
      </section>
      <div className="seller-actions"><Link className="btn" href="/dashboard/kitabu">+ <LanguageText sw="Pakia kitabu kipya" en="Upload a new book" /></Link><Link className="btn btn-outline" href="/dashboard/kuponi"><LanguageText sw="Tengeneza Coupon" en="Create coupon" /></Link><Link className="btn btn-outline" href="/dashboard/usalama"><LanguageText sw="Usalama wa akaunti" en="Account security" /></Link><Link className="btn btn-outline" href="/dashboard/mawasiliano"><LanguageText sw="Wasiliana na Admin" en="Contact admin" /></Link><Link className="btn btn-outline" href="/"><LanguageText sw="Tazama maktaba" en="View library" /></Link></div><section className="panel seller-books-panel"><h2><LanguageText sw="WhatsApp ya kupokea oda" en="Order WhatsApp number" /></h2><p className="muted">Wateja watatumia namba hii kuwasiliana nawe wanapotaka kununua kitabu. Baada ya kuthibitisha malipo, tengeneza coupon kwenye sehemu ya “Tengeneza Coupon” na umtumie mteja.</p><strong>{application.phone_number || "Namba haijawekwa"}</strong></section>
      <section className="panel seller-books-panel"><h2><LanguageText sw="Vitabu vyangu" en="My books" /></h2>{!rows.length ? <p className="muted"><LanguageText sw="Bado hujapakia kitabu. Bonyeza “Pakia kitabu kipya” kuanza kuuza." en="You have not uploaded a book yet. Select “Upload a new book” to start selling." /></p> : <div className="table-wrap"><table className="table"><thead><tr><th><LanguageText sw="Kitabu" en="Book" /></th><th><LanguageText sw="Aina" en="Type" /></th><th><LanguageText sw="Bei" en="Price" /></th><th><LanguageText sw="Hali" en="Status" /></th><th><LanguageText sw="Vitendo" en="Actions" /></th></tr></thead><tbody>{rows.map(book => <tr key={book.id}><td>{book.title}</td><td>{String(book.format).toUpperCase()}</td><td>{book.price_tzs > 0 ? "TSh " + new Intl.NumberFormat("sw-TZ").format(book.price_tzs) : "BURE"}</td><td><span className="status">{book.status === "approved" ? "Kimeidhinishwa" : book.status === "pending" ? "Kinasubiri" : book.status === "rejected" ? "Kimekataliwa" : "Rasimu"}</span></td><td><Link href={"/dashboard/kitabu/"+book.id}><LanguageText sw="Hariri" en="Edit" /></Link></td></tr>)}</tbody></table></div>}</section>
      {query.error && <p className="message">{query.error}</p>}{query.saved && <p className="notice">Taarifa zimehifadhiwa.</p>}{query.deleted && <p className="notice">Kitabu kimefutwa.</p>}
      <section className="panel seller-books-panel"><h2>Oda na mauzo kupitia WhatsApp</h2><p className="muted">MaarifaBooks haitakusanyia malipo. Mteja atalipa moja kwa moja kwako kupitia maelekezo utakayompa WhatsApp. Ukishathibitisha malipo, tengeneza coupon ya kitabu husika ili kumfungulia kitabu kizima.</p></section>
    </main>;
  }

  return <main className="page"><p className="eyebrow">DASHIBODI</p><h1><LanguageText sw="Karibu," en="Welcome," /> {profile?.full_name || user.email}</h1><p className="muted"><LanguageText sw="Akaunti: Mnunuzi" en="Account: Buyer" /></p>
    <div className="dashlinks"><Link href="/dashboard/jihudumie">Jihudumie</Link><Link href="/dashboard/vitabu">Maktaba ya bure</Link><Link href="/dashboard/usalama">Usalama wa akaunti</Link><Link href="/wauzaji">Omba kuwa muuzaji</Link><Link href="/"><LanguageText sw="Chunguza maktaba" en="Explore library" /></Link><form action={signOut}><button className="btn">Toka</button></form></div>
    {application && <section className="panel" style={{ padding: 18, marginBottom: 20 }}><h2>Ombi la duka: {application.store_name}</h2><p>Hali ya ombi: <span className="status">{application.status === "pending" ? "Linasubiri idhini" : application.status === "approved" ? "Limeidhinishwa" : "Halijaidhinishwa"}</span></p>{application.review_note && <p className="muted">Maelezo ya Admin: {application.review_note}</p>}{application.status === "pending" && <p className="muted">Tutakujulisha baada ya timu kukagua ombi lako. Ukishakubaliwa, dashibodi ya muuzaji itafunguka hapa.</p>}</section>}
    <section className="panel" style={{ padding: 18 }}><h2>Karibu kwenye MaarifaBooks</h2><p className="muted">Soma vitabu vya kidijitali bure. Unataka kuchangia maktaba kwa kupakia kitabu? Tuma ombi la kuwa muuzaji.</p><Link className="btn" href="/wauzaji">Anza kuuza vitabu</Link></section>
  </main>;
}
