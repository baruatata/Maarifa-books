import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FreeBooksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { error } = await supabase.auth.signInAnonymously({ options: { data: { preferred_language: "sw" } } });
    if (error) redirect("/ingia");
    redirect("/dashboard/vitabu");
  }
  const { data: books } = await supabase.from("books")
    .select("id,title,author_name,format,cover_path")
    .eq("status", "approved").order("created_at", { ascending: false });
  const covers = new Map(await Promise.all((books ?? []).map(async book => {
    if (!book.cover_path) return [book.id, null] as const;
    const { data } = await supabase.storage.from("book-files").createSignedUrl(book.cover_path, 300);
    return [book.id, data?.signedUrl ?? null] as const;
  })));
  return <main className="page purchased-library">
    <p className="eyebrow">MAKTABA YA BURE</p><h1>Vitabu vya kusoma</h1>
    <p className="muted">Vitabu vyote vilivyoidhinishwa vinapatikana bure. Chagua kitabu uanze kusoma.</p>
    {!books?.length ? <section className="panel"><h2>Bado hakuna kitabu</h2><p className="muted">Vitabu vitaonekana hapa baada ya Admin kuviidhinisha.</p><Link className="btn" href="/">Chunguza maktaba</Link></section> :
      <section className="purchased-book-grid">{books.map(book => <article className="panel purchased-book-card" key={book.id}>
        {covers.get(book.id) ? <img src={covers.get(book.id)!} alt={"Jalada la " + book.title} /> : <div className="purchased-book-placeholder">MaarifaBooks</div>}
        <div><h2>{book.title}</h2><p className="muted">{book.author_name || "Mwandishi"} · {book.format.toUpperCase()}</p><Link className="btn" href={"/soma/" + book.id}>Soma sasa</Link></div>
      </article>)}</section>}
  </main>;
}
