import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reviewBook, reviewSeller } from "@/app/admin/actions";

type SellerApplication = { id: string; user_id: string; store_name: string; bio: string | null; phone_number: string; status: string; created_at: string };
type Book = { id: string; seller_id: string; title: string; author_name: string | null; description: string | null; format: string; language: string; price_tzs: number; status: string; created_at: string };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: me } = await supabase.from("profiles").select("role,full_name").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard?error=Huna+ruhusa+ya+admin");

  const [{ data: applications }, { data: books }, { count: sellerCount }, { count: bookCount }, { count: memberCount }] = await Promise.all([
    supabase.from("seller_applications").select("id,user_id,store_name,bio,phone_number,status,created_at").eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("books").select("id,seller_id,title,author_name,description,format,language,price_tzs,status,created_at").eq("status", "pending").order("created_at", { ascending: true }),
    supabase.from("seller_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const sellerRows = (applications ?? []) as SellerApplication[];
  const bookRows = (books ?? []) as Book[];
  const profileIds = [...new Set([...sellerRows.map(row => row.user_id), ...bookRows.map(row => row.seller_id)])];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id,full_name,email,phone").in("id", profileIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null; phone: string | null }[] };
  const profileMap = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  const money = (amount: number) => new Intl.NumberFormat("sw-TZ").format(amount);

  return <main className="page admin-page">
    <div className="admin-top"><div><p className="eyebrow">LUMBWA DIGITAL · MAARIFABOOKS</p><h1>Admin Dashboard</h1><p className="muted">Karibu {me.full_name || user.email}. Dhibiti maombi ya wauzaji na vitabu kabla havijaonekana hadharani.</p></div><span className="admin-tag">ADMIN</span></div>
    {params.error && <p className="message">{params.error}</p>}{params.success && <p className="notice">{params.success}</p>}
    <section className="admin-stats">
      <article className="admin-stat"><span>Wanachama</span><strong>{memberCount ?? 0}</strong></article>
      <article className="admin-stat"><span>Maombi ya wauzaji</span><strong>{sellerCount ?? 0}</strong><small>Yanasubiri uamuzi</small></article>
      <article className="admin-stat"><span>Vitabu</span><strong>{bookCount ?? 0}</strong><small>Vinasubiri ukaguzi</small></article>
    </section>

    <section className="admin-section"><div className="admin-heading"><div><p className="eyebrow">UKAGUZI WA WAUZAJI</p><h2>Maombi ya wauzaji</h2></div><span className="status">{sellerRows.length} yanasubiri</span></div>
      {sellerRows.length === 0 ? <div className="empty">Hakuna ombi la muuzaji linalosubiri kwa sasa.</div> : <div className="admin-list">{sellerRows.map(application => { const profile = profileMap.get(application.user_id); return <article className="admin-card" key={application.id}>
        <div className="admin-card-main"><div><h3>{application.store_name}</h3><p>{profile?.full_name || "Jina halipo"} · {profile?.email || "Email haipo"}</p><p>{application.phone_number}{profile?.phone ? " · " + profile.phone : ""}</p>{application.bio && <p className="admin-description">{application.bio}</p>}<small className="muted">Ametuma: {new Date(application.created_at).toLocaleDateString("sw-TZ")}</small></div><span className="status">Inasubiri</span></div>
        <form action={reviewSeller} className="admin-review-form"><input type="hidden" name="application_id" value={application.id}/><input type="hidden" name="user_id" value={application.user_id}/><input name="review_note" placeholder="Maoni (hiari)" aria-label="Maoni ya ukaguzi"/><button className="btn" name="decision" value="approved">Idhinisha muuzaji</button><button className="btn btn-danger" name="decision" value="rejected">Kataa</button></form>
      </article>; })}</div>}
    </section>

    <section className="admin-section"><div className="admin-heading"><div><p className="eyebrow">UKAGUZI WA MAUDHUI</p><h2>Vitabu vinavyosubiri</h2></div><span className="status">{bookRows.length} vinasubiri</span></div>
      {bookRows.length === 0 ? <div className="empty">Hakuna kitabu kinachosubiri ukaguzi kwa sasa.</div> : <div className="admin-list">{bookRows.map(book => { const profile = profileMap.get(book.seller_id); return <article className="admin-card" key={book.id}>
        <div className="admin-card-main"><div><h3>{book.title}</h3><p>{book.author_name || "Mwandishi hajatajwa"} · {book.format.toUpperCase()} · {book.language.toUpperCase()}</p><p>Muuzaji: {profile?.full_name || profile?.email || book.seller_id}</p><p className="price">TSh {money(book.price_tzs)}</p>{book.description && <p className="admin-description">{book.description}</p>}<small className="muted">Ametuma: {new Date(book.created_at).toLocaleDateString("sw-TZ")}</small></div><span className="status">Inasubiri</span></div>
        <form action={reviewBook} className="admin-review-form"><input type="hidden" name="book_id" value={book.id}/><input name="rejection_note" placeholder="Sababu ya kukataa (hiari)" aria-label="Sababu ya kukataa"/><button className="btn" name="decision" value="approved">Idhinisha kitabu</button><button className="btn btn-danger" name="decision" value="rejected">Kataa</button></form>
      </article>; })}</div>}
    </section>
    <p className="admin-footnote">Maamuzi haya yanahifadhiwa kwenye Supabase. Hakikisha faili na maelezo ya kitabu yamekaguliwa kabla ya kukiidhinisha.</p>
  </main>;
}
