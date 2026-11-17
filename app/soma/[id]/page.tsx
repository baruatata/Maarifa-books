import Link from "next/link";
import PdfFlipbook from "@/components/pdf-flipbook";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Approved books are public in free mode; readers do not need an account.
  const { data: book, error: bookError } = await supabase.from("books")
    .select("id,title,author_name,format,file_path,status")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (bookError || !book || !book.file_path) {
    redirect("/?error=" + encodeURIComponent("Kitabu hakijapatikana au bado hakijaidhinishwa."));
  }

  const { data: signed, error: fileError } = await supabase.storage
    .from("book-files")
    .createSignedUrl(book.file_path, 3600);

  if (fileError || !signed?.signedUrl) {
    return <main className="page">
      <h1>Faili la kitabu halijafunguka</h1>
      <p className="muted">Kitabu kipo kwenye orodha, lakini mfumo umeshindwa kukifungua. Tafadhali jaribu tena baadaye.</p>
      <Link className="btn" href={"/kitabu/" + book.id}>Rudi kwenye taarifa za kitabu</Link>
    </main>;
  }

  return <main className="page online-reader">
    <nav className="reader-nav"><Link href={"/kitabu/" + book.id}>← Rudi kwenye kitabu</Link><Link href="/">MaarifaBooks</Link></nav>
    <header className="reader-heading"><p className="eyebrow">MSOMAJI WA MAARIFABOOKS</p><h1>{book.title}</h1><p className="muted">{book.author_name || "Mwandishi hajatajwa"}</p><span className="reader-access-note">Unasoma kitabu bure</span></header>
    {book.format === "pdf" ? (
      <section className="reader-frame-wrap">
        <PdfFlipbook url={signed.signedUrl} title={book.title} closeHref={"/kitabu/" + book.id} bookId={book.id} />
        <p className="reader-footnote">Unaweza kusogeza kurasa kwa kidole au mishale. Ukihitaji, <a href={signed.signedUrl} target="_blank" rel="noreferrer">fungua PDF yenyewe</a>.</p>
      </section>
    ) : (
      <section className="panel reader-unavailable"><h2>EPUB reader inaandaliwa</h2><p>Kisomaji cha EPUB kinaandaliwa; kwa sasa mfumo huu unaonyesha PDF na Audiobook.</p><a className="btn" href={signed.signedUrl} target="_blank" rel="noreferrer">Pakua EPUB</a></section>
    )}
    <p className="reader-footnote">Kitabu hiki kinapatikana bure kupitia MaarifaBooks.</p>
  </main>;
}
