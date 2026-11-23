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
        <h2>Jinsi ya kutumia Audiobook</h2>
        <p>Audiobook ni kitabu cha kusikiliza. Vitabu vinavyopatikana kwa mfumo huu vinaweza kuwa na sura kadhaa za sauti.</p>

        <h3>Kwa wasomaji: kusikiliza kitabu</h3>
        <ol>
          <li>Fungua kitabu chenye aina ya <strong>Audiobook</strong> kwenye ukurasa wa vitabu.</li>
          <li>Bonyeza <strong>Soma / Sikiliza kitabu</strong> au <strong>Soma sampuli ya bure</strong> ikiwa kitabu ni cha malipo.</li>
          <li>Chagua sura unayotaka kusikiliza kwenye sehemu ya <strong>Orodha ya sura</strong>.</li>
          <li>Tumia vidhibiti vya sauti vya kifaa chako kubonyeza Play, Pause au kuendelea kusikiliza.</li>
          <li>Ukitaka kubadilisha kasi, fungua sehemu ya <strong>Kasi ya usomaji</strong> na uchague 0.75×, 1×, 1.25×, 1.5×, 1.75× au 2×.</li>
          <li>Tumia vitufe vya <strong>Sura iliyotangulia</strong> na <strong>Sura inayofuata</strong> kubadilisha sura. Sauti pia inaweza kuendelea yenyewe hadi sura inayofuata inapomalizika.</li>
        </ol>
        <p className="muted">Mfumo huhifadhi maendeleo ya usikilizaji kwenye kifaa unachotumia. Ukirudi kusikiliza kwenye kifaa hicho, utaweza kuendelea karibu na sehemu uliyofikia. Maendeleo haya hayahamishwi moja kwa moja kati ya vifaa tofauti.</p>

        <h3>Kwa wauzaji: kupakia audiobook mpya</h3>
        <ol>
          <li>Ingia kwenye dashibodi ya muuzaji aliyeidhinishwa na uchague sehemu ya kupakia kitabu.</li>
          <li>Chagua muundo wa <strong>Audiobook</strong>, kisha jaza jina, mwandishi, maelezo, kategoria, lugha na bei.</li>
          <li>Pakia jalada la kitabu katika muundo wa JPG, PNG au WebP; lisizidi MB 8.</li>
          <li>Katika sehemu ya <strong>Sura za audiobook</strong>, weka jina la kila sura na faili lake la sauti. Faili lazima liwe MP3 au M4A na lisizidi MB 100 kwa kila sura.</li>
          <li>Tumia <strong>+ Ongeza sura</strong> kuongeza sura nyingine. Unaweza kuweka hadi sura 100.</li>
          <li>Chagua <strong>Ruhusu sura hii kuwa sampuli ya bure</strong> kwa sura unayotaka wasomaji waisikilize bila malipo. Kwa audiobook ya kulipia, weka angalau sura moja ya sampuli ya bure.</li>
          <li>Bonyeza <strong>Wasilisha audiobook kwa ukaguzi</strong>. Audiobook itaonekana sokoni baada ya Admin kuikagua na kuiidhinisha.</li>
        </ol>

        <h3>Kwa wauzaji: kusimamia sura zilizopo</h3>
        <ol>
          <li>Fungua dashibodi, chagua kitabu husika kisha bonyeza <strong>Hariri kitabu</strong>.</li>
          <li>Sehemu ya <strong>Simamia sura za audiobook</strong> itakuwezesha kubadilisha jina la sura, kubadilisha faili la sauti (kwa hiari), au kubadilisha hali ya sampuli ya bure.</li>
          <li>Bonyeza <strong>Hifadhi sura hii</strong> kuhifadhi mabadiliko ya sura hiyo.</li>
          <li>Unaweza pia kutumia sehemu ya <strong>Ongeza sura nyingine</strong> kuongeza sauti na jina la sura mpya.</li>
        </ol>
        <p className="muted">Mabadiliko ya audiobook hurudishwa kwa Admin kwa ukaguzi na idhini kabla ya kuonekana tena kwa wateja. Sura nyingine hazibadilishwi unapohariri sura moja.</p>
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
