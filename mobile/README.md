# MaarifaBooks Mobile App

Mradi wa Android na iOS unaotumia Expo React Native. App iko ndani ya repository ileile kwenye folda `mobile/`; tovuti ya Next.js inaendelea kubaki kama ilivyo.

## Vipengele vilivyowekwa kwenye branch ya maendeleo
- Expo Router na muonekano wa Kiswahili.
- Orodha ya vitabu vilivyoidhinishwa, utafutaji kwa jina/mwandishi na katalogi.
- Supabase Auth: barua pepe/nenosiri na mtiririko wa simu wa OTP.
- Akaunti, maelezo ya kitabu, maktaba na ombi la coupon.
- Kisomaji cha PDF na EPUB chenye signed URLs kulingana na ruhusa za kitabu.
- Kicheza audiobook chenye pause/resume, kuruka sekunde 15/30, kasi tofauti na kuhifadhi maendeleo kwenye kifaa.

## Mahitaji na kuanzisha
Mahitaji: Node.js 20 LTS, Expo SDK 54 na development build. PDF, EPUB na audio hutegemea native modules; Expo Go pekee haitoshi kwa majaribio ya vipengele vyote.

1. Fungua folda `mobile/`.
2. Endesha `npm install`.
3. Nakili `.env.example` kuwa `.env`.
4. Weka Supabase project URL na publishable key ya MaarifaBooks.
5. Endesha `npm run start` kwa kuanzisha Expo.
6. Kwa majaribio ya kifaa, tengeneza development build kupitia EAS Build baada ya EAS project kusanidiwa.

Usiweke Supabase secret/service-role key ndani ya App.

## Usalama na biashara
- App inatumia Supabase project ileile na RLS iliyopo.
- Hakuna schema, table, bucket au data ya Production iliyobadilishwa na kazi hii.
- Malipo yanaendelea kwenda moja kwa moja kwa muuzaji.
- Maombi ya coupon na kufungua vitabu hutumia jedwali/RPC na sera za RLS zilizopo.
- PDF/EPUB hutumia signed URL ya sampuli au faili kamili kulingana na entitlement.
- OTP ya simu bado inahitaji kuthibitishwa na mipangilio halisi ya Supabase Auth; hakuna SMS ya E-Hub iliyotumwa wakati wa maendeleo haya.

## Hali na vikwazo vya majaribio
Msingi wa app na vipengele vilivyoorodheshwa vipo kwenye branch `mobile-app-development`. GitHub Actions hukagua utegemezi, TypeScript, Expo config na native prebuild ya Android/iOS.

Bado tunahitaji majaribio kwenye vifaa halisi vya Android na iPhone, kitabu halisi cha EPUB cha majaribio, na kuthibitisha mtiririko wa malipo/coupon na OTP bila kutumia salio la E-Hub. Uendelezaji huu haujaunganishwa na `main`, haujawekwa Production, na app haijachapishwa Play Store/App Store.
