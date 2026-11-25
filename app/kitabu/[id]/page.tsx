import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookCouponOptions } from "@/components/book-coupon-options";
import { LanguageText } from "@/components/language-provider";


const siteUrl = "https://maarifabooks.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("id,title,author_name,description,language,category")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!book) {
    return {
      title: "Kitabu hakipatikani",
      robots: { index: false, follow: false },
    };
  }

  const author = book.author_name?.trim();
  const rawDescription = book.description?.replace(/\s+/g, " ").trim();
  const description = (
    rawDescription ||
    `Soma maelezo ya kitabu ${book.title}${author ? ` kilichoandikwa na ${author}` : ""} kupitia MaarifaBooks.`
  ).slice(0, 160);
  const title = author ? `${book.title} — ${author}` : book.title;
  const canonicalUrl = `${siteUrl}/kitabu/${encodeURIComponent(book.id)}`;
  const keywords = [
    book.title,
    author,
    book.category,
    book.language === "sw" ? "kitabu cha Kiswahili" : null,
    book.language === "en" ? "book in English" : null,
    "MaarifaBooks",
    "vitabu vya kidijitali",
  ].filter((value): value is string => Boolean(value));

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "book",
      title,
      description,
      url: canonicalUrl,
      siteName: "MaarifaBooks",
      locale: book.language === "en" ? "en_TZ" : "sw_TZ",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function BookDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ requested?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: { user } }, { data: book }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("books").select("id,title,author_name,description,language,category,format,price_tzs,cover_path,status,seller_id")
      .eq("id", id).eq("status", "approved").maybeSingle()
  ]);
  if (!book) notFound();

  // The uploader's authenticated account owns this book; show the full-reader
  // action instead of buyer checkout/coupon prompts on the book detail page.
  const isSellerOwner = Boolean(user && user.id === book.seller_id);

  let coverUrl: string | null = null;
  if (book.cover_path) {
    const { data } = await supabase.storage.from("book-files").createSignedUrl(book.cover_path, 86400);
    coverUrl = data?.signedUrl ?? null;
  }

  let whatsappHref: string | null = null;
  if (book.price_tzs > 0 && !isSellerOwner) {
    const { data: sellerPhone } = await supabase.rpc("get_seller_whatsapp", { p_seller_id: book.seller_id });
    if (sellerPhone) {
      const message = `Habari, nahitaji kununua kitabu "${book.title}" cha TSh ${new Intl.NumberFormat("sw-TZ").format(book.price_tzs)} kupitia MaarifaBooks. Naomba maelekezo ya malipo.`;
      whatsappHref = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;
    }
  }

  const formatLabel: Record<string, string> = { pdf: "PDF", epub: "EPUB", audiobook: "Audiobook" };
  const languageLabel: Record<string, string> = { sw: "Kiswahili", en: "Kiingereza", other: "Lugha nyingine" };

  return <main className="page book-detail-page">
    <Link href="/" className="book-detail-back"><LanguageText sw="← Rudi kwenye vitabu" en="← Back to books"/></Link>
    <section className="book-detail-layout">
      <div className="book-detail-cover">
        {coverUrl ? <img src={coverUrl} alt={"Jalada la " + book.title} /> : <div className="book-cover-fallback"><strong>{book.title}</strong><small>{book.author_name || <LanguageText sw="Mwandishi" en="Author"/>}</small></div>}
      </div>
      <div className="book-detail-info">
        <p className="eyebrow"><LanguageText sw="TAARIFA ZA KITABU" en="BOOK DETAILS"/></p>
        <h1>{book.title}</h1>
        <p className="book-detail-author">Na {book.author_name || <LanguageText sw="Mwandishi hajatajwa" en="Author not specified"/>}</p>
        <div className="book-detail-tags"><span>{formatLabel[book.format] || book.format}</span><span>{languageLabel[book.language] || book.language}</span>{book.category && <span>{book.category}</span>}</div>
        <h2><LanguageText sw="Maelezo ya kitabu" en="Book description"/></h2>
        <p className="book-detail-description">{book.description || <LanguageText sw="Maelezo ya kitabu hiki hayajawekwa bado." en="A description for this book has not been added yet."/>}</p>
        <div className="book-purchase-panel">
          {isSellerOwner ? <>
            <p className="notice"><LanguageText sw="Hiki ni kitabu chako kama muuzaji. Unaweza kukisoma chote bila kulipia wala kutumia coupon." en="This is your book as the seller. You can read the full book without paying or using a coupon."/></p>
            <Link className="btn book-buy-button" href={"/soma/" + book.id}><LanguageText sw="Soma / Sikiliza kitabu changu" en="Read / Listen to my book"/></Link>
          </> : book.price_tzs > 0 ? <>
            <div><span className="muted"><LanguageText sw="Bei ya kitabu" en="Book price"/></span><strong>{"TSh " + new Intl.NumberFormat("sw-TZ").format(book.price_tzs)}</strong></div>
            <p className="book-payment-note"><LanguageText sw="Soma / Sikiliza sampuli ya bure yenye sura za mwanzo. Ukipenda kuendelea, wasiliana na muuzaji kupitia WhatsApp, lipa moja kwa moja kwake, kisha atakutumia coupon ya kufungua kitabu kizima." en="Read or listen to the free preview. To continue, contact the seller on WhatsApp and pay them directly. They will then send you a coupon to unlock the full book."/></p>
            {whatsappHref ? <a className="btn book-buy-button" href={whatsappHref} target="_blank" rel="noreferrer"><LanguageText sw="Wasiliana na muuzaji WhatsApp" en="Contact seller on WhatsApp"/></a> : <p className="message"><LanguageText sw="Namba ya WhatsApp ya muuzaji haipatikani kwa sasa." en="The seller’s WhatsApp number is currently unavailable."/></p>}
            <Link className="btn btn-outline book-buy-button" href={"/soma/" + book.id}><LanguageText sw="Soma sampuli ya bure" en="Read free preview"/></Link>
            <BookCouponOptions bookId={book.id} requested={query.requested === "1"} error={query.error}/>
          </> : <>
            <p className="book-payment-note"><LanguageText sw="Kitabu hiki kinapatikana bure kupitia MaarifaBooks." en="This book is available for free on MaarifaBooks."/></p>
            <Link className="btn book-buy-button" href={"/soma/" + book.id}><LanguageText sw="Soma / Sikiliza kitabu sasa" en="Read / Listen to the book now"/></Link>
          </>}
        </div>
      </div>
    </section>
  </main>;
}
