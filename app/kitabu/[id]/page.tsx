import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { submitManualPayment } from "./actions";

export default async function BookDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; submitted?: string; order?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let paymentStatus: string | null = null;
  if (query.submitted === "1" && query.order && user) {
    const { data: submission } = await supabase.from("payment_submissions")
      .select("status").eq("order_id", query.order).eq("buyer_id", user.id).maybeSingle();
    paymentStatus = submission?.status ?? null;
  }
  const { data: book } = await supabase.from("books")
    .select("id,title,author_name,description,language,category,format,price_tzs,cover_path,status,seller_id")
    .eq("id", id).eq("status", "approved").maybeSingle();
  if (!book) notFound();

  let coverUrl: string | null = null;
  if (book.cover_path) {
    const { data } = await supabase.storage.from("book-files").createSignedUrl(book.cover_path, 86400);
    coverUrl = data?.signedUrl ?? null;
  }
  const { data: payout } = await supabase.from("seller_payout_methods")
    .select("provider,phone_number,account_name").eq("seller_id", book.seller_id).maybeSingle();
  const providerLabels: Record<string, string> = { mixx: "Mixx by Yas", mpesa: "M-Pesa", airtel_money: "Airtel Money", tigo_pesa: "Tigo Pesa" };
  const formatLabel: Record<string, string> = { pdf: "PDF", epub: "EPUB", audiobook: "Audiobook" };
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
        {query.error && <p className="message" role="alert">{query.error}</p>}
        {query.submitted === "1" && paymentStatus === "confirmed" && <div className="notice payment-success" role="status"><strong>Malipo yamethibitishwa!</strong><p>Kitabu chako kiko tayari. Huhitaji kujisajili wala kuingia.</p><Link className="btn book-buy-button" href={"/soma/" + book.id}>Soma kitabu sasa</Link></div>}
        {query.submitted === "1" && paymentStatus === "submitted" && <p className="notice" role="status">Tumepokea taarifa zako za malipo. Muuzaji akishathibitisha kupokea fedha, rudi hapa na uonyeshe ukurasa upya ili kitabu kifunguke.</p>}
        {query.submitted === "1" && paymentStatus === "rejected" && <p className="message" role="alert">Muuzaji hajathibitisha malipo haya. Hakikisha umetuma fedha sahihi kisha wasiliana na muuzaji.</p>}
        <div className="book-purchase-panel">
          <div><span className="muted">Bei ya kitabu</span><strong>{book.price_tzs === 0 ? "BURE" : "TSh " + Number(book.price_tzs).toLocaleString("en-TZ")}</strong></div>
          {book.price_tzs === 0
            ? <p className="book-payment-note">Kitabu hiki ni bure. Ingia kwenye akaunti ili kuanza kukisoma.</p>
            : null}
          {book.price_tzs === 0 ? <Link className="btn book-buy-button" href="/ingia?next=%2Fdashboard%2Fvitabu">Ingia kuanza kusoma</Link> : payout ? <div className="manual-payment-box">
            <h3>Lipa moja kwa moja kwa muuzaji</h3>
            <p className="book-payment-note">Tuma TSh {Number(book.price_tzs).toLocaleString("en-TZ")} kwenda kwenye namba hii. Fedha haziingii kwenye akaunti ya MaarifaBooks.</p>
            <p><strong>{providerLabels[payout.provider] || payout.provider}</strong><br/><strong>{payout.phone_number}</strong><br/>{payout.account_name}</p>
            <p className="book-payment-note">Baada ya kutuma fedha, jaza kumbukumbu ya muamala hapa chini. Huhitaji kufungua akaunti. Kitabu kitafunguka hapa baada ya muuzaji kuthibitisha malipo.</p>
            <form action={submitManualPayment.bind(null, book.id)} className="form">
              <input type="hidden" name="payment_provider" value={payout.provider}/>
              <div className="field"><label htmlFor="payer-phone">Namba uliyotumia kulipa</label><input id="payer-phone" name="payer_phone" placeholder="07XXXXXXXX" required inputMode="tel"/></div>
              <div className="field"><label htmlFor="transaction-reference">Namba ya muamala / kumbukumbu ya malipo</label><input id="transaction-reference" name="transaction_reference" placeholder="Weka transaction ID" required maxLength={80}/></div>
              <button className="btn book-buy-button">Nimetuma malipo — tuma uthibitisho</button>
            </form>
          </div> : <p className="book-payment-note">Muuzaji bado hajaweka namba ya kupokea malipo. Tafadhali jaribu tena baadaye.</p>}
        </div>
      </div>
    </section>
  </main>;
}
