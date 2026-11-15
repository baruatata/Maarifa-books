import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Book = { id: string; title: string; author_name: string | null; format: string; price_tzs: number };
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("id,title,author_name,format,price_tzs").eq("status", "approved").order("created_at", { ascending: false }).limit(12);
  const books = (data ?? []) as Book[];
  return <main>
    <section className="hero"><div><p className="eyebrow">MAARIFA YANAPATIKANA POPOTE</p><h1>Hadithi, maarifa na mawazo <em>mikononi mwako.</em></h1><p className="lead">Gundua vitabu vya kidijitali kwa Kiswahili na Kiingereza. Soma au sikiliza kutoka kifaa chako popote ulipo.</p><Link className="btn" href="#vitabu">Chunguza vitabu　→</Link></div><div className="art"><div className="ring"/><div className="mockbook"><small>MAARIFA BOOKS</small><strong>Jifunze.<br/>Soma.<br/>Kua.</strong><small>MKUSANYIKO WA VITABU</small></div></div></section>
    <section className="section" id="vitabu"><div className="section-head"><div><p className="eyebrow">MAKTABA YETU</p><h2 className="section-title">Vitabu vilivyoidhinishwa</h2></div><span className="muted">{books.length} vitabu</span></div>
    {books.length === 0 ? <div className="empty"><h3>Maktaba inaanza kujengwa</h3><p>Vitabu vitaonekana baada ya wauzaji kuviwasilisha na msimamizi kuviidhinisha.</p></div> : <div className="grid">{books.map(book => <article className="card" key={book.id}><div className="cover"><small>MAARIFABOOKS</small><strong>{book.title}</strong><small>{book.author_name ?? "Mwandishi"}</small></div><div className="book-info"><h3>{book.title}</h3><p>{book.author_name ?? "Mwandishi hajatajwa"} · {book.format.toUpperCase()}</p><span className="price">TSh {book.price_tzs.toLocaleString("en-TZ")}</span></div></article>)}</div>}</section>
    <section className="seller"><div><p className="eyebrow">KWA WAANDISHI NA WACHAPISHAJI</p><h2>Kitabu chako kinaweza kuwafikia wasomaji wengi zaidi.</h2><p>Omba kujiunga kama muuzaji. Kila ombi na kitabu vitapitiwa na msimamizi. Kwa sasa muuzaji anapata asilimia 100 ya mauzo yake.</p></div><Link className="outline" href="/wauzaji">Anza kuuza</Link></section>
    <footer>MaarifaBooks · Sehemu ya Lumbwa Digital</footer>
  </main>;
}
