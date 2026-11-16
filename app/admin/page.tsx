import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reviewBook, reviewSeller } from "@/app/admin/actions";
import { signOut } from "@/app/auth/actions";

type SellerApplication = { id: string; user_id: string; store_name: string; bio: string | null; phone_number: string; status: string; created_at: string };
type Book = { id: string; seller_id: string; title: string; author_name: string | null; description: string | null; format: string; language: string; price_tzs: number; status: string; created_at: string; file_path: string | null; cover_path: string | null };
type Payment = { id: string; order_id: string; buyer_id: string; seller_id: string; amount_tzs: number; payment_provider: string; payer_phone: string; transaction_reference: string; status: string; seller_note: string | null; created_at: string; reviewed_at: string | null };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: me } = await supabase.from("profiles").select("role,full_name").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard?error=Huna+ruhusa+ya+admin");

  const [{ data: applications }, { data: books }, { count: sellerCount }, { count: bookCount }, { count: memberCount }] = await Promise.all([
    supabase.from("seller_applications").select("id,user_id,store_name,bio,phone_number,status,created_at").eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("books").select("id,seller_id,title,author_name,description,format,language,price_tzs,status,created_at,file_path,cover_path").eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("seller_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);
  const sellerRows = (applications ?? []) as SellerApplication[];
  const bookRows = (books ?? []) as Book[];
  const { data: payments } = await supabase.from("payment_submissions")
    .select("id,order_id,buyer_id,seller_id,amount_tzs,payment_provider,payer_phone,transaction_reference,status,seller_note,created_at,reviewed_at")
    .order("created_at", { ascending: false }).limit(100);
  const paymentRows = (payments ?? []) as Payment[];
  const paymentOrderIds = [...new Set(paymentRows.map(row => row.order_id))];
  const { data: paymentItems } = paymentOrderIds.length
    ? await supabase.from("order_items").select("order_id,book_id").in("order_id", paymentOrderIds)
    : { data: [] as { order_id: string; book_id: string }[] };
  const paymentBookIds = [...new Set((paymentItems ?? []).map(row => row.book_id))];
  const { data: paymentBooks } = paymentBookIds.length
    ? await supabase.from("books").select("id,title").in("id", paymentBookIds)
    : { data: [] as { id: string; title: string }[] };
  const paymentBookMap = new Map((paymentBooks ?? []).map(row => [row.id, row.title]));
  const paymentTitles = new Map<string, string[]>();
  for (const item of paymentItems ?? []) {
    const list = paymentTitles.get(item.order_id) ?? [];
    const title = paymentBookMap.get(item.book_id);
    if (title) list.push(title);
    paymentTitles.set(item.order_id, list);
  }
  const profileIds = [...new Set([...sellerRows.map(row => row.user_id), ...bookRows.map(row => row.seller_id), ...paymentRows.flatMap(row => [row.buyer_id, row.seller_id])])];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id,full_name,email,phone").in("id", profileIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null; phone: string | null }[] };
  const profileMap = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  const money = (amount: number) => new Intl.NumberFormat("sw-TZ").format(amount);
  const bookLinks = new Map(await Promise.all(bookRows.map(async book => {
    const [file, cover] = await Promise.all([
      book.file_path ? supabase.storage.from("book-files").createSignedUrl(book.file_path, 86400) : Promise.resolve({data:null}),
      book.cover_path ? supabase.storage.from("book-files").createSignedUrl(book.cover_path, 86400) : Promise.resolve({data:null}),
    ]);
    return [book.id, {fileUrl:file.data?.signedUrl ?? null, coverUrl:cover.data?.signedUrl ?? null}] as const;
  })));

  return <main className="admin-console">
    <aside className="admin-sidebar">
      <Link href="/" className="admin-brand"><img src="/maarifabooks-logo.svg" alt="MaarifaBooks"/></Link>
      <p className="admin-side-label">USIMAMIZI</p>
      <a className="admin-side-link active" href="#overview"><span>⌂</span> Dashboard</a>
      <a className="admin-side-link" href="#seller-review"><span>♙</span> Maombi ya wauzaji <b>{sellerRows.length}</b></a>
      <a className="admin-side-link" href="#book-review"><span>▤</span> Vitabu vya kukagua <b>{bookRows.length}</b></a>
      <a className="admin-side-link" href="#payment-review"><span>৳</span> Usimamizi wa malipo <b>{paymentRows.length}</b></a>
      <a className="admin-side-link" href="#members"><span>♧</span> Wanachama</a>
      <div className="admin-side-bottom">
        <div className="admin-side-user"><span className="admin-avatar">{(me.full_name || user.email || "A").slice(0,1).toUpperCase()}</span><div><strong>{me.full_name || "Msimamizi"}</strong><small>Administrator</small></div></div>
        <form action={signOut}><button className="admin-logout"><span>⇥</span> Toka kwenye akaunti</button></form>
      </div>
    </aside>

    <section className="admin-workspace" id="overview">
      <header className="admin-toolbar">
        <div><span className="admin-toolbar-kicker">LUMBWA DIGITAL / MAARIFABOOKS</span><h1>Dashboard ya Msimamizi</h1></div>
        <div className="admin-toolbar-right"><span className="admin-status-pill">● Akaunti ya Admin</span><form action={signOut}><button className="admin-logout-mobile">Toka</button></form></div>
      </header>
      {params.error && <p className="message">{params.error}</p>}{params.success && <p className="notice">{params.success}</p>}
      <section className="admin-welcome">
        <div><p className="admin-gold-kicker">KARIBU TENA</p><h2>{me.full_name || user.email}</h2><p>Dhibiti maombi ya wauzaji na pitia vitabu kabla havijaonekana kwenye maktaba ya MaarifaBooks.</p></div>
        <div className="admin-welcome-mark">MB</div>
      </section>

      <section className="admin-metric-grid" id="members">
        <article className="admin-metric"><span className="metric-icon">♙</span><p>Jumla ya wanachama</p><strong>{memberCount ?? 0}</strong><small>Wasajili wa jukwaa</small></article>
        <article className="admin-metric"><span className="metric-icon">♧</span><p>Maombi ya wauzaji</p><strong>{sellerCount ?? 0}</strong><small>Yanasubiri uamuzi</small></article>
        <article className="admin-metric"><span className="metric-icon">▤</span><p>Vitabu vya kukagua</p><strong>{bookCount ?? 0}</strong><small>Vinasubiri idhini</small></article>
      </section>

      <div className="admin-content-grid">
        <div className="admin-main-column">
          <section className="admin-panel" id="payment-review">
            <div className="admin-panel-heading"><div><span className="admin-gold-kicker">UFUATILIAJI WA MAUZO</span><h2>Usimamizi wa malipo</h2></div><span className="admin-count">{paymentRows.length} jumla</span></div>
            <div className="admin-payment-summary">
              <div><span>Inasubiri</span><strong>{paymentRows.filter(row => row.status === "submitted").length}</strong></div>
              <div><span>Yamethibitishwa</span><strong>{paymentRows.filter(row => row.status === "confirmed").length}</strong></div>
              <div><span>Yamekataliwa</span><strong>{paymentRows.filter(row => row.status === "rejected").length}</strong></div>
            </div>
            {paymentRows.length === 0 ? <div className="admin-empty">Hakuna taarifa za malipo zilizotumwa bado.</div> : <div className="admin-payment-list">{paymentRows.map(payment => {
              const buyer = profileMap.get(payment.buyer_id);
              const seller = profileMap.get(payment.seller_id);
              const statusLabel = payment.status === "confirmed" ? "Imethibitishwa na muuzaji" : payment.status === "rejected" ? "Imekataliwa na muuzaji" : "Inasubiri uthibitisho";
              return <article className="admin-payment-card" key={payment.id}>
                <div className="admin-payment-top"><div><h3>{(paymentTitles.get(payment.order_id) ?? []).join(", ") || "Kitabu hakijapatikana"}</h3><p>Mnunuzi: {buyer?.full_name || buyer?.email || payment.buyer_id}</p><p>Muuzaji: {seller?.full_name || seller?.email || payment.seller_id}</p></div><span className={payment.status === "confirmed" ? "admin-payment-status confirmed" : payment.status === "rejected" ? "admin-payment-status rejected" : "admin-payment-status pending"}>{statusLabel}</span></div>
                <div className="admin-payment-details">
                  <div><small>Kiasi</small><strong>TSh {money(payment.amount_tzs)}</strong></div>
                  <div><small>Mtandao</small><strong>{payment.payment_provider.replaceAll("_", " ").toUpperCase()}</strong></div>
                  <div><small>Namba ya mlipaji</small><strong>{payment.payer_phone}</strong></div>
                  <div><small>Kumbukumbu ya muamala</small><strong>{payment.transaction_reference}</strong></div>
                  <div><small>Tarehe ya kutuma</small><strong>{new Date(payment.created_at).toLocaleString("sw-TZ")}</strong></div>
                  {payment.reviewed_at && <div><small>Tarehe ya uamuzi</small><strong>{new Date(payment.reviewed_at).toLocaleString("sw-TZ")}</strong></div>}
                </div>
                {payment.seller_note && <p className="admin-payment-note">Maelezo ya muuzaji: {payment.seller_note}</p>}
              </article>;
            })}</div>}
            <p className="admin-payment-disclaimer">Taarifa hizi ni kumbukumbu zilizotumwa na wanunuzi na maamuzi ya wauzaji. Admin anaweza kuzifuatilia; mfumo hauhakiki miamala moja kwa moja kutoka mitandao ya simu.</p>
          </section>

          <section className="admin-panel" id="seller-review">
            <div className="admin-panel-heading"><div><span className="admin-gold-kicker">UKAGUZI WA WAUZAJI</span><h2>Maombi ya wauzaji</h2></div><span className="admin-count">{sellerRows.length} yanasubiri</span></div>
            {sellerRows.length === 0 ? <div className="admin-empty">Hakuna ombi la muuzaji linalosubiri kwa sasa.</div> : <div className="admin-review-list">{sellerRows.map(application => { const profile = profileMap.get(application.user_id); return <article className="admin-review-card" key={application.id}>
              <div className="admin-review-top"><div><h3>{application.store_name}</h3><p>{profile?.full_name || "Jina halipo"} · {profile?.email || "Email haipo"}</p><p>{application.phone_number}{profile?.phone ? " · " + profile.phone : ""}</p>{application.bio && <p className="admin-description">{application.bio}</p>}<small>Ametuma: {new Date(application.created_at).toLocaleDateString("sw-TZ")}</small></div><span className="admin-pending">Inasubiri</span></div>
              <form action={reviewSeller} className="admin-review-form"><input type="hidden" name="application_id" value={application.id}/><input type="hidden" name="user_id" value={application.user_id}/><input name="review_note" placeholder="Maoni (hiari)" aria-label="Maoni ya ukaguzi"/><button className="btn" name="decision" value="approved">Idhinisha</button><button className="btn btn-danger" name="decision" value="rejected">Kataa</button></form>
            </article>; })}</div>}
          </section>

          <section className="admin-panel" id="book-review">
            <div className="admin-panel-heading"><div><span className="admin-gold-kicker">UKAGUZI WA MAUDHUI</span><h2>Vitabu vinavyosubiri</h2></div><span className="admin-count">{bookRows.length} vinasubiri</span></div>
            {bookRows.length === 0 ? <div className="admin-empty">Hakuna kitabu kinachosubiri ukaguzi kwa sasa.</div> : <div className="admin-review-list">{bookRows.map(book => { const profile = profileMap.get(book.seller_id); return <article className="admin-review-card" key={book.id}>
              <div className="admin-review-top"><div><h3>{book.title}</h3><p>{book.author_name || "Mwandishi hajatajwa"} · {book.format.toUpperCase()} · {book.language.toUpperCase()}</p><p>Muuzaji: {profile?.full_name || profile?.email || book.seller_id}</p><p className="price">TSh {money(book.price_tzs)}</p>{book.description && <p className="admin-description">{book.description}</p>}<div className="admin-file-links">{bookLinks.get(book.id)?.coverUrl && <a href={bookLinks.get(book.id)?.coverUrl ?? "#"} target="_blank" rel="noreferrer">Fungua jalada</a>}{bookLinks.get(book.id)?.fileUrl && <a href={bookLinks.get(book.id)?.fileUrl ?? "#"} target="_blank" rel="noreferrer">Kagua faili la kitabu</a>}{!book.file_path && <span>Faili halijapakiwa</span>}</div><small>Ametuma: {new Date(book.created_at).toLocaleDateString("sw-TZ")}</small></div><span className="admin-pending">Inasubiri</span></div>
              <form action={reviewBook} className="admin-review-form"><input type="hidden" name="book_id" value={book.id}/><input name="rejection_note" placeholder="Sababu ya kukataa (hiari)" aria-label="Sababu ya kukataa"/><button className="btn" name="decision" value="approved">Idhinisha kitabu</button><button className="btn btn-danger" name="decision" value="rejected">Kataa</button></form>
            </article>; })}</div>}
          </section>
        </div>
        <aside className="admin-right-column">
          <section className="admin-quick-panel"><h3>Hatua za haraka</h3><a href="#seller-review">Kagua maombi ya wauzaji <span>→</span></a><a href="#book-review">Kagua vitabu vipya <span>→</span></a><Link href="/">Tazama tovuti ya umma <span>↗</span></Link></section>
          <section className="admin-quick-panel admin-note-panel"><span className="admin-gold-kicker">USALAMA WA MAUDHUI</span><h3>Kabla ya kuidhinisha</h3><p>Hakiki taarifa za muuzaji, jalada, faili la kitabu na maelezo yake. Vitabu vilivyoidhinishwa ndivyo vinavyoonekana kwa wanunuzi.</p></section>
          <section className="admin-quick-panel"><h3>Muhtasari wa foleni</h3><div className="admin-queue-row"><span>Wauzaji</span><strong>{sellerRows.length}</strong></div><div className="admin-queue-row"><span>Vitabu</span><strong>{bookRows.length}</strong></div><div className="admin-queue-total"><span>Jumla inayosubiri</span><strong>{sellerRows.length + bookRows.length}</strong></div></section>
        </aside>
      </div>
      <footer className="admin-console-footer">MaarifaBooks · Sehemu ya Lumbwa Digital</footer>
    </section>
  </main>;
}
