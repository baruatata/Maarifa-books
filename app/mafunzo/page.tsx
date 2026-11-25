"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function MafunzoPage() {
  const { en } = useLanguage();
  const t = (sw: string, english: string) => en ? english : sw;
  return (
    <main className="page training-page">
      <p className="eyebrow">{t("MAARIFABOOKS · KITUO CHA MAFUNZO","MAARIFABOOKS · HELP & GUIDES")}</p>
      <h1>{t("Mwongozo wa matumizi ya MaarifaBooks","MaarifaBooks user guide")}</h1>
      <p className="lead">{t("Jifunze kutumia jukwaa kama mnunuzi au muuzaji. Mwongozo huu unaeleza hatua za msingi kwa lugha rahisi.","Learn how to use the platform as a buyer or seller. This guide explains the essential steps in simple language.")}</p>

      <section className="panel" style={{ padding: 24, margin: "22px 0" }}>
        <h2>{t("Kwa wanunuzi","For buyers")}</h2>
        <p><strong>{t("Huhitaji kujisajili ili kutafuta au kununua kitabu.","You do not need an account to browse or buy a book.")}</strong> {t("Unaweza kuvinjari vitabu na kusoma sampuli bila kufungua akaunti.","You can browse books and read previews without creating an account.")}</p>
        <ol>
          <li>{t("Fungua ukurasa wa","Open the")} <Link href="/#vitabu">{t("Vitabu","Books")}</Link> {t("na tafuta kitabu kwa jina au mwandishi.","page and search by book title or author.")}</li>
          <li>{t("Chagua kitabu ili kuona maelezo, bei na sampuli ya bure inapopatikana.","Select a book to view its details, price and free preview when available.")}</li>
          <li>{t("Kwa kitabu cha malipo, bonyeza kitufe cha WhatsApp ili kuwasiliana na muuzaji.","For a paid book, use the WhatsApp button to contact the seller.")}</li>
          <li>{t("Lipa moja kwa moja kwa muuzaji kwa kufuata maelekezo yake. Hakikisha umepokea uthibitisho wa malipo.","Pay the seller directly using their instructions. Make sure you receive payment confirmation.")}</li>
          <li>{t("Rudi kwenye ukurasa wa kitabu, chagua","Return to the book page, select")} <strong>{t("Sina Coupon","I don't have a coupon")}</strong>, {t("kisha tuma ombi la coupon. Weka namba yako ya simu na kumbukumbu ya muamala. Jina ni hiari.","then submit a coupon request. Enter your phone number and transaction reference. Your name is optional.")}</li>
          <li>{t("Muuzaji akishathibitisha malipo, atakutumia coupon. Chagua","After the seller confirms payment, they will send you a coupon. Select")} <strong>{t("Nina Coupon","I have a coupon")}</strong> {t("na ufuate maelekezo ya kuingiza msimbo.","and follow the instructions to enter the code.")}</li>
        </ol>
        <p className="muted">{t("Ombi la coupon linaweza kutumwa bila akaunti. Tumia namba sahihi ya simu na kumbukumbu ya muamala ili muuzaji aweze kulifuatilia.","You can request a coupon without an account. Use the correct phone number and transaction reference so the seller can track your request.")}</p>
      </section>

      <section className="panel" style={{ padding: 24, margin: "22px 0" }}>
        <h2>{t("Kwa wauzaji","For sellers")}</h2>
        <p>{t("Wauzaji wanahitaji akaunti ili kuwasilisha ombi la kujiunga na kutumia dashibodi.","Sellers need an account to apply and use the seller dashboard.")}</p>
        <ol>
          <li>{t("Fungua ukurasa wa","Open the")} <Link href="/wauzaji">{t("Uza vitabu","Sell books")}</Link> {t("na uingie au jisajili.","page and sign in or register.")}</li>
          <li>{t("Jaza jina la duka, namba ya WhatsApp na maelezo ya duka; kubali masharti na utume ombi.","Enter your store name, WhatsApp number and store details; accept the terms and submit your application.")}</li>
          <li>{t("Subiri timu ya MaarifaBooks ikague na kuidhinisha ombi lako.","Wait for the MaarifaBooks team to review and approve your application.")}</li>
          <li>{t("Baada ya kuidhinishwa, ingia kwenye dashibodi na pakia kitabu chako pamoja na taarifa zake.","After approval, open your dashboard and upload your book and its details.")}</li>
          <li>{t("Kitabu kitaonekana sokoni baada ya kuidhinishwa na msimamizi.","Your book will appear in the marketplace after administrator approval.")}</li>
          <li>{t("Mteja akikuwasiliana WhatsApp, mpe maelekezo ya malipo. Thibitisha fedha zimeingia kabla ya kutuma coupon.","When a customer contacts you on WhatsApp, provide payment instructions. Confirm that the money has arrived before issuing a coupon.")}</li>
          <li>{t("Fuatilia maombi ya coupon kwenye dashibodi, tengeneza coupon ya ombi husika na umtumie mnunuzi.","Track coupon requests in your dashboard, create a coupon for the relevant request and send it to the buyer.")}</li>
        </ol>
        <p className="muted">{t("Kwa utaratibu wa sasa, muuzaji hupokea 100% ya mauzo yake; malipo ya kitabu hufanyika moja kwa moja kati ya mnunuzi na muuzaji.","Under the current arrangement, sellers receive 100% of their sales. Book payments are made directly between the buyer and seller.")}</p>
      </section>

      <section className="panel" style={{ padding: 24, margin: "22px 0" }}>
        <h2>{t("Jinsi ya kutumia Audiobook","How to use audiobooks")}</h2>
        <p>{t("Audiobook ni kitabu cha kusikiliza. Vitabu vinavyopatikana kwa mfumo huu vinaweza kuwa na sura kadhaa za sauti.","An audiobook is a book you can listen to. Available audiobooks may contain several audio chapters.")}</p>
        <h3>{t("Kwa wasomaji: kusikiliza kitabu","For readers: listening to a book")}</h3>
        <ol>
          <li>{t("Fungua kitabu chenye aina ya","Open a book marked as")} <strong>Audiobook</strong> {t("kwenye ukurasa wa vitabu.","on the books page.")}</li>
          <li>{t("Bonyeza","Select")} <strong>{t("Soma / Sikiliza kitabu","Read / Listen to book")}</strong> {t("au","or")} <strong>{t("Soma sampuli ya bure","Listen to free preview")}</strong> {t("ikiwa kitabu ni cha malipo.","if the book is paid.")}</li>
          <li>{t("Chagua sura unayotaka kusikiliza kwenye sehemu ya","Choose the chapter you want to hear from the")} <strong>{t("Orodha ya sura","Chapter list")}</strong>.</li>
          <li>{t("Tumia vidhibiti vya sauti vya kifaa chako kubonyeza Play, Pause au kuendelea kusikiliza.","Use the audio controls on your device to Play, Pause or resume listening.")}</li>
          <li>{t("Ukitaka kubadilisha kasi, fungua sehemu ya","To change the speed, open")} <strong>{t("Kasi ya usomaji","Playback speed")}</strong> {t("na uchague 0.75×, 1×, 1.25×, 1.5×, 1.75× au 2×.","and select 0.75×, 1×, 1.25×, 1.5×, 1.75× or 2×.")}</li>
          <li>{t("Tumia vitufe vya","Use the")} <strong>{t("Sura iliyotangulia","Previous chapter")}</strong> {t("na","and")} <strong>{t("Sura inayofuata","Next chapter")}</strong> {t("kubadilisha sura. Sauti pia inaweza kuendelea yenyewe hadi sura inayofuata inapomalizika.","buttons to change chapters. Audio may also continue automatically to the next chapter.")}</li>
        </ol>
        <p className="muted">{t("Mfumo huhifadhi maendeleo ya usikilizaji kwenye kifaa unachotumia. Ukirudi kusikiliza kwenye kifaa hicho, utaweza kuendelea karibu na sehemu uliyofikia. Maendeleo haya hayahamishwi moja kwa moja kati ya vifaa tofauti.","Your listening progress is saved on the device you use. When you return on that device, you can continue near where you stopped. Progress does not automatically sync between different devices.")}</p>
        <h3>{t("Kwa wauzaji: kupakia audiobook mpya","For sellers: uploading a new audiobook")}</h3>
        <ol>
          <li>{t("Ingia kwenye dashibodi ya muuzaji aliyeidhinishwa na uchague sehemu ya kupakia kitabu.","Sign in to your approved seller dashboard and open the book upload section.")}</li>
          <li>{t("Chagua muundo wa","Select the")} <strong>Audiobook</strong>, {t("kisha jaza jina, mwandishi, maelezo, kategoria, lugha na bei.","then enter the title, author, description, category, language and price.")}</li>
          <li>{t("Pakia jalada la kitabu katika muundo wa JPG, PNG au WebP; lisizidi MB 8.","Upload the book cover in JPG, PNG or WebP format; maximum size is 8 MB.")}</li>
          <li>{t("Katika sehemu ya","In the")} <strong>{t("Sura za audiobook","Audiobook chapters")}</strong>, {t("weka jina la kila sura na faili lake la sauti. Faili lazima liwe MP3 au M4A na lisizidi MB 100 kwa kila sura.","enter each chapter title and its audio file. Files must be MP3 or M4A and no larger than 100 MB per chapter.")}</li>
          <li>{t("Tumia","Use")} <strong>{t("+ Ongeza sura","+ Add chapter")}</strong> {t("kuongeza sura nyingine. Unaweza kuweka hadi sura 100.","to add another chapter. You can add up to 100 chapters.")}</li>
          <li>{t("Chagua","Select")} <strong>{t("Ruhusu sura hii kuwa sampuli ya bure","Make this chapter a free preview")}</strong> {t("kwa sura unayotaka wasomaji waisikilize bila malipo. Kwa audiobook ya kulipia, weka angalau sura moja ya sampuli ya bure.","for any chapter you want readers to hear for free. Paid audiobooks must have at least one free preview chapter.")}</li>
          <li>{t("Bonyeza","Select")} <strong>{t("Wasilisha audiobook kwa ukaguzi","Submit audiobook for review")}</strong>. {t("Audiobook itaonekana sokoni baada ya Admin kuikagua na kuiidhinisha.","The audiobook will appear in the marketplace after administrator review and approval.")}</li>
        </ol>
        <h3>{t("Kwa wauzaji: kusimamia sura zilizopo","For sellers: managing existing chapters")}</h3>
        <ol>
          <li>{t("Fungua dashibodi, chagua kitabu husika kisha bonyeza","Open your dashboard, select the relevant book and choose")} <strong>{t("Hariri kitabu","Edit book")}</strong>.</li>
          <li>{t("Sehemu ya","The")} <strong>{t("Simamia sura za audiobook","Manage audiobook chapters")}</strong> {t("itakuwezesha kubadilisha jina la sura, kubadilisha faili la sauti (kwa hiari), au kubadilisha hali ya sampuli ya bure.","lets you change a chapter title, optionally replace its audio file, or change its free-preview setting.")}</li>
          <li>{t("Bonyeza","Select")} <strong>{t("Hifadhi sura hii","Save this chapter")}</strong> {t("kuhifadhi mabadiliko ya sura hiyo.","to save that chapter's changes.")}</li>
          <li>{t("Unaweza pia kutumia sehemu ya","You can also use")} <strong>{t("Ongeza sura nyingine","Add another chapter")}</strong> {t("kuongeza sauti na jina la sura mpya.","to add a new chapter title and audio file.")}</li>
        </ol>
        <p className="muted">{t("Mabadiliko ya audiobook hurudishwa kwa Admin kwa ukaguzi na idhini kabla ya kuonekana tena kwa wateja. Sura nyingine hazibadilishwi unapohariri sura moja.","Audiobook changes are sent back to the administrator for review and approval before becoming visible to customers. Editing one chapter does not change the others.")}</p>
      </section>

      <section className="panel" style={{ padding: 24, margin: "22px 0" }}>
        <h2>{t("Mambo ya kuzingatia","Important reminders")}</h2>
        <ul>
          <li>{t("Usitume coupon kabla hujathibitisha malipo.","Do not issue a coupon before confirming payment.")}</li>
          <li>{t("Usimpe mtu mwingine coupon iliyotumwa kwa mnunuzi husika.","Do not give another person a coupon issued to a specific buyer.")}</li>
          <li>{t("Hifadhi kumbukumbu ya muamala hadi kitabu kifunguke.","Keep the transaction reference until the book opens successfully.")}</li>
          <li>{t("Wasiliana na msaada wa MaarifaBooks ukikwama.","Contact MaarifaBooks support if you need help.")}</li>
        </ul>
      </section>
      <p><Link href="/#vitabu">{t("← Rudi kwenye vitabu","← Back to books")}</Link></p>
    </main>
  );
}
