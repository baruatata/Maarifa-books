import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PurchasedBooksPage({ searchParams }: { searchParams: Promise<{ error?: string; pending?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia?next=/dashboard/vitabu");

  const { data: orders } = await supabase.from("orders").select("id,paid_at")
    .eq("buyer_id", user.id).eq("status", "paid").order("paid_at", { ascending: false });
  const orderIds = (orders ?? []).map(order => order.id);
  const { data: items } = orderIds.length
    ? await supabase.from("order_items").select("book_id,order_id").in("order_id", orderIds)
    : { data: [] as { book_id: string; order_id: string }[] };
  const bookIds = [...new Set((items ?? []).map(item => item.book_id))];
  const { data: books } = bookIds.length
    ? await supabase.from("books").select("id,title,author_name,format,cover_path").in("id", bookIds).eq("status", "approved")
    : { data: [] as { id: string; title: string; author_name: string | null; format: string; cover_path: string | null }[] };
  const covers = new Map(await Promise.all((books ?? []).map(async book => {
    if (!book.cover_path) return [book.id, null] as const;
    const { data } = await supabase.storage.from("book-files").createSignedUrl(book.cover_path, 300);
    return [book.id, data?.signedUrl ?? null] as const;
  })));

  return <main className="page purchased-library">
    <p className="eyebrow">MAKTABA YANGU</p><h1>Vitabu nilivyonunua</h1>
    <p className="muted">Vitabu ulivyolipia vinaonekana hapa. Bonyeza “Soma sasa” kuvisoma ndani ya MaarifaBooks.</p>
    {params.pending && <p className="notice">Uthibitisho umetumwa kwa muuzaji. Kitabu kitaonekana hapa baada ya muuzaji kuthibitisha kuwa fedha zimeingia.</p>}
    {params.error && <p className="message">{params.error}</p>}
    {!books?.length ? <section className="panel"><h2>Bado huna kitabu</h2><p className="muted">Vitabu utakavyonunua vitaonekana hapa baada ya malipo kuthibitishwa.</p><Link className="btn" href="/">Chunguza vitabu</Link></section> :
      <section className="purchased-book-grid">{books.map(book => <article className="panel purchased-book-card" key={book.id}>
        {covers.get(book.id) ? <img src={covers.get(book.id)!} alt={"Jalada la " + book.title} /> : <div className="purchased-book-placeholder">MaarifaBooks</div>}
        <div><h2>{book.title}</h2><p className="muted">{book.author_name || "Mwandishi"} · {book.format.toUpperCase()}</p><Link className="btn" href={"/soma/" + book.id}>Soma sasa</Link></div>
      </article>)}</section>}
  </main>;
}
