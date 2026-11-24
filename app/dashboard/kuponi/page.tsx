import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateBookCoupon } from "@/components/create-book-coupon";
import { confirmCouponRequestPayment } from "./actions";
import { LanguageText } from "@/components/language-provider";

export default async function SellerCouponsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");

  const { data: application } = await supabase.from("seller_applications")
    .select("store_name,status").eq("user_id", user.id).maybeSingle();
  if (application?.status !== "approved") redirect("/wauzaji");

  const [{ data: books }, { data: codes }, { data: requests }] = await Promise.all([
    supabase.from("books").select("id,title,price_tzs").eq("seller_id", user.id)
      .eq("status", "approved").gt("price_tzs", 0).order("created_at", { ascending: false }),
    supabase.from("book_access_codes").select("id,book_id,created_at,expires_at,redeemed_at,revoked_at")
      .eq("seller_id", user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("book_coupon_requests").select("id,book_id,customer_name,customer_phone,transaction_reference,status,payment_status,created_at")
      .eq("seller_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);

  const codeRows = codes ?? [];
  const requestRows = requests ?? [];
  const bookById = new Map((books ?? []).map(book => [book.id, book]));
  return <main className="page">
    <Link href="/dashboard" className="book-detail-back">← <LanguageText sw="Rudi kwenye dashibodi" en="Back to dashboard" /></Link>
    <p className="eyebrow"><LanguageText sw="DASHIBODI YA MUUZAJI" en="SELLER DASHBOARD" /></p>
    <h1><LanguageText sw="Coupon za kufungua vitabu" en="Book access coupons" /></h1>
    <p className="muted"><LanguageText sw="Maombi ya wateja yanaonekana hapa. Hakikisha malipo yameingia kabla ya kuthibitisha, kisha tengeneza coupon kwa ombi husika." en="Customer requests appear here. Make sure payment has arrived before confirming it, then create a coupon for that specific request." /></p>
    {requestRows.length > 0 && <section className="panel coupon-book-card"><h2><LanguageText sw="Maombi ya coupon (" en="Coupon requests (" />{requestRows.filter(r => r.status === "pending").length} yanayosubiri)</h2>{requestRows.map(request => <article id={"request-" + request.id} className="coupon-history" key={request.id}><strong>{bookById.get(request.book_id)?.title || "Kitabu"}</strong><p className="muted"><LanguageText sw="Mteja:" en="Customer:" /> {request.customer_name || "Hajataja jina"} · {request.customer_phone}</p><p className="muted"><LanguageText sw="Kumbukumbu ya malipo:" en="Payment reference:" /> {request.transaction_reference}</p><p className="muted"><LanguageText sw="Hali ya malipo:" en="Payment status:" /> {request.payment_status === "received" ? <LanguageText sw="Yamepokelewa" en="Received" /> : request.payment_status === "not_received" ? <LanguageText sw="Hayajapokelewa" en="Not received" /> : <LanguageText sw="Hayajathibitishwa" en="Unconfirmed" />} · <LanguageText sw="Ombi:" en="Request:" /> {request.status === "fulfilled" ? <LanguageText sw="Coupon imetumwa" en="Coupon sent" /> : request.status === "rejected" ? <LanguageText sw="Limekataliwa" en="Rejected" /> : <LanguageText sw="Linasubiri" en="Pending" />}</p>{request.status === "pending" && (request.payment_status === "received" ? <><p className="notice"><LanguageText sw="Malipo yamethibitishwa. Tengeneza coupon ya ombi hili hapa chini." en="Payment confirmed. Create the coupon for this request below." /></p><CreateBookCoupon bookId={request.book_id} requestId={request.id}/></> : <form action={confirmCouponRequestPayment}><input type="hidden" name="request_id" value={request.id}/><button className="btn" type="submit"><LanguageText sw="Thibitisha kupokea malipo" en="Confirm payment received" /></button></form>)}</article>)}</section>}
    {!books?.length ? <section className="panel"><h2><LanguageText sw="Bado hakuna kitabu cha kulipia kilichoidhinishwa" en="No paid book has been approved yet" /></h2><p className="muted"><LanguageText sw="Pakia kitabu, weka bei kubwa kuliko sifuri na sampuli ya bure, kisha subiri Admin akidhinishe." en="Upload a book, set a price above zero and add a free sample, then wait for Admin approval." /></p><Link className="btn" href="/dashboard/kitabu"><LanguageText sw="Pakia kitabu" en="Upload a book" /></Link></section> : <div className="coupon-book-list">
      {books.map(book => {
        const bookCodes = codeRows.filter(code => code.book_id === book.id);
        return <section className="panel coupon-book-card" key={book.id}>
          <h2>{book.title}</h2>
          <p className="muted">Bei: TSh {new Intl.NumberFormat("sw-TZ").format(book.price_tzs)}</p>
          <CreateBookCoupon bookId={book.id}/>
          <div className="coupon-history">
            <strong><LanguageText sw="Historia ya coupon (" en="Coupon history (" />{bookCodes.length})</strong>
            {bookCodes.length === 0 ? <p className="muted"><LanguageText sw="Bado hujatengeneza coupon." en="You have not created any coupons yet." /></p> : <ul>{bookCodes.slice(0, 10).map(code => <li key={code.id}>
              <span>{new Date(code.created_at).toLocaleDateString("sw-TZ")}</span>
              <span>{code.revoked_at ? "Imefutwa" : code.redeemed_at ? "Imetumika" : "Haijatumika"}</span>
            </li>)}</ul>}
          </div>
        </section>;
      })}
    </div>}
  </main>;
}
