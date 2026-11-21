import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateBookCoupon } from "@/components/create-book-coupon";

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
    supabase.from("book_coupon_requests").select("id,book_id,customer_name,customer_phone,transaction_reference,status,created_at")
      .eq("seller_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);

  const codeRows = codes ?? [];
  const requestRows = requests ?? [];
  const pendingRequests = requestRows.filter(request => request.status === "pending");
  const bookTitles = new Map((books ?? []).map(book => [book.id, book.title]));
  return <main className="page">
    <Link href="/dashboard" className="book-detail-back">← Rudi kwenye dashibodi</Link>
    <p className="eyebrow">DASHIBODI YA MUUZAJI</p>
    <h1>Coupon za kufungua vitabu</h1>
    <section className="panel" style={{ padding: 18, margin: "18px 0" }}>
      <h2 style={{ marginTop: 0 }}>Maombi ya Coupon ({pendingRequests.length} mapya)</h2>
      <p className="muted">Kila mteja ana ombi lake. Hakiki kumbukumbu ya muamala, kisha tengeneza coupon tofauti kwa kila mteja.</p>
      {!requestRows.length ? <p className="muted">Bado hakuna maombi ya coupon.</p> : <div className="table-wrap"><table className="table"><thead><tr><th>Mteja</th><th>Kitabu</th><th>Simu</th><th>Muamala</th><th>Hali</th><th>Tarehe</th></tr></thead><tbody>{requestRows.map(request => <tr key={request.id}><td>{request.customer_name || "Jina halijatolewa"}</td><td>{bookTitles.get(request.book_id) || "Kitabu"}</td><td>{request.customer_phone}</td><td>{request.transaction_reference}</td><td><span className="status">{request.status === "pending" ? "Jipya — hakiki malipo" : request.status === "fulfilled" ? "Limehudumiwa" : "Limekataliwa"}</span></td><td>{new Date(request.created_at).toLocaleString("sw-TZ")}</td></tr>)}</tbody></table></div>}
    </section>
    <p className="muted">Mteja akishalipa moja kwa moja kwako kupitia WhatsApp, tengeneza coupon moja kwa ajili yake na umtumie. Kila coupon inatumika mara moja tu.</p>
    {!books?.length ? <section className="panel"><h2>Bado hakuna kitabu cha kulipia kilichoidhinishwa</h2><p className="muted">Pakia kitabu, weka bei kubwa kuliko sifuri na sampuli ya bure, kisha subiri Admin akidhinishe.</p><Link className="btn" href="/dashboard/kitabu">Pakia kitabu</Link></section> : <div className="coupon-book-list">
      {books.map(book => {
        const bookCodes = codeRows.filter(code => code.book_id === book.id);
        return <section className="panel coupon-book-card" key={book.id}>
          <h2>{book.title}</h2>
          <p className="muted">Bei: TSh {new Intl.NumberFormat("sw-TZ").format(book.price_tzs)}</p>
          <CreateBookCoupon bookId={book.id}/>
          <div className="coupon-history">
            <strong>Historia ya coupon ({bookCodes.length})</strong>
            {bookCodes.length === 0 ? <p className="muted">Bado hujatengeneza coupon.</p> : <ul>{bookCodes.slice(0, 10).map(code => <li key={code.id}>
              <span>{new Date(code.created_at).toLocaleDateString("sw-TZ")}</span>
              <span>{code.revoked_at ? "Imefutwa" : code.redeemed_at ? "Imetumika" : "Haijatumika"}</span>
            </li>)}</ul>}
          </div>
        </section>;
      })}
    </div>}
  </main>;
}
