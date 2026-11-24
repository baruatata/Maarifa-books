"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type FeaturedBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
};

type HomeHeroSliderProps = {
  q: string;
  category: string;
  books: FeaturedBook[];
};

const messages = [
  { eyebrow: "MAKTABA YA MAARIFABOOKS", title: "Maarifa mapya yanaanza hapa.", body: "Chagua kitabu, soma na ujiongezee maarifa kila siku.", action: "Gundua vitabu" },
  { eyebrow: "JUKWAA LA WAANDISHI", title: "Kazi yako inastahili kusomwa.", body: "Fikisha kitabu chako kwa wasomaji kupitia MaarifaBooks.", action: "Jiunge kama muuzaji" },
  { eyebrow: "SOMA POPOTE ULIPO", title: "Kitabu kizuri hubadili mtazamo.", body: "Pata vitabu vya kidijitali na endelea kujifunza kwa urahisi.", action: "Tazama maktaba" },
];

export function HomeHeroSlider({ q, category, books }: HomeHeroSliderProps) {
  const [active, setActive] = useState(0);
  const featured = books.filter((book) => book.coverUrl).slice(0, 3);
  const slide = messages[active];

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % messages.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="home-hero" aria-label="Matangazo ya MaarifaBooks">
      <div className="hero-slider" key={active}>
        <div className="hero-message">
          <p className="hero-eyebrow">{slide.eyebrow}</p>
          <h1>{slide.title}</h1>
          <p className="hero-description">{slide.body}</p>
          <Link className="hero-cta" href={active === 1 ? "/wauzaji" : "#vitabu"}>{slide.action}<span aria-hidden="true"> →</span></Link>
        </div>
        <div className="hero-books" aria-label="Vitabu vilivyopo MaarifaBooks">
          {featured.length > 0 ? featured.map((book, index) => (
            <Link className={`hero-book hero-book-${index + 1}`} href={`/kitabu/${book.id}`} key={book.id} aria-label={`Fungua kitabu ${book.title}`}>
              <img src={book.coverUrl!} alt={`Jalada la ${book.title}`} />
              <span>{book.title}</span>
            </Link>
          )) : (
            <div className="hero-book-empty"><span>MAARIFABOOKS</span><strong>Vitabu vya maarifa</strong></div>
          )}
        </div>
      </div>
      <div className="hero-slider-controls" aria-label="Chagua tangazo">
        {messages.map((item, index) => (
          <button key={item.eyebrow} type="button" aria-label={`Tangazo ${index + 1}`} aria-current={active === index ? "true" : undefined} className={active === index ? "hero-slider-dot active" : "hero-slider-dot"} onClick={() => setActive(index)} />
        ))}
      </div>
      <form className="book-search" action="/" method="get" role="search">
        <span aria-hidden="true">⌕</span>
        <input type="search" name="q" defaultValue={q} placeholder="Tafuta kitabu au mwandishi..." aria-label="Tafuta kitabu au mwandishi" />
        {category ? <input type="hidden" name="category" value={category} /> : null}
        <button type="submit">Tafuta</button>
      </form>
      <div className="hero-links">
        <Link href="#vitabu">Chunguza vitabu</Link>
        <Link href="/wauzaji">Uza vitabu vyako</Link>
      </div>
    </section>
  );
}
