# MaarifaBooks

Marketplace ya vitabu vya kidijitali chini ya Lumbwa Digital.

## Teknolojia
- Next.js App Router + TypeScript
- Supabase Auth + PostgreSQL
- Design responsive: navy blue, gold na white

## Vipengele vilivyowekwa kwenye code
- Homepage ya vitabu vilivyoidhinishwa
- Usajili, kuingia na kutoka kwa Supabase Auth
- Dashibodi ya mtumiaji
- Maombi ya wauzaji
- Fomu ya kuwasilisha metadata ya kitabu kwa ukaguzi
- Lugha: Kiswahili na Kiingereza
- Miundo: PDF, EPUB na Audiobook

## Kanuni za biashara
- Admin ndiye anayeidhinisha wauzaji na vitabu.
- Muuzaji anapata 100% ya mapato yake kwa sasa; hakuna commission.
- Idhini ya matangazo (email/SMS/WhatsApp) lazima iwe hiari na tofauti na usajili.
- Malipo ya simu na uthibitishaji wa malipo havijawashwa bado.

## Kuendesha ndani ya kompyuta
1. Tumia Node.js 20.9 au mpya zaidi.
2. Endesha `npm install`.
3. Nakili `.env.example` kuwa `.env.local`.
4. Weka Supabase publishable key kwenye `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Endesha `npm run dev`.

Project ya Supabase: `qsbyvztxrlnpujjakrfh` (region: eu-west-1).
URL: https://qsbyvztxrlnpujjakrfh.supabase.co

## Muhimu kuhusu usalama
Usiweke Supabase secret/service-role key kwenye GitHub wala variable yenye `NEXT_PUBLIC_`. Tumia publishable key kwenye browser/server client na RLS kulinda data.

## Kazi zilizobaki kabla ya production
- Admin dashboard na utaratibu salama wa kuweka admin wa kwanza
- Private Storage buckets, upload ya PDF/EPUB/audio na cover
- Signed download links baada ya malipo kuthibitishwa
- Checkout na integration ya Selcom, ikiwa credentials na payout model vitathibitishwa
- Notifications kupitia Brevo/eHub SMS
- Tests, rate limits, error handling na deployment ya Vercel

Hii ni msingi wa MVP unaoendelea kujengwa, si mfumo kamili wa production.
