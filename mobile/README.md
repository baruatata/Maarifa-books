# MaarifaBooks Mobile App

Mradi wa Android na iOS unaotumia Expo React Native. App imewekwa ndani ya repository ileile, kwenye folda mobile/; tovuti ya Next.js haibadilishwi.

## Muundo wa sasa
- Expo Router kwa urambazaji.
- Supabase client yenye session persistence kwenye kifaa.
- Supabase PostgreSQL kwa orodha ya vitabu vilivyoidhinishwa.
- Kuingia kwa barua pepe/nenosiri na usajili kupitia Supabase Auth.
- Kuingia kwa simu kwa OTP kupitia usanidi wa SMS wa Supabase uliopo.
- Ukurasa wa akaunti, taarifa za mtumiaji na kutoka kwenye akaunti.
- Muonekano wa mwanzo wa navy, gold na white.
- Kiswahili kama lugha ya mwanzo.

## Kuanzisha
Mahitaji: Node.js LTS inayoungwa mkono na Expo SDK 54, pamoja na Expo Go au development build.
1. Nenda kwenye folda mobile/.
2. Endesha npm install.
3. Nakili .env.example kuwa .env.
4. Weka Supabase project URL na publishable key ileile inayotumiwa na tovuti.
5. Endesha npm run start.

Usitumie Supabase secret/service-role key ndani ya App.

## Usalama na biashara
- App inatumia Supabase project ileile na RLS iliyopo.
- Hakuna schema, table, bucket, au data ya Production inayobadilishwa na msingi huu.
- Malipo yanaendelea kwenda moja kwa moja kwa muuzaji.
- OTP, coupon, na ruhusa za kusoma vitabu zitatumia sheria zilizopo za backend.
- API secrets zibaki server-side.

## Hali ya utekelezaji
Msingi wa App, orodha ya vitabu, kuingia/kusajili na OTP, na ukurasa wa akaunti vimeongezwa kwenye branch ya maendeleo. Vipengele vya utafutaji, maelezo ya kitabu, ombi la coupon, maktaba, PDF/EPUB reader, audiobook player na push notifications bado vinahitaji kuunganishwa na kupimwa kabla ya toleo la mwisho.

App haijaunganishwa kwenye Production wala kuchapishwa Play Store/App Store. Kabla ya hatua hizo, lazima zipite typecheck, Expo validation, majaribio ya Android/iOS na ukaguzi wa mtiririko wa akaunti/SMS kwenye mazingira halisi.