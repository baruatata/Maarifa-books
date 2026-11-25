import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PdfFlipbook from "@/components/pdf-flipbook";
import AudiobookPlayer from "@/components/audiobook-player";
import { LanguageText } from "@/components/language-provider";

export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: book, error: bookError } = await supabase.from("books")
    .select("id,title,author_name,format,file_path,preview_path,price_tzs,status,seller_id")
    .eq("id", id).eq("status", "approved").maybeSingle();
  if (bookError || !book || (book.format !== "audiobook" && !book.file_path)) {
    redirect("/?error=" + encodeURIComponent("Kitabu hakijapatikana au bado hakijaidhinishwa."));
  }

  const isSellerOwner = Boolean(user && user.id === book.seller_id);
  let hasPurchasedAccess = book.price_tzs === 0 || isSellerOwner;
  if (book.price_tzs > 0 && user && !isSellerOwner) {
    const { data: entitlement } = await supabase.from("book_entitlements")
      .select("id").eq("book_id", book.id).eq("buyer_id", user.id).maybeSingle();
    hasPurchasedAccess = Boolean(entitlement);
  }
  const isFreePreview = book.price_tzs > 0 && !hasPurchasedAccess;

  if (book.format === "audiobook") {
    const { data: rows, error: chaptersError } = await supabase.from("book_audio_chapters")
      .select("id,title,audio_path,chapter_index,is_preview")
      .eq("book_id",book.id).order("chapter_index",{ascending:true});
    if(chaptersError||!rows?.length) return <main className="page"><h1><LanguageText sw="Audiobook haijakamilika" en="Audiobook is incomplete"/></h1><p className="muted"><LanguageText sw="Sauti za kitabu hazipatikani kwa sasa. Tafadhali wasiliana na muuzaji." en="Book audio is currently unavailable. Please contact the seller."/></p><Link className="btn" href={"/kitabu/"+book.id}><LanguageText sw="Rudi kwenye kitabu" en="Back to book"/></Link></main>;
    const availableRows=isFreePreview?rows.filter(chapter=>chapter.is_preview):rows;
    if(!availableRows.length) return <main className="page"><h1><LanguageText sw="Sampuli haijawekwa" en="Preview not available"/></h1><p className="muted"><LanguageText sw="Muuzaji bado hajaweka sura ya sampuli ya bure." en="The seller has not added a free preview chapter yet."/></p><Link className="btn" href={"/kitabu/"+book.id}>Rudi kwenye kitabu</Link></main>;
    const chapters=availableRows.map((chapter)=>({
      id:chapter.id,
      title:chapter.title,
      url:`/api/book-file/${book.id}?asset=chapter&chapterId=${encodeURIComponent(chapter.id)}`,
      chapterIndex:chapter.chapter_index,
    }));
    return <main className="page online-reader">
      <nav className="reader-nav"><Link href={"/kitabu/"+book.id}><LanguageText sw="← Rudi kwenye kitabu" en="← Back to book"/></Link><Link href="/">MaarifaBooks</Link></nav>
      <header className="reader-heading"><p className="eyebrow"><LanguageText sw="MSOMAJI WA MAARIFABOOKS" en="MAARIFABOOKS READER"/></p><h1>{book.title}</h1><p className="muted">{book.author_name||<LanguageText sw="Mwandishi hajatajwa" en="Author not specified"/>}</p><span className="reader-access-note">{isFreePreview?<LanguageText sw="Unasikiliza sampuli ya bure" en="Listening to free preview"/>:isSellerOwner?<LanguageText sw="Unasikiliza audiobook yako" en="Listening to your audiobook"/>:<LanguageText sw="Audiobook imefunguliwa" en="Audiobook unlocked"/>}</span></header>
      <AudiobookPlayer bookId={book.id} chapters={chapters}/>
      {isFreePreview&&<div className="book-purchase-panel"><p className="book-payment-note"><LanguageText sw="Hii ni sampuli ya bure. Ili kusikiliza kitabu kizima, wasiliana na muuzaji na uombe coupon." en="This is a free preview. To listen to the full audiobook, contact the seller and request a coupon."/></p><Link className="btn" href={"/kitabu/"+book.id}><LanguageText sw="Wasiliana na muuzaji / Weka Coupon" en="Contact seller / Enter coupon"/></Link></div>}
    </main>;
  }

  const pathToRead = isFreePreview ? book.preview_path : book.file_path;
  if (!pathToRead) redirect("/kitabu/" + book.id + "?error=" + encodeURIComponent("Sampuli ya bure bado haijawekwa. Wasiliana na muuzaji."));
  const fileUrl = `/api/book-file/${book.id}?asset=${isFreePreview ? "preview" : "full"}`;

  return <main className="page online-reader">
    <nav className="reader-nav"><Link href={"/kitabu/" + book.id}>← Rudi kwenye kitabu</Link><Link href="/">MaarifaBooks</Link></nav>
    <header className="reader-heading"><p className="eyebrow">MSOMAJI WA MAARIFABOOKS</p><h1>{book.title}</h1><p className="muted">{book.author_name || "Mwandishi hajatajwa"}</p><span className="reader-access-note">{isFreePreview ? <LanguageText sw="Unasoma sampuli ya bure" en="Reading free preview"/> : isSellerOwner ? <LanguageText sw="Unasoma kitabu chako kama muuzaji" en="Reading your book as the seller"/> : book.price_tzs > 0 ? <LanguageText sw="Kitabu kizima kimefunguliwa" en="Full book unlocked"/> : <LanguageText sw="Unasoma kitabu bure" en="Reading a free book"/>}</span>{isFreePreview && <p className="book-payment-note"><LanguageText sw="Hii ni sampuli ya bure. Ili kuendelea na kitabu kizima, wasiliana na muuzaji na uombe coupon." en="This is a free preview. To continue with the full book, contact the seller and request a coupon."/></p>}</header>
    {book.format === "pdf" ? <section className="reader-frame-wrap"><PdfFlipbook url={fileUrl} title={book.title} closeHref={"/kitabu/" + book.id}/><p className="reader-footnote"><LanguageText sw="Unaweza kusogeza kurasa kwa kidole au mishale. " en="Turn pages using your finger or the arrows. "/>{isFreePreview ? "Soma sampuli hii kisha wasiliana na muuzaji ili kununua kitabu kizima." : <><a href={fileUrl} target="_blank" rel="noreferrer"><LanguageText sw="Fungua PDF yenyewe" en="Open PDF file"/></a>.</>}</p></section> : <section className="panel reader-unavailable"><h2><LanguageText sw="EPUB reader inaandaliwa" en="EPUB reader is being prepared"/></h2><p><LanguageText sw="Kisomaji cha EPUB kinaandaliwa; kwa sasa mfumo huu unaonyesha PDF pekee." en="The EPUB reader is being prepared; currently this system displays PDF files only."/></p><a className="btn" href={fileUrl} target="_blank" rel="noreferrer"><LanguageText sw="Fungua EPUB" en="Open EPUB"/></a></section>}
    {isFreePreview && <div className="book-purchase-panel"><Link className="btn" href={"/kitabu/" + book.id}>Wasiliana na muuzaji / Weka Coupon</Link></div>}
    <p className="reader-footnote"><LanguageText sw="MaarifaBooks inafungua kitabu kizima baada ya coupon halali kutumika mara moja." en="MaarifaBooks unlocks the full book after a valid coupon has been redeemed once."/></p>
  </main>;
}
