"use client";

import Link from "next/link";

export default function MafunzoPage() {
  return (
    <main className="page training-page">
      <p className="eyebrow">MAARIFABOOKS · KITUO CHA MAFUNZO</p>
      <h1>Mwongozo wa matumizi ya MaarifaBooks</h1>
      <p className="lead">Jifunze kutumia jukwaa kama mnunuzi au muuzaji. Mwongozo huu unaeleza hatua za msingi kwa lugha rahisi.</p>

      <section className="panel" style={{ padding: 24, margin: "22px 0" }}>
        <h2>Kwa wanunuzi</h2>
        <p><strong>Huhitaji kujisajili ili kutafuta au kununua kitabu.</strong> Unaweza kuvinjari vitabu na kusoma sampuli bila kufungua akaunti.</p>
        <ol>
          <li>Fungua ukurasa wa <Link href="/#vitabu">Vitabu</Link> na tafuta kitabu kwa jina au mwandishi.</li>
          <li>Chagua kitabu ili kuona maelezo, bei na sampuli ya bure inapopatikana.</li>
          <li>Kwa kitabu cha malipo, bonyeza kitufe cha WhatsApp ili kuwasiliana na muuzaji.</li>
          <li>Lipa moja kwa moja kwa muuzaji kwa kufuata maelekezo yake. Hakikisha umepokea uthibitisho wa malipo.</li>
          <li>Rudi kwenye ukurasa wa kitabu, chagua <strong>Sina Coupon</strong>, kisha tuma ombi la coupon. Weka namba yako ya simu na kumbukumbu ya muamala. Jina ni hiari.</li>
          <li>Muuzaji akishathibitisha malipo, atakutumia coupon. Chagua <strong>Nina Coupon</strong> na ufuate maelekezo ya kuingiza msimbo.</li>
        </ol>
        <p className="muted">Ombi la coupon linaweza kutumwa bila akaunti. Tumia namba sahihi ya simu na kumbukumbu ya muamala ili muuzaji aweze kulifuatilia.</p>
      </section>

      <section className="panel" style={{ padding: 24, margin: "22px 0" }}>
        <h2>Kwa wauzaji</h2>
        <p>Wauzaji wanahitaji akaunti ili kuwasilisha ombi la kujiunga na kutumia dashibodi.</p>
        <ol>
          <li>Fungua ukurasa wa <Link href="/wauzaji">Uza vitabu</Link> na uingie au jisajili.</li>
          <li>Jaza jina la duka, namba ya WhatsApp na maelezo ya duka; kubali masharti na utume ombi.</li>
          <li>Subiri timu ya MaarifaBooks ikague na kuidhinisha ombi lako.</li>
          <li>Baada ya kuidhinishwa, ingia kwenye dashibodi na pakia kitabu chako pamoja na taarifa zake.</li>
          <li>Kitabu kitaonekana sokoni baada ya kuidhinishwa na msimamizi.</li>
          <li>Mteja akikuwasiliana WhatsApp, mpe maelekezo ya malipo. Thibitisha fedha zimeingia kabla ya kutuma coupon.</li>
          <li>Fuatilia maombi ya coupon kwenye dashibodi, tengeneza coupon ya ombi husika na umtumie mnunuzi.</li>
        </ol>
        <p className="muted">Kwa utaratibu wa sasa, muuzaji hupokea 100% ya mauzo yake; malipo ya kitabu hufanyika moja kwa moja kati ya mnunuzi na muuzaji.</p>
      </section>

      <section className="panel" style={{ padding: 24, margin: "22px 0" }}>
        <h2>Mambo ya kuzingatia</h2>
        <ul>
          <li>Usitume coupon kabla hujathibitisha malipo.</li>
          <li>Usimpe mtu mwingine coupon iliyotumwa kwa mnunuzi husika.</li>
          <li>Hifadhi kumbukumbu ya muamala hadi kitabu kifunguke.</li>
          <li>Wasiliana na msaada wa MaarifaBooks ukikwama.</li>
        </ul>
      </section>
      <p><Link href="/#vitabu">← Rudi kwenye vitabu</Link></p>
    </main>
  );
}
