import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookCouponRequestForm } from "@/components/book-coupon-request-form";
import { CopyPhoneButton } from "@/components/copy-phone-button";

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
    .select("id,title,author_name,description,language,category,status")
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
  const descriptionText = book.description?.replace(/\s+/g, " ").trim();
  const description = (
    descriptionText ||
    `Soma maelezo ya kitabu ${book.title}${author ? ` kilichoandikwa na ${author}` : ""} kupitia MaarifaBooks.`
  ).slice(0, 160);
  const title = author ? `${book.title} — ${author}` : book.title;
  const canonicalUrl = `${siteUrl}/kitabu/${encodeURIComponent(book.id)}`;
  const keywords = [
    book.title,
    author,
    book.category,
    book.language === "sw" ? "kitabu cha Kiswahili" : null,
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

export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: book } = await supabase.from("books")
    .select("id,title,author_name,description,language,category,format,price_tzs,cover_path,status,seller_id")
    .eq("id", id).eq("status", "approved").maybeSingle();
  if (!book) notFound();

  const isSellerOwner = Boolean(user && user.id === book.seller_id);

  let coverUrl: string | null = null;
  if (book.cover_path) {
    const { data } = await supabase.storage.from("book-files").createSignedUrl(book.cover_path, 86400);
    coverUrl = data?.signedUrl ?? null;
  }

  let sellerPhone: string | null = null;
  let whatsappHref: string | null = null;
  if (book.price_tzs > 0 && !isSellerOwner) {
    const { data } = await supabase.rpc("get_seller_whatsapp", { p_seller_id: book.seller_id });
    sellerPhone = data ? String(data) : null;
    if (sellerPhone) {
      const message = `Habari, nahitaji kununua kitabu "${book.title}" cha TSh ${new Intl.NumberFormat("sw-TZ").format(book.price_tzs)} kupitia MaarifaBooks. Naomba maelekezo ya malipo.`;
      const whatsappNumber = sellerPhone.replace(/\D/g, "");
      whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
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
          {isSellerOwner ? <>
            <p className="book-payment-note">Hiki ni kitabu chako. Kama mmiliki, unaweza kukisoma kizima bila kununua wala kuomba coupon.</p>
            <Link className="btn book-buy-button" href={"/soma/" + book.id}>Soma kitabu chako</Link>
          </> : book.price_tzs > 0 ? <>
            <p className="book-payment-note">Soma sampuli ya bure yenye sura za mwanzo. Ukipenda kuendelea, wasiliana na muuzaji, lipa moja kwa moja kwake, kisha atakutumia coupon ya kufungua kitabu kizima.</p>
            {sellerPhone ? <div className="book-seller-contact">
              <p><strong>Namba ya simu ya muuzaji</strong></p>
              <p className="book-seller-phone" dir="ltr">{sellerPhone}</p>
              <CopyPhoneButton phone={sellerPhone} />
              {whatsappHref && <a className="btn book-buy-button" href={whatsappHref} target="_blank" rel="noreferrer">Wasiliana na muuzaji WhatsApp</a>}
            </div> : <p className="message">Namba ya simu ya muuzaji haipatikani kwa sasa.</p>}
            <Link className="btn btn-outline book-buy-button" href={"/soma/" + book.id}>Soma sampuli ya bure</Link>
            <BookCouponRequestForm bookId={book.id}/>
          </> : <>
            <p className="book-payment-note">Kitabu hiki kinapatikana bure kupitia MaarifaBooks.</p>
            <Link className="btn book-buy-button" href={"/soma/" + book.id}>Soma kitabu sasa</Link>
          </>}
        </div>
      </div>
    </section>
  </main>;
}
