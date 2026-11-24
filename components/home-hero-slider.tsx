"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const slides = [
  {
    eyebrow: "SOMA · JIFUNZE · ENDELEA",
    title: "Vitabu bora, waandishi mahiri na maarifa yasiyo na mipaka.",
    description: "Soma, jifunze na ukue popote ulipo.",
    action: "Chunguza vitabu",
    href: "#vitabu",
  },
  {
    eyebrow: "GUNDUA MAARIFA MAPYA",
    title: "Kitabu chako kinachofuata kinakusubiri.",
    description: "Jifunze mambo mapya kupitia vitabu vya kidijitali.",
    action: "Tazama vitabu",
    href: "#vitabu",
  },
  {
    eyebrow: "JUKWAA LA WAANDISHI NA WACHAPISHAJI",
    title: "Kitabu chako kifikie wasomaji wengi zaidi.",
    description: "Jiunge na MaarifaBooks kama muuzaji wa vitabu.",
    action: "Anza kuuza vitabu",
    href: "/wauzaji",
  },
];

type HomeHeroSliderProps = {
  q: string;
  category: string;
};

export function HomeHeroSlider({ q, category }: HomeHeroSliderProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <section className="home-hero" aria-label="Matangazo ya MaarifaBooks">
      <div className="hero-slider" aria-live="polite" aria-atomic="true">
        <div className="hero-slide" key={active}>
          <p className="home-kicker">{slide.eyebrow}</p>
          <h1>{slide.title}</h1>
          <p className="home-intro">{slide.description}</p>
          <Link className="hero-slide-action" href={slide.href}>
            {slide.action} <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="hero-slider-controls" aria-label="Chagua tangazo">
          {slides.map((item, index) => (
            <button
              aria-label={`Tangazo ${index + 1}: ${item.eyebrow}`}
              aria-current={active === index ? "true" : undefined}
              className={active === index ? "hero-slider-dot active" : "hero-slider-dot"}
              key={item.eyebrow}
              onClick={() => setActive(index)}
              type="button"
            />
          ))}
        </div>
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
