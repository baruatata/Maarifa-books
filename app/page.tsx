import Link from "next/link";
import { HomeBackToTop } from "@/components/home-back-to-top";
import { HomeHeroSlider } from "@/components/home-hero-slider";
import { createClient } from "@/lib/supabase/server";

type Book = {
  id: string;
  title: string;
  author_name: string | null;
  format: string;
  price_tzs: number;
  cover_path: string | null;
  category: string | null;
};

type HomeProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().replace(/[%,()]/g, "").slice(0, 80);
  const category = (params.category ?? "").trim().slice(0, 80);
  const supabase = await createClient();

  let query = supabase
    .from("books")
    .select("id,title,author_name,format,price_tzs,cover_path,category")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(24);

  if (q) query = query.or(`title.ilike.%${q}%,author_name.ilike.%${q}%`);
  if (category) query = query.eq("category", category);

  const { data } = await query;
  const books = (data ?? []) as Book[];
  const categories = Array.from(new Set(books.map((book) => book.category).filter((value): value is string => Boolean(value))));

  const covers = new Map(await Promise.all(books.map(async (book) => {
    if (!book.cover_path) return [book.id, null] as const;
    const { data: signed } = await supabase.storage.from("book-files").createSignedUrl(book.cover_path, 86400);
    return [book.id, signed?.signedUrl ?? null] as const;
  })));

  return (
    <main className="home-shell">
      <HomeHeroSlider q={q} category={category} books={books.map((book) => ({ id: book.id, title: book.title, author: book.author_name ?? "Mwandishi", coverUrl: covers.get(book.id) ?? null }))} />

      <section className="home-section" id="vitabu">
        <div className="home-section-head">
          <div>
            <p className="home-kicker">MAKTABA YETU</p>
            <h2>{q ? "Matokeo ya utafutaji" : category ? category : "Vitabu vipya"}</h2>
          </div>
          <span className="book-count">{books.length} vitabu</span>
        </div>

        {categories.length > 0 && (
          <nav className="category-chips" aria-label="Makundi ya vitabu">
            <Link className={!category ? "active" : ""} href="/">Vyote</Link>
            {categories.map((item) => (
              <Link className={category === item ? "active" : ""} href={`/?category=${encodeURIComponent(item)}`} key={item}>{item}</Link>
            ))}
          </nav>
        )}

        {books.length === 0 ? (
          <div className="home-empty">
            <div className="empty-book-icon">▤</div>
            <h3>{q || category ? "Hakuna kitabu kilichopatikana" : "Maktaba inaanza kujengwa"}</h3>
            <p>{q || category ? "Jaribu neno jingine au ondoa kichujio cha kundi." : "Vitabu vitaonekana hapa baada ya wauzaji kuviwasilisha na msimamizi kuviidhinisha."}</p>
            {(q || category) && <Link href="/">Ona vitabu vyote</Link>}
          </div>
        ) : (
          <div className="home-book-grid">
            {books.map((book) => (
              <Link href={`/kitabu/${book.id}`} className="home-book-card" key={book.id} aria-label={`Angalia maelezo ya ${book.title}`}>
                {covers.get(book.id) ? (
                  <img className="home-book-cover" src={covers.get(book.id)!} alt={`Jalada la ${book.title}`} />
                ) : (
                  <div className="home-book-placeholder"><span>MAARIFABOOKS</span><strong>{book.title}</strong><small>{book.author_name ?? "Mwandishi"}</small></div>
                )}
                <div className="home-book-info">
                  <h3>{book.title}</h3>
                  <p>{book.author_name ?? "Mwandishi hajatajwa"}</p>
                  <div className="home-book-meta"><span>{book.format.toUpperCase()}</span><strong>{book.price_tzs > 0 ? "TSh " + new Intl.NumberFormat("sw-TZ").format(book.price_tzs) : "BURE"}</strong></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="home-seller">
        <div>
          <p className="home-kicker">KWA WAANDISHI NA WACHAPISHAJI</p>
          <h2>Kitabu chako kinaweza kuwafikia wasomaji wengi zaidi.</h2>
          <p>Omba kujiunga kama muuzaji. Chagua kuweka kitabu bure au kwa bei yako. Mteja hulipa moja kwa moja kwako kupitia WhatsApp.</p>
        </div>
        <Link href="/wauzaji">Anza kuuza vitabu <span aria-hidden="true">→</span></Link>
      </section>
      <footer className="home-footer">MaarifaBooks <span>·</span> Sehemu ya Lumbwa Digital</footer>
      <HomeBackToTop />
    </main>
  );
}
