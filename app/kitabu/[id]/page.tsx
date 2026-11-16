import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: book } = await supabase.from("books")
    .select("id,title,author_name,description,language,category,format,price_tzs,cover_path,status")
    .eq("id", id).eq("status", "approved").maybeSingle();
  if (!book) notFound();

  let coverUrl: string | null = null;
  if (book.cover_path) {
    const { data } = await supabase.storage.from("book-files").createSignedUrl(book.cover_path, 300);
    coverUrl = data?.signedUrl ?? null;
  }

  const formatLabel: Record<string, string> = { pdf: "PDF", epub: "EPUB", audiobook: "Audiobook" };
  const languageLabel: Record<string, string> = { sw: "Kiswahili", en: "Kiingereza", other: "Lugha nyingine" };

  return <main className="page book-detail-page">
    <Link href="/" className="book-detail-back">← Rudi kwenye vitabu</Link>
    <section className="book-detail-layout">
      <div className="book-detail-cover">
        {coverUrl ? <img src={coverUrl} alt={"Jalada la " + book.title} /> : <div className="home-book-placeholder"><span>MAARIFABOOKS</span><strong>{book.title}</strong><small>{book.author_name || "Mwandishi"}</small></div>}
      </div>
      <div className="book-detail-info">
        <p className="eyebrow">TAARIFA ZA KITABU</p>
        <h1>{book.title}</h1>
        <p className="book-detail-author">Na {book.author_name || "Mwandishi hajatajwa"}</p>
        <div className="book-detail-tags"><span>{formatLabel[book.format] || book.format}</span><span>{languageLabel[book.language] || book.language}</span>{book.category && <span>{book.category}</span>}</div>
        <h2>Maelezo ya kitabu</h2>
        <p className="book-detail-description">{book.description || "Maelezo ya kitabu hiki hayajawekwa bado."}</p>
        <div className="book-purchase-panel">
          <div><span className="muted">Bei ya kitabu</span><strong>{book.price_tzs === 0 ? "BURE" : "TSh " + Number(book.price_tzs).toLocaleString("en-TZ")}</strong></div>
          {book.price_tzs === 0
            ? <p className="book-payment-note">Kitabu hiki ni bure. Ingia kwenye akaunti ili kuanza kukisoma.</p>
            : <p className="book-payment-note">Malipo ya simu yatawezeshwa baada ya kuunganishwa rasmi kwa huduma ya Selcom. Kwa sasa usitume fedha nje ya mfumo huu.</p>}
          <Link className="btn book-buy-button" href="/ingia?next=%2Fdashboard%2Fvitabu"> {book.price_tzs === 0 ? "Ingia kuanza kusoma" : "Nunua na Lipa (inaandaliwa)"} </Link>
        </div>
      </div>
    </section>
  </main>;
}
