# MaarifaBooks email confirmation template

## Subject
Karibu MaarifaBooks — thibitisha barua pepe yako

## Template
Use the HTML in `confirmation.html` as the Supabase **Confirm signup** template.

## Hosted Supabase setup (when an SMTP provider is ready)
1. In Authentication → URL Configuration, set the Site URL to:
   `https://maarifabooks.vercel.app`
2. Add this exact Redirect URL:
   `https://maarifabooks.vercel.app/auth/callback`
3. In Authentication → Providers → Email, make sure email confirmations are enabled.
4. In Authentication → SMTP Settings, configure the chosen custom SMTP provider.
5. In Authentication → Email Templates → Confirm signup, paste the subject and HTML above.
6. Send a test signup and verify that the confirmation link returns to MaarifaBooks.

## Important
- The app's signup action sends the confirmation link to `/auth/callback`; the callback exchanges Supabase's PKCE code for a session.
- Email verification is separate from seller approval. A verified seller application must still be reviewed by an administrator.
- This HTML file is stored in GitHub as the source template; it does not automatically change the hosted Supabase Dashboard template.
- The current Supabase project is on the Free plan. New Free projects using Supabase's default SMTP cannot customize auth email templates, and the default email provider is restricted for production use. A custom SMTP provider is required for branded email delivery to sellers.
- Do not put SMTP passwords or provider API keys in this repository. Add them only in the Supabase Dashboard's SMTP settings.
