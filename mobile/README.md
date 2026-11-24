# MaarifaBooks Mobile App

Mradi wa Android na iOS unaotumia Expo React Native. App imewekwa ndani ya repository ileile, kwenye folda mobile/; tovuti ya Next.js haibadilishwi.

## Muundo wa sasa
- Expo Router kwa urambazaji.
- Supabase client yenye session persistence kwenye kifaa.
- Supabase PostgreSQL kwa orodha ya vitabu vilivyoidhinishwa.
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

## Hatua zinazofuata
1. Kuingia/kusajili kwa njia zilezile za Supabase Auth.
2. Utafutaji, ukurasa wa kitabu na mtiririko wa coupon.
3. Maktaba ya mnunuzi na ruhusa za kitabu.
4. PDF/EPUB reader na audiobook player.
5. Push notifications.
6. Majaribio ya vifaa halisi na builds za Android/iOS.

Huu ni msingi wa maendeleo (scaffold), si toleo la App lililo tayari kuchapishwa. Kabla ya kuunganisha au kusambaza, endesha typecheck, Expo validation na majaribio ya Android/iOS.