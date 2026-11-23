import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PdfFlipbook from "@/components/pdf-flipbook";
import AudiobookPlayer from "@/components/audiobook-player";

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
    if(chaptersError||!rows?.length) return <main className="page"><h1>Audiobook haijakamilika</h1><p className="muted">Sauti za kitabu hazipatikani kwa sasa. Tafadhali wasiliana na muuzaji.</p><Link className="btn" href={"/kitabu/"+book.id}>Rudi kwenye kitabu</Link></main>;
    const availableRows=isFreePreview?rows.filter(chapter=>chapter.is_preview):rows;
    if(!availableRows.length) return <main className="page"><h1>Sampuli haijawekwa</h1><p className="muted">Muuzaji bado hajaweka sura ya sampuli ya bure.</p><Link className="btn" href={"/kitabu/"+book.id}>Rudi kwenye kitabu</Link></main>;
    const chapters=[];
    for(const chapter of availableRows){
      const {data:signed}=await supabase.storage.from("book-files").createSignedUrl(chapter.audio_path,3600);
      if(signed?.signedUrl) chapters.push({id:chapter.id,title:chapter.title,url:signed.signedUrl,chapterIndex:chapter.chapter_index});
    }
    return <main className="page online-reader">
      <nav className="reader-nav"><Link href={"/kitabu/"+book.id}>← Rudi kwenye kitabu</Link><Link href="/">MaarifaBooks</Link></nav>
      <header className="reader-heading"><p className="eyebrow">MSOMAJI WA MAARIFABOOKS</p><h1>{book.title}</h1><p className="muted">{book.author_name||"Mwandishi hajatajwa"}</p><span className="reader-access-note">{isFreePreview?"Unasikiliza sampuli ya bure":isSellerOwner?"Unasikiliza audiobook yako":"Audiobook imefunguliwa"}</span></header>
      <AudiobookPlayer bookId={book.id} chapters={chapters}/>
      {isFreePreview&&<div className="book-purchase-panel"><p className="book-payment-note">Hii ni sampuli ya bure. Ili kusikiliza kitabu kizima, wasiliana na muuzaji na uombe coupon.</p><Link className="btn" href={"/kitabu/"+book.id}>Wasiliana na muuzaji / Weka Coupon</Link></div>}
    </main>;
  }

  const pathToRead = isFreePreview ? book.preview_path : book.file_path;
  if (!pathToRead) redirect("/kitabu/" + book.id + "?error=" + encodeURIComponent("Sampuli ya bure bado haijawekwa. Wasiliana na muuzaji."));
  const { data: signed, error: fileError } = await supabase.storage.from("book-files").createSignedUrl(pathToRead, 3600);
  if (fileError || !signed?.signedUrl) return <main className="page"><h1>Faili la kitabu halijafunguka</h1><p className="muted">Kitabu kipo kwenye orodha, lakini mfumo umeshindwa kukifungua. Tafadhali jaribu tena baadaye.</p><Link className="btn" href={"/kitabu/" + book.id}>Rudi kwenye taarifa za kitabu</Link></main>;

  return <main className="page online-reader">
    <nav className="reader-nav"><Link href={"/kitabu/" + book.id}>← Rudi kwenye kitabu</Link><Link href="/">MaarifaBooks</Link></nav>
    <header className="reader-heading"><p className="eyebrow">MSOMAJI WA MAARIFABOOKS</p><h1>{book.title}</h1><p className="muted">{book.author_name || "Mwandishi hajatajwa"}</p><span className="reader-access-note">{isFreePreview ? "Unasoma sampuli ya bure" : isSellerOwner ? "Unasoma kitabu chako kama muuzaji" : book.price_tzs > 0 ? "Kitabu kizima kimefunguliwa" : "Unasoma kitabu bure"}</span>{isFreePreview && <p className="book-payment-note">Hii ni sampuli ya bure. Ili kuendelea na kitabu kizima, wasiliana na muuzaji na uombe coupon.</p>}</header>
    {book.format === "pdf" ? <section className="reader-frame-wrap"><PdfFlipbook url={signed.signedUrl} title={book.title} closeHref={"/kitabu/" + book.id}/><p className="reader-footnote">Unaweza kusogeza kurasa kwa kidole au mishale. {isFreePreview ? "Soma sampuli hii kisha wasiliana na muuzaji ili kununua kitabu kizima." : <><a href={signed.signedUrl} target="_blank" rel="noreferrer">Fungua PDF yenyewe</a>.</>}</p></section> : <section className="panel reader-unavailable"><h2>EPUB reader inaandaliwa</h2><p>Kisomaji cha EPUB kinaandaliwa; kwa sasa mfumo huu unaonyesha PDF pekee.</p><a className="btn" href={signed.signedUrl} target="_blank" rel="noreferrer">Fungua EPUB</a></section>}
    {isFreePreview && <div className="book-purchase-panel"><Link className="btn" href={"/kitabu/" + book.id}>Wasiliana na muuzaji / Weka Coupon</Link></div>}
    <p className="reader-footnote">MaarifaBooks inafungua kitabu kizima baada ya coupon halali kutumika mara moja.</p>
  </main>;
}
