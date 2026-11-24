# MaarifaBooks Mobile App

Mradi wa Android na iOS unaotumia Expo React Native. App imewekwa ndani ya repository ileile, kwenye folda mobile/; tovuti ya Next.js haibadilishwi.

## Muundo wa sasa
- Expo Router kwa urambazaji.
- Supabase client yenye session persistence kwenye kifaa.
- Supabase PostgreSQL kwa orodha ya vitabu vilivyoidhinishwa.
- Kuingia kwa barua pepe/nenosiri na usajili kupitia Supabase Auth.
- Kuingia kwa simu kwa OTP kumewekwa kama mtiririko wa Supabase Auth; ulinganifu na E-Hub ya tovuti bado unahitaji kuhakikiwa kabla ya Production.
- Ukurasa wa akaunti, taarifa za mtumiaji na kutoka kwenye akaunti.
- Muonekano wa mwanzo wa navy, gold na white.
- Kiswahili kama lugha ya mwanzo.

## Kuanzisha
Mahitaji: Node.js LTS inayoungwa mkono na Expo SDK 54 na Expo development build. PDF reader inatumia native code; haitafanya kazi ndani ya Expo Go.
1. Nenda kwenye folda mobile/.
2. Endesha npm install.
3. Nakili .env.example kuwa .env.
4. Weka Supabase project URL na publishable key ileile inayotumiwa na tovuti.
5. Endesha npm install na kisha npm run start.\n6. Kwa PDF reader, tengeneza development build mpya baada ya kusakinisha dependencies za native PDF; tumia EAS Build au expo prebuild kulingana na mazingira ya ujenzi.

Usitumie Supabase secret/service-role key ndani ya App.

## Usalama na biashara
- App inatumia Supabase project ileile na RLS iliyopo.
- Hakuna schema, table, bucket, au data ya Production inayobadilishwa na msingi huu.
- Malipo yanaendelea kwenda moja kwa moja kwa muuzaji.
- Maombi ya coupon na kufungua vitabu vinatumia jedwali/RPC zilizopo na RLS; uthibitisho wa mwisho wa mtiririko unahitaji majaribio ya akaunti halisi.\n- PDF reader hutengeneza signed URL kwa faili la sampuli au faili kamili kulingana na ruhusa za mnunuzi.
- API secrets zibaki server-side.

## Hali ya utekelezaji
Msingi wa App, orodha ya vitabu, akaunti, maelezo ya kitabu, ombi la coupon, maktaba, PDF reader ya ndani ya App na audiobook player vimeongezwa kwenye branch ya maendeleo. EPUB reader, utafutaji kamili, uthibitisho wa E-Hub OTP, push notifications na majaribio ya vifaa halisi bado havijakamilika.

App haijaunganishwa kwenye Production wala kuchapishwa Play Store/App Store. Kabla ya hatua hizo, lazima zipite typecheck, Expo validation, majaribio ya Android/iOS na ukaguzi wa mtiririko wa akaunti/SMS kwenye mazingira halisi.