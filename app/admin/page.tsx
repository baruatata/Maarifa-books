import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reviewBook, reviewSeller, removeBookFromLibrary } from "@/app/admin/actions";
import { signOut } from "@/app/auth/actions";

type SellerApplication = { id: string; user_id: string; store_name: string; bio: string | null; phone_number: string; status: string; created_at: string };
type Book = { id: string; seller_id: string; title: string; author_name: string | null; description: string | null; format: string; language: string; price_tzs: number; status: string; created_at: string; file_path: string | null; cover_path: string | null };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: me } = await supabase.from("profiles").select("role,full_name").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard?error=Huna+ruhusa+ya+admin");

  const [{ data: applications }, { data: books }, { data: allBooks }, { count: sellerCount }, { count: bookCount }, { count: memberCount }] = await Promise.all([
    supabase.from("seller_applications").select("id,user_id,store_name,bio,phone_number,status,created_at").eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("books").select("id,seller_id,title,author_name,description,format,language,price_tzs,status,created_at,file_path,cover_path").eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("books").select("id,seller_id,title,author_name,description,format,language,price_tzs,status,created_at,file_path,cover_path").order("created_at", { ascending: false }),
    supabase.from("seller_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);
  const sellerRows = (applications ?? []) as SellerApplication[];
  const bookRows = (books ?? []) as Book[];
  const libraryRows = (allBooks ?? []) as Book[];
  const profileIds = [...new Set([...sellerRows.map(row => row.user_id), ...libraryRows.map(row => row.seller_id)])];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id,full_name,email,phone").in("id", profileIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null; phone: string | null }[] };
  const profileMap = new Map((profiles ?? []).map(profile => [profile.id, profile]));
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
      <a className="admin-side-link active" href="#overview"><span>⌂</span> Dashboard</a>
      <a className="admin-side-link" href="#seller-review"><span>♙</span> Maombi ya wauzaji <b>{sellerRows.length}</b></a>
      <a className="admin-side-link" href="#book-review"><span>▤</span> Vitabu vya kukagua <b>{bookRows.length}</b></a>
      <a className="admin-side-link" href="#book-library"><span>▣</span> Maktaba ya vitabu <b>{libraryRows.length}</b></a>
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
              <div className="admin-review-top"><div><h3>{book.title}</h3><p>{book.author_name || "Mwandishi hajatajwa"} · {book.format.toUpperCase()} · {book.language.toUpperCase()}</p><p>Muuzaji: {profile?.full_name || profile?.email || book.seller_id}</p><p className="price">BURE</p>{book.description && <p className="admin-description">{book.description}</p>}<div className="admin-file-links">{bookLinks.get(book.id)?.coverUrl && <a href={bookLinks.get(book.id)?.coverUrl ?? "#"} target="_blank" rel="noreferrer">Fungua jalada</a>}{bookLinks.get(book.id)?.fileUrl && <a href={bookLinks.get(book.id)?.fileUrl ?? "#"} target="_blank" rel="noreferrer">Kagua faili la kitabu</a>}{!book.file_path && <span>Faili halijapakiwa</span>}</div><small>Ametuma: {new Date(book.created_at).toLocaleDateString("sw-TZ")}</small></div><span className="admin-pending">Inasubiri</span></div>
              <form action={reviewBook} className="admin-review-form"><input type="hidden" name="book_id" value={book.id}/><input name="rejection_note" placeholder="Sababu ya kukataa (hiari)" aria-label="Sababu ya kukataa"/><button className="btn" name="decision" value="approved">Idhinisha kitabu</button><button className="btn btn-danger" name="decision" value="rejected">Kataa</button></form>
            </article>; })}</div>}
          </section>

          <section className="admin-panel" id="book-library">
            <div className="admin-panel-heading"><div><span className="admin-gold-kicker">MAKTABA NZIMA</span><h2>Maktaba ya vitabu</h2></div><span className="admin-count">{libraryRows.length} vitabu</span></div>
            {libraryRows.length === 0 ? <div className="admin-empty">Bado hakuna vitabu kwenye maktaba.</div> : <div className="admin-review-list">{libraryRows.map(book => { const profile = profileMap.get(book.seller_id); return <article className="admin-review-card" key={book.id}>
              <div className="admin-review-top"><div><h3>{book.title}</h3><p>{book.author_name || "Mwandishi hajatajwa"} · {book.format.toUpperCase()} · {book.language.toUpperCase()}</p><p>Muuzaji: {profile?.full_name || profile?.email || book.seller_id}</p><p className="admin-description">Hali: {book.status === "approved" ? "Kimeidhinishwa" : book.status === "pending" ? "Kinasubiri" : book.status === "rejected" ? "Kimekataliwa" : book.status === "archived" ? "Kimeondolewa maktabani" : book.status}</p><div className="admin-file-links">{bookLinks.get(book.id)?.coverUrl && <a href={bookLinks.get(book.id)?.coverUrl ?? "#"} target="_blank" rel="noreferrer">Fungua jalada</a>}{bookLinks.get(book.id)?.fileUrl && <a href={bookLinks.get(book.id)?.fileUrl ?? "#"} target="_blank" rel="noreferrer">Fungua faili</a>}</div></div></div>
              <form action={removeBookFromLibrary} className="admin-review-form"><input type="hidden" name="book_id" value={book.id}/><button className="btn btn-danger" type="submit">Ondoa kwenye maktaba</button></form>
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
