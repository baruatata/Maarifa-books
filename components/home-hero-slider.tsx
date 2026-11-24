"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HomeHeroSliderProps = {
  q: string;
  category: string;
};

const messages = [
  { eyebrow: "MAKTABA YA MAARIFABOOKS", title: "Maarifa mapya yanaanza hapa.", body: "Chagua kitabu, soma na ujiongezee maarifa kila siku.", action: "Gundua vitabu", href: "#vitabu" },
  { eyebrow: "JUKWAA LA WAANDISHI", title: "Kazi yako inastahili kusomwa.", body: "Fikisha kitabu chako kwa wasomaji kupitia MaarifaBooks.", action: "Jiunge kama muuzaji", href: "/wauzaji" },
  { eyebrow: "SOMA POPOTE ULIPO", title: "Kitabu kizuri hubadili mtazamo.", body: "Pata vitabu vya kidijitali na endelea kujifunza kwa urahisi.", action: "Tazama maktaba", href: "#vitabu" },
  { eyebrow: "JIFUNZE KILA SIKU", title: "Hatua moja ya maarifa huleta mabadiliko.", body: "Gundua mawazo mapya na panua uelewa wako kupitia vitabu.", action: "Anza kusoma", href: "#vitabu" },
  { eyebrow: "SOKO LA VITABU MTANDAONI", title: "Kitabu chako kinakusubiri.", body: "Chunguza maktaba ya vitabu vya kidijitali na uchague kinachokuvutia.", action: "Chunguza maktaba", href: "#vitabu" },
];

export function HomeHeroSlider({ q, category }: HomeHeroSliderProps) {
  const [active, setActive] = useState(0);
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
          <Link className="hero-cta" href={slide.href}>{slide.action}<span aria-hidden="true"> →</span></Link>
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
