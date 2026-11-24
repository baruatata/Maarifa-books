"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

type HomeHeroSliderProps = { q: string; category: string };

const messages = {
  sw: [
    { eyebrow: "MAKTABA YA MAARIFABOOKS", title: "Maarifa mapya yanaanza hapa.", body: "Chagua kitabu, soma na ujiongezee maarifa kila siku.", action: "Gundua vitabu", href: "#vitabu" },
    { eyebrow: "JUKWAA LA WAANDISHI", title: "Kazi yako inastahili kusomwa.", body: "Fikisha kitabu chako kwa wasomaji kupitia MaarifaBooks.", action: "Jiunge kama muuzaji", href: "/wauzaji" },
    { eyebrow: "SOMA POPOTE ULIPO", title: "Kitabu kizuri hubadili mtazamo.", body: "Pata vitabu vya kidijitali na endelea kujifunza kwa urahisi.", action: "Tazama maktaba", href: "#vitabu" },
    { eyebrow: "JIFUNZE KILA SIKU", title: "Hatua moja ya maarifa huleta mabadiliko.", body: "Gundua mawazo mapya na panua uelewa wako kupitia vitabu.", action: "Anza kusoma", href: "#vitabu" },
    { eyebrow: "SOKO LA VITABU MTANDAONI", title: "Kitabu chako kinakusubiri.", body: "Chunguza maktaba ya vitabu vya kidijitali na uchague kinachokuvutia.", action: "Chunguza maktaba", href: "#vitabu" },
  ],
  en: [
    { eyebrow: "MAARIFABOOKS LIBRARY", title: "New knowledge starts here.", body: "Choose a book, read, and grow your knowledge every day.", action: "Discover books", href: "#vitabu" },
    { eyebrow: "A PLATFORM FOR AUTHORS", title: "Your work deserves to be read.", body: "Reach more readers with your book on MaarifaBooks.", action: "Become a seller", href: "/wauzaji" },
    { eyebrow: "READ WHEREVER YOU ARE", title: "A good book changes perspectives.", body: "Find digital books and keep learning with ease.", action: "View library", href: "#vitabu" },
    { eyebrow: "LEARN EVERY DAY", title: "One step in knowledge can bring change.", body: "Discover new ideas and broaden your understanding through books.", action: "Start reading", href: "#vitabu" },
    { eyebrow: "ONLINE BOOK MARKETPLACE", title: "Your next book is waiting.", body: "Explore digital books and choose what interests you.", action: "Explore library", href: "#vitabu" },
  ],
};

export function HomeHeroSlider({ q, category }: HomeHeroSliderProps) {
  const { en } = useLanguage();
  const [active, setActive] = useState(0);
  const slides = en ? messages.en : messages.sw;
  const slide = slides[active];

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="home-hero" aria-label={en ? "MaarifaBooks announcements" : "Matangazo ya MaarifaBooks"}>
      <div className="hero-slider" key={active}>
        <div className="hero-message">
          <p className="hero-eyebrow">{slide.eyebrow}</p>
          <h1>{slide.title}</h1>
          <p className="hero-description">{slide.body}</p>
          <Link className="hero-cta" href={slide.href}>{slide.action}<span aria-hidden="true"> →</span></Link>
        </div>
      </div>
      <div className="hero-slider-controls" aria-label={en ? "Choose announcement" : "Chagua tangazo"}>
        {slides.map((item, index) => (
          <button key={item.eyebrow} type="button" aria-label={en ? `Announcement ${index + 1}` : `Tangazo ${index + 1}`} aria-current={active === index ? "true" : undefined} className={active === index ? "hero-slider-dot active" : "hero-slider-dot"} onClick={() => setActive(index)} />
        ))}
      </div>
      <form className="book-search" action="/" method="get" role="search">
        <span aria-hidden="true">⌕</span>
        <input type="search" name="q" defaultValue={q} placeholder={en ? "Search for a book or author..." : "Tafuta kitabu au mwandishi..."} aria-label={en ? "Search books or authors" : "Tafuta kitabu au mwandishi"} />
        {category ? <input type="hidden" name="category" value={category} /> : null}
        <button type="submit">{en ? "Search" : "Tafuta"}</button>
      </form>
      <div className="hero-links">
        <Link href="#vitabu">{en ? "Explore books" : "Chunguza vitabu"}</Link>
        <Link href="/wauzaji">{en ? "Sell your books" : "Uza vitabu vyako"}</Link>
      </div>
    </section>
  );
}
