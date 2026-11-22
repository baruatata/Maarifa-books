import Link from "next/link";
import { guideSections } from "./guide-content";
import "./mafunzo.css";

export const metadata = {
  title: "Kituo cha Mafunzo | MaarifaBooks",
  description: "Mwongozo wa kutumia MaarifaBooks kwa wanunuzi na wauzaji.",
};

export default function MafunzoPage() {
  return (
    <main className="training-page">
      <section className="training-hero">
        <p className="training-eyebrow">MAARIFABOOKS</p>
        <h1>Kituo cha Mafunzo</h1>
        <p>Jifunze kutumia MaarifaBooks hatua kwa hatua — kama mnunuzi au muuzaji.</p>
        <a className="training-download" href="/mafunzo/pdf">Pakua Mwongozo wa PDF <span aria-hidden="true">↓</span></a>
      </section>

      <nav className="training-shortcuts" aria-label="Sehemu za mafunzo">
        <a href="#mnunuzi">Kwa wanunuzi</a>
        <a href="#muuzaji">Kwa wauzaji</a>
        <a href="#usalama">Usalama</a>
      </nav>

      <section className="training-intro">
        <div>
          <span className="training-icon" aria-hidden="true">📖</span>
          <h2>Karibu kwenye mwongozo</h2>
          <p>Fuata maelekezo hapa chini. Unaweza kusoma mwongozo huu mtandaoni au kupakua nakala ya PDF ili uitumie baadaye.</p>
        </div>
        <div className="training-quicklinks">
          <Link href="/ingia">Ingia / Jisajili</Link>
          <Link href="/wauzaji">Omba kuwa muuzaji</Link>
          <Link href="/">Chunguza vitabu</Link>
        </div>
      </section>

      <div className="training-content">
        {guideSections.map((section) => {
          const id = section.title === "2. Mwongozo kwa mnunuzi" ? "mnunuzi" : section.title === "3. Mwongozo kwa muuzaji" ? "muuzaji" : section.title === "4. Usalama na uwajibikaji" ? "usalama" : undefined;
          return (
            <article className="training-card" key={section.title} id={id}>
              <h2>{section.title}</h2>
              {section.intro && <p>{section.intro}</p>}
              {section.steps && (
                <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              )}
              {section.note && <p className="training-note">{section.note}</p>}
            </article>
          );
        })}
      </div>

      <section className="training-end">
        <h2>Uko tayari kuanza?</h2>
        <p>Chunguza maktaba, tafuta kitabu unachokipenda au tuma ombi la kujiunga kama muuzaji.</p>
        <div>
          <Link href="/">Chunguza vitabu</Link>
          <Link href="/wauzaji">Uza vitabu vyako</Link>
        </div>
      </section>
    </main>
  );
}