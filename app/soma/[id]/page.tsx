import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia?next=" + encodeURIComponent("/soma/" + id));

  const { data: book } = await supabase.from("books")
    .select("id,title,author_name,format,file_path,status")
    .eq("id", id).eq("status", "approved").maybeSingle();
  if (!book || !book.file_path) redirect("/dashboard/vitabu?error=" + encodeURIComponent("Kitabu hakijapatikana."));

  const { data: items } = await supabase.from("order_items")
    .select("order_id").eq("book_id", id);
  const orderIds = [...new Set((items ?? []).map(item => item.order_id))];
  if (!orderIds.length) redirect("/dashboard/vitabu?error=" + encodeURIComponent("Huna ununuzi wa kitabu hiki."));
  const { data: paidOrders } = await supabase.from("orders")
    .select("id").in("id", orderIds).eq("buyer_id", user.id).eq("status", "paid").limit(1);
  if (!paidOrders?.length) redirect("/dashboard/vitabu?error=" + encodeURIComponent("Lipa kitabu kwanza ili uweze kukisoma."));

  const { data: signed, error } = await supabase.storage.from("book-files").createSignedUrl(book.file_path, 300);
  if (error || !signed?.signedUrl) {
    return <main className="page"><h1>Kitabu hakijafunguka</h1><p className="muted">Jaribu tena baada ya muda mfupi.</p><Link className="btn" href="/dashboard/vitabu">Rudi kwenye vitabu vyangu</Link></main>;
  }

  return <main className="page online-reader">
    <nav className="reader-nav"><Link href="/dashboard/vitabu">← Vitabu nilivyonunua</Link><Link href="/">MaarifaBooks</Link></nav>
    <header className="reader-heading"><p className="eyebrow">MSOMAJI WA MAARIFABOOKS</p><h1>{book.title}</h1><p className="muted">{book.author_name || "Mwandishi hajatajwa"}</p><span className="reader-access-note">Unasoma kitabu ulichokinunua</span></header>
    {book.format === "pdf" ? (
      <section className="reader-frame-wrap">
        <iframe className="reader-pdf-frame" src={signed.signedUrl + "#toolbar=0&navpanes=0&scrollbar=1"} title={"Kitabu " + book.title} />
        <div className="reader-watermark" aria-hidden="true">MaarifaBooks · {user.email || "Msomaji"}</div>
      </section>
    ) : book.format === "audiobook" ? (
      <section className="reader-audio panel"><p>Sikiliza kitabu chako hapa.</p><audio controls preload="metadata" src={signed.signedUrl}>Kivinjari chako hakitumii kicheza sauti.</audio></section>
    ) : (
      <section className="panel reader-unavailable"><h2>EPUB reader inaandaliwa</h2><p>Ununuzi wako umethibitishwa. Kisomaji cha EPUB kitaongezwa katika hatua inayofuata; kwa sasa mfumo huu unaonyesha PDF na Audiobook.</p></section>
    )}
    <p className="reader-footnote">Kiungo cha kusoma ni cha muda mfupi na hakiwekwi wazi kwenye maktaba ya umma.</p>
  </main>;
}
