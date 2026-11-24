"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  {
    image: "/ads/maarifabooks-soma.svg",
    alt: "MaarifaBooks: Soma vitabu, panua maarifa. Vitabu vya kidijitali vinavyokupa maarifa popote ulipo.",
    href: "#vitabu",
    label: "Gundua vitabu",
  },
  {
    image: "/ads/maarifabooks-waandishi.svg",
    alt: "MaarifaBooks: Wewe ni mwandishi? Kitabu chako kisomwe. Jiunge kama muuzaji.",
    href: "/wauzaji",
    label: "Jiunge kama muuzaji",
  },
  {
    image: "/ads/maarifabooks-jifunze.svg",
    alt: "MaarifaBooks: Jifunze kila siku, kua kwa kusoma. Maarifa mapya yanaanza na kitabu kimoja.",
    href: "#vitabu",
    label: "Anza kusoma",
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
      <div className="hero-slider">
        <Link
          className="hero-banner-link"
          href={slide.href}
          aria-label={slide.label}
          key={active}
        >
          <Image
            className="hero-banner-image"
            src={slide.image}
            alt={slide.alt}
            width={1600}
            height={560}
            priority={active === 0}
            unoptimized
          />
        </Link>
        <div className="hero-slider-controls" aria-label="Chagua tangazo">
          {slides.map((item, index) => (
            <button
              aria-label={`Tangazo ${index + 1}: ${item.label}`}
              aria-current={active === index ? "true" : undefined}
              className={active === index ? "hero-slider-dot active" : "hero-slider-dot"}
              key={item.image}
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
