import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RedeemBookCoupon } from "@/components/redeem-book-coupon";
import { RequestBookCoupon } from "@/components/request-book-coupon";

export default async function BookDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ requested?: string; error?: string }> }) {
  const { id } = await params;\n  const query = await searchParams;
  const supabase = await createClient();
  const { data: book } = await supabase.from("books")
    .select("id,title,author_name,description,language,category,format,price_tzs,cover_path,status,seller_id")
    .eq("id", id).eq("status", "approved").maybeSingle();
  if (!book) notFound();

  let coverUrl: string | null = null;
  if (book.cover_path) {
    const { data } = await supabase.storage.from("book-files").createSignedUrl(book.cover_path, 86400);
    coverUrl = data?.signedUrl ?? null;
  }

  let whatsappHref: string | null = null;
  if (book.price_tzs > 0) {
    const { data: sellerPhone } = await supabase.rpc("get_seller_whatsapp", { p_seller_id: book.seller_id });
    if (sellerPhone) {
      const message = `Habari, nahitaji kununua kitabu "${book.title}" cha TSh ${new Intl.NumberFormat("sw-TZ").format(book.price_tzs)} kupitia MaarifaBooks. Naomba maelekezo ya malipo.`;
      whatsappHref = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;
    }
  }

  const formatLabel: Record<string, string> = { pdf: "PDF", epub: "EPUB" };
  const languageLabel: Record<string, string> = { sw: "Kiswahili", en: "Kiingereza", other: "Lugha nyingine" };

  return <main className="page book-detail-page">
    <Link href="/" className="book-detail-back">← Rudi kwenye vitabu</Link>
    <section className="book-detail-layout">
      <div className="book-detail-cover">
        {coverUrl ? <img src={coverUrl} alt={"Jalada la " + book.title} /> : <div className="book-cover-fallback"><strong>{book.title}</strong><small>{book.author_name || "Mwandishi"}</small></div>}
      </div>
      <div className="book-detail-info">
        <p className="eyebrow">TAARIFA ZA KITABU</p>
        <h1>{book.title}</h1>
        <p className="book-detail-author">Na {book.author_name || "Mwandishi hajatajwa"}</p>
        <div className="book-detail-tags"><span>{formatLabel[book.format] || book.format}</span><span>{languageLabel[book.language] || book.language}</span>{book.category && <span>{book.category}</span>}</div>
        <h2>Maelezo ya kitabu</h2>
        <p className="book-detail-description">{book.description || "Maelezo ya kitabu hiki hayajawekwa bado."}</p>
        <div className="book-purchase-panel">
          <div><span className="muted">Bei ya kitabu</span><strong>{book.price_tzs > 0 ? "TSh " + new Intl.NumberFormat("sw-TZ").format(book.price_tzs) : "BURE"}</strong></div>
          {book.price_tzs > 0 ? <>
            <p className="book-payment-note">Soma sampuli ya bure yenye sura za mwanzo. Ukipenda kuendelea, wasiliana na muuzaji kupitia WhatsApp, lipa moja kwa moja kwake, kisha atakutumia coupon ya kufungua kitabu kizima.</p>
            {whatsappHref ? <a className="btn book-buy-button" href={whatsappHref} target="_blank" rel="noreferrer">Wasiliana na muuzaji WhatsApp</a> : <p className="message">Namba ya WhatsApp ya muuzaji haipatikani kwa sasa.</p>}
            <Link className="btn btn-outline book-buy-button" href={"/soma/" + book.id}>Soma sampuli ya bure</Link>
            {query.error && <p className="message" role="status">{query.error}</p>}\n            {query.requested === "1" ? <><p className="notice">Ombi lako limetumwa kwa muuzaji. Baada ya kuthibitisha malipo na kukutumia coupon, ingiza hapa chini.</p><RedeemBookCoupon bookId={book.id}/></> : <RequestBookCoupon bookId={book.id}/>}
          </> : <>
            <p className="book-payment-note">Kitabu hiki kinapatikana bure kupitia MaarifaBooks.</p>
            <Link className="btn book-buy-button" href={"/soma/" + book.id}>Soma kitabu sasa</Link>
          </>}
        </div>
      </div>
    </section>
  </main>;
}
