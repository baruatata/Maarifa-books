export type GuideSection = {
  title: string;
  intro?: string;
  steps?: string[];
  note?: string;
};

export const guideSections: GuideSection[] = [
  {
    title: "1. Kuhusu MaarifaBooks",
    intro: "MaarifaBooks ni jukwaa la kidijitali linalowaunganisha waandishi, wauzaji wa vitabu na wasomaji. Wasomaji wanaweza kuchunguza vitabu vilivyoidhinishwa, kusoma sampuli na kununua vitabu. Wauzaji wanaweza kuomba kujiunga, kupakia vitabu na kushughulikia maombi ya coupon.",
    note: "Mwongozo huu unaeleza hatua zinazoonekana kwenye toleo la sasa la tovuti. Majina ya vitufe yanaweza kubadilika kadiri mfumo unavyoboreshwa."
  },
  {
    title: "2. Mwongozo kwa mnunuzi",
    intro: "Fungua akaunti au ingia",
    steps: [
      "Bonyeza Jisajili kama huna akaunti, au Ingia ikiwa tayari una akaunti.",
      "Jaza taarifa zinazotakiwa na ukamilishe hatua za uthibitishaji zitakazoonyeshwa.",
      "Baada ya kuingia, unaweza kufungua Dashibodi na huduma za akaunti yako."
    ]
  },
  {
    title: "2.1 Kutafuta kitabu",
    steps: [
      "Fungua https://maarifabooks.vercel.app.",
      "Tumia kisanduku cha utafutaji kwenye ukurasa wa mwanzo kuandika jina la kitabu au mwandishi.",
      "Chagua kitabu ili kufungua ukurasa wake na kusoma maelezo, lugha, aina ya faili na bei."
    ]
  },
  {
    title: "2.2 Kufungua akaunti au kuingia - hatua za ziada",
    intro: "Ikiwa tayari umeingia, endelea na hatua za kutafuta na kuchagua kitabu. Ikiwa bado huna akaunti, kamilisha usajili kwanza."
  },
  {
    title: "2.3 Kununua kitabu cha kulipia",
    steps: [
      "Kwenye ukurasa wa kitabu, kagua bei na taarifa za kitabu.",
      "Bonyeza Wasiliana na muuzaji WhatsApp ili kuomba maelekezo ya malipo.",
      "Lipa moja kwa moja kwa muuzaji kwa kutumia maelezo atakayokupa. MaarifaBooks haikusanyi malipo ya kitabu.",
      "Hifadhi kumbukumbu au risiti ya muamala."
    ],
    note: "Muuzaji hupokea 100% ya mauzo yake. Hakikisha unalipa kwa muuzaji sahihi."
  },
  {
    title: "2.4 Kuomba coupon baada ya malipo",
    steps: [
      "Rudi kwenye ukurasa wa kitabu ulicholipia.",
      "Kwenye sehemu ya coupon, chagua Sina Coupon. Fomu ya ombi itafunguka.",
      "Jaza jina (si lazima), namba ya simu na kumbukumbu ya malipo, kisha bonyeza Omba Coupon.",
      "Subiri muuzaji akague ombi na athibitishe kupokea malipo."
    ],
    note: "Tuma ombi kwa kitabu husika na tumia namba ya simu unayoweza kupatikana nayo."
  },
  {
    title: "2.5 Kuweka coupon na kusoma kitabu",
    steps: [
      "Baada ya muuzaji kukutumia coupon, fungua tena ukurasa wa kitabu husika.",
      "Chagua Nina Coupon, weka msimbo uliotumwa na bonyeza Fungua kitabu.",
      "Fuata maelekezo ya mfumo ili kufungua kitabu kizima. Unaweza pia kusoma sampuli ya bure pale inapopatikana."
    ],
    note: "Coupon ni ya matumizi ya mnunuzi na kitabu husika. Usishiriki msimbo wako na watu wengine."
  },
  {
    title: "3. Mwongozo kwa muuzaji",
    intro: "Kuomba kujiunga kama muuzaji",
    steps: [
      "Ingia kwenye akaunti yako ya MaarifaBooks. Ikiwa huna akaunti, jisajili kwanza.",
      "Fungua sehemu ya Uza vitabu.",
      "Jaza jina la duka, namba ya WhatsApp ya Tanzania na maelezo ya duka.",
      "Soma na ukubali sheria za muuzaji, kisha bonyeza Tuma ombi.",
      "Subiri timu ya MaarifaBooks ikague na kuidhinisha ombi lako."
    ],
    note: "Dashibodi ya muuzaji hufunguka baada ya ombi lako kuidhinishwa."
  },
  {
    title: "3.1 Kupakia kitabu",
    steps: [
      "Baada ya kuidhinishwa, ingia kwenye Dashibodi ya muuzaji.",
      "Bonyeza Pakia kitabu kipya.",
      "Jaza taarifa za kitabu, bei, maelezo na taarifa nyingine zinazoombwa.",
      "Pakia jalada na faili la kitabu katika miundo inayokubaliwa na mfumo.",
      "Kagua taarifa zako na uwasilishe kitabu. Kitabu kitasubiri ukaguzi na idhini kabla ya kuonekana sokoni."
    ]
  },
  {
    title: "3.2 Kushughulikia mauzo na coupon",
    steps: [
      "Mteja atawasiliana nawe kupitia WhatsApp na kulipa moja kwa moja kwako.",
      "Hakiki kuwa fedha zimeingia kweli kabla ya kuthibitisha kupokea malipo.",
      "Kwenye Dashibodi, angalia sehemu ya Maombi ya coupon na bonyeza Fungua maombi ya coupon.",
      "Kagua taarifa za ombi, kitabu na kumbukumbu ya malipo.",
      "Baada ya kuthibitisha malipo, tengeneza coupon mpya kwa ombi hilo.",
      "Nakili coupon na umtumie mnunuzi husika kupitia mawasiliano yenu."
    ],
    note: "Kila ombi la mnunuzi lifuatiliwe kivyake. Usichanganye maombi au kutuma coupon ya mteja mwingine."
  },
  {
    title: "4. Usalama na uwajibikaji",
    steps: [
      "Usimpe mtu mwingine nenosiri, OTP au taarifa za akaunti yako.",
      "Wanunuzi: hifadhi uthibitisho wa malipo hadi upate kitabu.",
      "Wauzaji: thibitisha fedha zimepokelewa kabla ya kutengeneza coupon.",
      "Tumia coupon kwa kitabu na mnunuzi husika pekee.",
      "Ripoti hitilafu au shughuli unayoihisi kuwa ya udanganyifu kupitia njia rasmi za msaada."
    ]
  },
  {
    title: "5. Msaada",
    intro: "Ikiwa unapata changamoto ya kuingia, kutafuta kitabu, malipo, ombi la coupon, kupakia kitabu au kufungua kitabu, andaa jina la kitabu na maelezo ya tatizo kisha wasiliana na timu ya MaarifaBooks kupitia njia rasmi za mawasiliano zilizopo kwenye tovuti.",
    note: "Usitume nenosiri au OTP unapowasiliana na timu ya msaada."
  }
];