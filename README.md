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
- Maombi ya wauzaji yenye namba ya WhatsApp na masharti ya muuzaji
- Fomu ya kuwasilisha metadata ya kitabu kwa ukaguzi
- Vitabu vya bure na vya kulipia; kitabu cha kulipia kinahitaji sampuli ya bure (angalau sura moja)
- Oda za vitabu vya kulipia huenda moja kwa moja kwa muuzaji kupitia WhatsApp
- Coupon za matumizi mara moja zinazotengenezwa na muuzaji baada ya kuthibitisha malipo
- Faili kamili za vitabu vya kulipia hulindwa mpaka mnunuzi atumie coupon halali
- Admin dashboard: kuidhinisha/kukataa wauzaji na vitabu
- Ulinzi wa admin kupitia role ya database na RLS
- Lugha: Kiswahili na Kiingereza
- Miundo: PDF, EPUB na Audiobook

## Kanuni za biashara
- Admin ndiye anayeidhinisha wauzaji na vitabu.
- Muuzaji anapata 100% ya mapato yake kwa sasa; hakuna commission.
- Idhini ya matangazo (email/SMS/WhatsApp) lazima iwe hiari na tofauti na usajili.
- Kampeni za email kwa wauzaji zitatumwa tu kwa waliochagua kuruhusu email marketing.
- Malipo hayapiti kwenye MaarifaBooks: mnunuzi hulipa muuzaji moja kwa moja kupitia maelekezo ya WhatsApp; muuzaji ndiye anayethibitisha malipo na kutoa coupon.

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
- Kuweka akaunti ya kwanza ya admin kwa kutumia `docs/admin-bootstrap.sql`
- Private Storage buckets, upload ya PDF/EPUB/audio na cover
- Signed download links baada ya malipo kuthibitishwa
- Checkout na integration ya Selcom, ikiwa credentials na payout model vitathibitishwa
- Notifications kupitia Brevo/eHub SMS
- Tests, rate limits, error handling na deployment ya Vercel

Hii ni msingi wa MVP unaoendelea kujengwa, si mfumo kamili wa production.
