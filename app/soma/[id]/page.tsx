import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PdfFlipbook from "@/components/pdf-flipbook";

export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: book, error: bookError } = await supabase.from("books")
    .select("id,title,author_name,format,file_path,preview_path,price_tzs,status")
    .eq("id", id).eq("status", "approved").maybeSingle();
  if (bookError || !book || !book.file_path) redirect("/?error=" + encodeURIComponent("Kitabu hakijapatikana au bado hakijaidhinishwa."));

  let hasPurchasedAccess = book.price_tzs === 0;
  if (book.price_tzs > 0 && user) {
    const { data: entitlement } = await supabase.from("book_entitlements").select("id")
      .eq("book_id", book.id).eq("buyer_id", user.id).maybeSingle();
    hasPurchasedAccess = Boolean(entitlement);
  }
  const isFreePreview = book.price_tzs > 0 && !hasPurchasedAccess;
  const pathToRead = isFreePreview ? book.preview_path : book.file_path;
  if (!pathToRead) redirect("/kitabu/" + book.id + "?error=" + encodeURIComponent("Sampuli ya bure bado haijawekwa. Wasiliana na muuzaji."));

  const { data: signed, error: fileError } = await supabase.storage.from("book-files").createSignedUrl(pathToRead, 3600);
  if (fileError || !signed?.signedUrl) {
    return <main className="page"><h1>Faili la kitabu halijafunguka</h1><p className="muted">Kitabu kipo kwenye orodha, lakini mfumo umeshindwa kukifungua. Tafadhali jaribu tena baadaye.</p><Link className="btn" href={"/kitabu/" + book.id}>Rudi kwenye taarifa za kitabu</Link></main>;
  }
  return <main className="page online-reader">
    <nav className="reader-nav"><Link href={"/kitabu/" + book.id}>← Rudi kwenye kitabu</Link><Link href="/">MaarifaBooks</Link></nav>
    <header className="reader-heading"><p className="eyebrow">MSOMAJI WA MAARIFABOOKS</p><h1>{book.title}</h1><p className="muted">{book.author_name || "Mwandishi hajatajwa"}</p>
      <span className="reader-access-note">{isFreePreview ? "Unasoma sampuli ya bure" : book.price_tzs > 0 ? "Kitabu kizima kimefunguliwa" : "Unasoma kitabu bure"}</span>
      {isFreePreview && <p className="book-payment-note">Hii ni sampuli ya bure. Ili kuendelea na kitabu kizima, wasiliana na muuzaji na uombe coupon.</p>}
    </header>
    {book.format === "pdf" ? (
      <section className="reader-frame-wrap"><PdfFlipbook url={signed.signedUrl} title={book.title} bookId={book.id} closeHref={"/kitabu/" + book.id} />
        <p className="reader-footnote">Unaweza kusogeza kurasa kwa kidole au mishale. {isFreePreview ? "Soma sampuli hii kisha wasiliana na muuzaji ili kununua kitabu kizima." : <><a href={signed.signedUrl} target="_blank" rel="noreferrer">Fungua PDF yenyewe</a>.</>}</p>
      </section>
    ) : (
      <section className="panel reader-unavailable"><h2>EPUB reader inaandaliwa</h2><p>Kisomaji cha EPUB kinaandaliwa; kwa sasa mfumo huu unaonyesha PDF pekee.</p><a className="btn" href={signed.signedUrl} target="_blank" rel="noreferrer">Fungua EPUB</a></section>
    )}
    {isFreePreview && <div className="book-purchase-panel"><Link className="btn" href={"/kitabu/" + book.id}>Wasiliana na muuzaji / Weka Coupon</Link></div>}
    <p className="reader-footnote">MaarifaBooks inafungua kitabu kizima baada ya coupon halali kutumika mara moja.</p>
  </main>;
}
