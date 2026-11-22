import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reviewBook, reviewSeller, removeBookFromLibrary, promoteMaarifabooksAdmin } from "@/app/admin/actions";
import { signOut } from "@/app/auth/actions";

type MemberProfile = { id: string; full_name: string | null; email: string | null; phone: string | null; role: string; created_at: string };
type SellerApplication = { id: string; user_id: string; store_name: string; bio: string | null; phone_number: string; status: string; created_at: string };
type Book = { id: string; seller_id: string; title: string; author_name: string | null; description: string | null; format: string; language: string; price_tzs: number; status: string; created_at: string; file_path: string | null; cover_path: string | null };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string; tab?: string }> }) {
  const params = await searchParams;
  const tab = ["overview", "buyers", "members", "sellers", "books", "library"].includes(params.tab ?? "") ? (params.tab ?? "overview") : "overview";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: me } = await supabase.from("profiles").select("role,full_name").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard?error=Huna+ruhusa+ya+admin");

  const [{ data: applications }, { data: books }, { data: allBooks }, { count: sellerCount }, { count: bookCount }, { count: memberCount }, { data: members }, { data: allCouponRequests }, { data: redeemedCodes }, { data: paidOrders }, { data: confirmedPayments }] = await Promise.all([
    supabase.from("seller_applications").select("id,user_id,store_name,bio,phone_number,status,created_at").eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("books").select("id,seller_id,title,author_name,description,format,language,price_tzs,status,created_at,file_path,cover_path").eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("books").select("id,seller_id,title,author_name,description,format,language,price_tzs,status,created_at,file_path,cover_path").order("created_at", { ascending: false }),
    supabase.from("seller_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).neq("role", "buyer"),
    supabase.from("profiles").select("id,full_name,email,phone,role,created_at").neq("role", "buyer").order("created_at", { ascending: false }).limit(500),
    supabase.from("book_coupon_requests").select("id,customer_user_id,customer_name,customer_phone,book_id,created_at,payment_status").order("created_at", { ascending: false }).limit(2000),
    supabase.from("book_access_codes").select("id,book_id,redeemed_by,redeemed_at,request_id").not("redeemed_at", "is", null).order("redeemed_at", { ascending: false }).limit(2000),
    supabase.from("orders").select("id,buyer_id,paid_at,created_at,order_items(book_id,books(title))").eq("status", "paid").order("paid_at", { ascending: false }).limit(1000),
    supabase.from("payment_submissions").select("order_id,payer_phone").eq("status", "confirmed").limit(1000),
  ]);
  const sellerRows = (applications ?? []) as SellerApplication[];
  const memberRows = (members ?? []) as MemberProfile[];
  const bookRows = (books ?? []) as Book[];
  const libraryRows = (allBooks ?? []) as Book[];
  const buyerRequestRows = (allCouponRequests ?? []) as Array<{ id: string; customer_user_id: string | null; customer_name: string | null; customer_phone: string; book_id: string; created_at: string; payment_status: string }>;
  const redeemedCodeRows = (redeemedCodes ?? []) as Array<{ id: string; book_id: string; redeemed_by: string | null; redeemed_at: string; request_id: string | null }>;
  const paidOrderRows = (paidOrders ?? []) as unknown as Array<{ id: string; buyer_id: string; paid_at: string | null; created_at: string; order_items: Array<{ book_id: string; books: { title: string } | { title: string }[] | null }> }>;
  const confirmedPaymentRows = (confirmedPayments ?? []) as Array<{ order_id: string; payer_phone: string | null }>;
  const profileIds = [...new Set([...sellerRows.map(row => row.user_id), ...libraryRows.map(row => row.seller_id), ...buyerRequestRows.map(row => row.customer_user_id).filter((id): id is string => Boolean(id)), ...redeemedCodeRows.map(row => row.redeemed_by).filter((id): id is string => Boolean(id)), ...paidOrderRows.map(row => row.buyer_id)])];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id,full_name,email,phone").in("id", profileIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null; phone: string | null }[] };
  const profileMap = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  const buyerMap = new Map<string, { name: string; phone: string; books: Set<string>; lastPurchase: string }>();
  const addBuyerPurchase = (key: string, name: string, phone: string, bookTitle: string, date: string) => {
    const existing = buyerMap.get(key) ?? { name: name || "Jina halijawekwa", phone: phone || "Haijawekwa", books: new Set<string>(), lastPurchase: date };
    if (name && existing.name === "Jina halijawekwa") existing.name = name;
    if (phone && existing.phone === "Haijawekwa") existing.phone = phone;
    if (bookTitle) existing.books.add(bookTitle);
    if (date > existing.lastPurchase) existing.lastPurchase = date;
    buyerMap.set(key, existing);
  };
  const requestById = new Map(buyerRequestRows.map(request => [request.id, request]));
  for (const request of buyerRequestRows) {
    if (request.payment_status !== "received") continue;
    const profile = request.customer_user_id ? profileMap.get(request.customer_user_id) : null;
    const phone = profile?.phone || request.customer_phone;
    const key = request.customer_user_id || phone;
    const book = libraryRows.find(row => row.id === request.book_id);
    if (key) addBuyerPurchase(key, profile?.full_name || request.customer_name || "", phone, book?.title || "Kitabu kilicholipiwa", request.created_at);
  }
  for (const code of redeemedCodeRows) {
    const request = code.request_id ? requestById.get(code.request_id) : null;
    const profileId = request?.customer_user_id || code.redeemed_by;
    const profile = profileId ? profileMap.get(profileId) : null;
    const phone = profile?.phone || request?.customer_phone || "";
    const key = request?.customer_user_id || code.redeemed_by || phone;
    const book = libraryRows.find(row => row.id === code.book_id);
    if (key) addBuyerPurchase(key, profile?.full_name || request?.customer_name || "", phone, book?.title || "Kitabu kilichofunguliwa kwa coupon", code.redeemed_at);
  }
  const paymentPhoneByOrder = new Map(confirmedPaymentRows.map(payment => [payment.order_id, payment.payer_phone || ""]));
  for (const order of paidOrderRows) {
    const profile = profileMap.get(order.buyer_id);
    const phone = profile?.phone || paymentPhoneByOrder.get(order.id) || "";
    const key = order.buyer_id || phone;
    const date = order.paid_at || order.created_at;
    for (const item of order.order_items ?? []) {
      const nestedBook = Array.isArray(item.books) ? item.books[0] : item.books;
      if (key) addBuyerPurchase(key, profile?.full_name || "", phone, nestedBook?.title || "Kitabu kilicholipiwa", date);
    }
  }
  const buyerRows = [...buyerMap.entries()].map(([id, buyer]) => ({ id, ...buyer })).sort((a, b) => b.lastPurchase.localeCompare(a.lastPurchase));
  const money = (amount: number) => new Intl.NumberFormat("sw-TZ").format(amount);
  const bookLinks = new Map(await Promise.all(libraryRows.map(async book => {
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
      <Link className={`admin-side-link ${tab === "overview" ? "active" : ""}`} href="/admin?tab=overview"><span>⌂</span> Dashboard</Link>
      <Link className={`admin-side-link ${tab === "sellers" ? "active" : ""}`} href="/admin?tab=sellers"><span>♙</span> Maombi ya wauzaji <b>{sellerRows.length}</b></Link>
      <Link className={`admin-side-link ${tab === "books" ? "active" : ""}`} href="/admin?tab=books"><span>▤</span> Vitabu vya kukagua <b>{bookRows.length}</b></Link>
      <Link className={`admin-side-link ${tab === "library" ? "active" : ""}`} href="/admin?tab=library"><span>▣</span> Maktaba ya vitabu <b>{libraryRows.length}</b></Link>
      <Link className={`admin-side-link ${tab === "buyers" ? "active" : ""}`} href="/admin?tab=buyers"><span>♙</span> Wanunuzi <b>{buyerRows.length}</b></Link>
      <Link className={`admin-side-link ${tab === "members" ? "active" : ""}`} href="/admin?tab=members"><span>♧</span> Wanachama</Link>
      <Link className="admin-side-link" href="/admin/malalamiko"><span>⚑</span> Malalamiko ya wateja <b>↗</b></Link>
      <Link className="admin-side-link" href="/admin/mawasiliano"><span>✉</span> Mawasiliano <b>↗</b></Link>
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
      {tab === "overview" && <><section className="admin-welcome">
        <div><p className="admin-gold-kicker">KARIBU TENA</p><h2>{me.full_name || user.email}</h2><p>Dhibiti maombi ya wauzaji na pitia vitabu kabla havijaonekana kwenye maktaba ya MaarifaBooks.</p></div>
        <div className="admin-welcome-mark">MB</div>
      </section>

      <section className="admin-metric-grid" id="members">
        <article className="admin-metric"><span className="metric-icon">♙</span><p>Jumla ya wanachama</p><strong>{memberCount ?? 0}</strong><small>Wauzaji na wasimamizi</small></article>
        <article className="admin-metric"><span className="metric-icon">♧</span><p>Maombi ya wauzaji</p><strong>{sellerCount ?? 0}</strong><small>Yanasubiri uamuzi</small></article>
        <article className="admin-metric"><span className="metric-icon">▤</span><p>Vitabu vya kukagua</p><strong>{bookCount ?? 0}</strong><small>Vinasubiri idhini</small></article>
      </section></>}

      {tab !== "overview" && <header className="admin-toolbar" style={{ marginTop: 8 }}><div><span className="admin-toolbar-kicker">USIMAMIZI / MAARIFABOOKS</span><h1>{tab === "buyers" ? "Wanunuzi wa vitabu" : tab === "members" ? "Wanachama (wauzaji na wasimamizi)" : tab === "sellers" ? "Maombi ya wauzaji" : tab === "books" ? "Vitabu vya kukagua" : "Maktaba ya vitabu"}</h1></div></header>}
      <div className="admin-content-grid">
        <div className="admin-main-column">
          {tab === "members" && <section className="admin-panel" id="all-members">
            <div className="admin-panel-heading"><div><span className="admin-gold-kicker">USIMAMIZI WA AKAUNTI</span><h2>Wanachama wote</h2></div><span className="admin-count">{memberRows.length} akaunti</span></div>
            <p className="admin-description">Orodha hii ina akaunti za wauzaji na wasimamizi pekee. Wanunuzi wana taarifa zao kwenye sehemu maalumu ya Wanunuzi.</p>
            {memberRows.length === 0 ? <div className="admin-empty">Bado hakuna akaunti zilizosajiliwa.</div> : <div className="admin-review-list">{memberRows.map(member => <article className="admin-review-card" key={member.id}>
              <div className="admin-review-top"><div><h3>{member.full_name || "Jina halijawekwa"}</h3><p><strong>Email:</strong> {member.email || "Email haipo kwenye wasifu"}</p><p><strong>Simu:</strong> {member.phone || "Haijawekwa"}</p><small>Alijiunga: {new Date(member.created_at).toLocaleDateString("sw-TZ")}</small></div><span className={member.role === "admin" ? "admin-pending" : "admin-count"}>{member.role === "admin" ? "Admin" : member.role === "seller" ? "Seller" : "Buyer"}</span></div>{member.email?.toLowerCase() === "maarifabooks55@gmail.com" && member.role !== "admin" && <form action={promoteMaarifabooksAdmin} className="admin-review-form"><input type="hidden" name="user_id" value={member.id}/><button className="btn" type="submit">Muweke Admin</button></form>}
            </article>)}</div>}
          </section>}
          {tab === "buyers" && <section className="admin-panel" id="buyer-list">
            <div className="admin-panel-heading"><div><span className="admin-gold-kicker">TAARIFA ZA WATEJA</span><h2>Wanunuzi waliothibitisha malipo</h2></div><span className="admin-count">{buyerRows.length} wanunuzi</span></div>
            <p className="admin-description">Sehemu hii inaonekana kwa Admin pekee. Inaonyesha wateja ambao malipo yao yamethibitishwa na muuzaji au oda zao zimewekwa kuwa zimelipwa. Maombi ambayo bado hayajathibitishwa hayahesabiwi kama ununuzi.</p>
            {buyerRows.length === 0 ? <div className="admin-empty">Bado hakuna mteja aliyethibitishwa kununua kitabu.</div> : <div className="admin-review-list">{buyerRows.map(buyer => <article className="admin-review-card" key={buyer.id}>
              <div className="admin-review-top"><div><h3>{buyer.name}</h3><p><strong>Namba ya simu:</strong> {buyer.phone}</p><p><strong>Vitabu alivyonunua:</strong> {[...buyer.books].join(", ") || "Haijatajwa"}</p><small>Ununuzi wa mwisho: {new Date(buyer.lastPurchase).toLocaleString("sw-TZ")}</small></div><span className="admin-count">{buyer.books.size} vitabu</span></div>
            </article>)}</div>}
          </section>}
          {tab === "sellers" && <section className="admin-panel" id="seller-review">
            <div className="admin-panel-heading"><div><span className="admin-gold-kicker">UKAGUZI WA WAUZAJI</span><h2>Maombi ya wauzaji</h2></div><span className="admin-count">{sellerRows.length} yanasubiri</span></div>
            {sellerRows.length === 0 ? <div className="admin-empty">Hakuna ombi la muuzaji linalosubiri kwa sasa.</div> : <div className="admin-review-list">{sellerRows.map(application => { const profile = profileMap.get(application.user_id); return <article className="admin-review-card" key={application.id}>
              <div className="admin-review-top"><div><h3>{application.store_name}</h3><p>{profile?.full_name || "Jina halipo"} · {profile?.email || "Email haipo"}</p><p>WhatsApp ya kupokea oda: {application.phone_number}{profile?.phone ? " · Simu ya akaunti: " + profile.phone : ""}</p>{application.bio && <p className="admin-description">{application.bio}</p>}<small>Ametuma: {new Date(application.created_at).toLocaleDateString("sw-TZ")}</small></div><span className="admin-pending">Inasubiri</span></div>
              <form action={reviewSeller} className="admin-review-form"><input type="hidden" name="application_id" value={application.id}/><input type="hidden" name="user_id" value={application.user_id}/><input name="review_note" placeholder="Maoni (hiari)" aria-label="Maoni ya ukaguzi"/><button className="btn" name="decision" value="approved">Idhinisha</button><button className="btn btn-danger" name="decision" value="rejected">Kataa</button></form>
            </article>; })}</div>}
          </section>}

          {tab === "books" && <section className="admin-panel" id="book-review">
            <div className="admin-panel-heading"><div><span className="admin-gold-kicker">UKAGUZI WA MAUDHUI</span><h2>Vitabu vinavyosubiri</h2></div><span className="admin-count">{bookRows.length} vinasubiri</span></div>
            {bookRows.length === 0 ? <div className="admin-empty">Hakuna kitabu kinachosubiri ukaguzi kwa sasa.</div> : <div className="admin-review-list">{bookRows.map(book => { const profile = profileMap.get(book.seller_id); return <article className="admin-review-card" key={book.id}>
              <div className="admin-review-top"><div><h3>{book.title}</h3><p>{book.author_name || "Mwandishi hajatajwa"} · {book.format.toUpperCase()} · {book.language.toUpperCase()}</p><p>Muuzaji: {profile?.full_name || profile?.email || book.seller_id}</p><p className="price">{book.price_tzs > 0 ? "TSh " + money(book.price_tzs) : "BURE"}</p>{book.description && <p className="admin-description">{book.description}</p>}<div className="admin-file-links">{bookLinks.get(book.id)?.coverUrl && <a href={bookLinks.get(book.id)?.coverUrl ?? "#"} target="_blank" rel="noreferrer">Fungua jalada</a>}{bookLinks.get(book.id)?.fileUrl && <a href={bookLinks.get(book.id)?.fileUrl ?? "#"} target="_blank" rel="noreferrer">Kagua faili la kitabu</a>}{!book.file_path && <span>Faili halijapakiwa</span>}</div><small>Ametuma: {new Date(book.created_at).toLocaleDateString("sw-TZ")}</small></div><span className="admin-pending">Inasubiri</span></div>
              <form action={reviewBook} className="admin-review-form"><input type="hidden" name="book_id" value={book.id}/><input name="rejection_note" placeholder="Sababu ya kukataa (hiari)" aria-label="Sababu ya kukataa"/><button className="btn" name="decision" value="approved">Idhinisha kitabu</button><button className="btn btn-danger" name="decision" value="rejected">Kataa</button></form>
            </article>; })}</div>}
          </section>}

          {tab === "library" && <section className="admin-panel" id="book-library">
            <div className="admin-panel-heading"><div><span className="admin-gold-kicker">MAKTABA NZIMA</span><h2>Maktaba ya vitabu</h2></div><span className="admin-count">{libraryRows.length} vitabu</span></div>
            {libraryRows.length === 0 ? <div className="admin-empty">Bado hakuna vitabu kwenye maktaba.</div> : <div className="admin-review-list">{libraryRows.map(book => { const profile = profileMap.get(book.seller_id); return <article className="admin-review-card" key={book.id}>
              <div className="admin-review-top"><div><h3>{book.title}</h3><p>{book.author_name || "Mwandishi hajatajwa"} · {book.format.toUpperCase()} · {book.language.toUpperCase()}</p><p>Muuzaji: {profile?.full_name || profile?.email || book.seller_id}</p><p className="admin-description">Bei: {book.price_tzs > 0 ? "TSh " + money(book.price_tzs) : "BURE"} · Hali: {book.status === "approved" ? "Kimeidhinishwa" : book.status === "pending" ? "Kinasubiri" : book.status === "rejected" ? "Kimekataliwa" : book.status === "archived" ? "Kimeondolewa maktabani" : book.status}</p><div className="admin-file-links">{bookLinks.get(book.id)?.coverUrl && <a href={bookLinks.get(book.id)?.coverUrl ?? "#"} target="_blank" rel="noreferrer">Fungua jalada</a>}{bookLinks.get(book.id)?.fileUrl && <a href={bookLinks.get(book.id)?.fileUrl ?? "#"} target="_blank" rel="noreferrer">Fungua faili</a>}</div></div></div>
              <form action={removeBookFromLibrary} className="admin-review-form"><input type="hidden" name="book_id" value={book.id}/><button className="btn btn-danger" type="submit">Ondoa kwenye maktaba</button></form>
            </article>; })}</div>}
          </section>}
        </div>
        {tab === "overview" && <aside className="admin-right-column">
          <section className="admin-quick-panel"><h3>Hatua za haraka</h3><a href="#seller-review">Kagua maombi ya wauzaji <span>→</span></a><a href="#book-review">Kagua vitabu vipya <span>→</span></a><Link href="/">Tazama tovuti ya umma <span>↗</span></Link></section>
          <section className="admin-quick-panel admin-note-panel"><span className="admin-gold-kicker">USALAMA WA MAUDHUI</span><h3>Kabla ya kuidhinisha</h3><p>Hakiki taarifa za muuzaji, jalada, faili la kitabu na maelezo yake. Vitabu vilivyoidhinishwa ndivyo vinavyoonekana kwa wanunuzi.</p></section>
          <section className="admin-quick-panel"><h3>Muhtasari wa foleni</h3><div className="admin-queue-row"><span>Wauzaji</span><strong>{sellerRows.length}</strong></div><div className="admin-queue-row"><span>Vitabu</span><strong>{bookRows.length}</strong></div><div className="admin-queue-total"><span>Jumla inayosubiri</span><strong>{sellerRows.length + bookRows.length}</strong></div></section>
        </aside>}
      </div>
      <footer className="admin-console-footer">MaarifaBooks · Sehemu ya Lumbwa Digital</footer>
    </section>
  </main>;
}
