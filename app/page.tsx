import Link from "next/link";
import { HomeBackToTop } from "@/components/home-back-to-top";
import { HomeHeroSlider } from "@/components/home-hero-slider";
import { createClient } from "@/lib/supabase/server";
import { LanguageText } from "@/components/language-provider";

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



  return (
    <main className="home-shell">
      <HomeHeroSlider q={q} category={category} />

      <section className="home-section" id="vitabu">
        <div className="home-section-head">
          <div>
            <p className="home-kicker"><LanguageText sw="MAKTABA YETU" en="OUR LIBRARY" /></p>
            <h2>{q ? <LanguageText sw="Matokeo ya utafutaji" en="Search results" /> : category ? category : <LanguageText sw="Vitabu vipya" en="New books" />}</h2>
          </div>
          <span className="book-count">{books.length} <LanguageText sw="vitabu" en="books" /></span>
        </div>

        {categories.length > 0 && (
          <nav className="category-chips" aria-label="Book categories">
            <Link className={!category ? "active" : ""} href="/"><LanguageText sw="Vyote" en="All" /></Link>
            {categories.map((item) => (
              <Link className={category === item ? "active" : ""} href={`/?category=${encodeURIComponent(item)}`} key={item}>{item}</Link>
            ))}
          </nav>
        )}

        {books.length === 0 ? (
          <div className="home-empty">
            <div className="empty-book-icon">▤</div>
            <h3>{q || category ? <LanguageText sw="Hakuna kitabu kilichopatikana" en="No books found" /> : <LanguageText sw="Maktaba inaanza kujengwa" en="The library is being built" />}</h3>
            <p>{q || category ? <LanguageText sw="Jaribu neno jingine au ondoa kichujio cha kundi." en="Try another search term or clear the category filter." /> : <LanguageText sw="Vitabu vitaonekana hapa baada ya wauzaji kuviwasilisha na msimamizi kuviidhinisha." en="Books will appear here after sellers submit them and an administrator approves them." />}</p>
            {(q || category) && <Link href="/"><LanguageText sw="Ona vitabu vyote" en="View all books" /></Link>}
          </div>
        ) : (
          <div className="home-book-grid">
            {books.map((book, index) => (
              <Link href={`/kitabu/${book.id}`} className="home-book-card" key={book.id} aria-label={`Angalia maelezo ya ${book.title}`}>
                {book.cover_path ? (
                  <img className="home-book-cover" src={`/api/book-file/${book.id}?asset=cover`} alt={`Jalada la ${book.title}`} loading={index < 4 ? "eager" : "lazy"} fetchPriority={index < 4 ? "high" : "auto"} decoding="async" width={480} height={640} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw" />
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
          <p className="home-kicker"><LanguageText sw="KWA WAANDISHI NA WACHAPISHAJI" en="FOR AUTHORS AND PUBLISHERS" /></p>
          <h2><LanguageText sw="Kitabu chako kinaweza kuwafikia wasomaji wengi zaidi." en="Your book can reach more readers." /></h2>
          <p><LanguageText sw="Omba kujiunga kama muuzaji. Chagua kuweka kitabu bure au kwa bei yako. Mteja hulipa moja kwa moja kwako kupitia WhatsApp." en="Apply to become a seller. Offer your book for free or set your own price. Customers pay you directly through WhatsApp." /></p>
        </div>
        <Link href="/wauzaji"><LanguageText sw="Anza kuuza vitabu" en="Start selling books" /> <span aria-hidden="true">→</span></Link>
      </section>
      <footer className="home-footer">MaarifaBooks <span>·</span> Sehemu ya Lumbwa Digital</footer>
      <HomeBackToTop />
    </main>
  );
}
