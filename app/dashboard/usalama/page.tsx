import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SellerPhoneOtp } from "@/components/seller-phone-otp";
import { LanguageText } from "@/components/language-provider";

export default async function AccountSecurityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");

  const [{ data: profile }, { data: application }] = await Promise.all([
    supabase.from("profiles").select("phone,phone_verified_at,role").eq("id", user.id).maybeSingle(),
    supabase.from("seller_applications").select("phone_number,phone_verified_at,status").eq("user_id", user.id).maybeSingle(),
  ]);

  const savedPhone = application?.phone_number || profile?.phone || "";
  const isSeller = Boolean(application);
  const isVerified = Boolean(application?.phone_verified_at || (profile?.phone_verified_at && profile?.phone === savedPhone));

  return <main className="page">
    <p className="eyebrow">MAARIFABOOKS</p>
    <h1><LanguageText sw="Usalama wa akaunti" en="Account security" /></h1>
    <p className="muted"><LanguageText sw="Linda akaunti yako kwa nenosiri imara na usimshirikishe mtu mwingine. Kwa akaunti ya muuzaji, thibitisha pia namba ya simu iliyosajiliwa kwa OTP." en="Protect your account with a strong password and never share it. Seller accounts must also verify their registered phone number using OTP." /></p>

    {isSeller ? (
      <section className="panel" style={{ padding: 20, marginTop: 24 }}>
        <h2><LanguageText sw="Uthibitisho wa namba ya simu" en="Phone number verification" /></h2>
        <p className="muted"><LanguageText sw="Tutatumia namba iliyopo kwenye taarifa za duka lako. Huwezi kubadilisha namba hapa; hii inalinda akaunti yako dhidi ya kuthibitisha namba ya mtu mwingine." en="We will use the number saved in your store details. You cannot change it here; this protects your account from verifying someone else’s number." /></p>
        <SellerPhoneOtp phone={savedPhone} verified={isVerified} />
      </section>
    ) : (
      <section className="panel" style={{ padding: 20, marginTop: 24 }}>
        <h2><LanguageText sw="Akaunti yako" en="Your account" /></h2>
        <p className="muted"><LanguageText sw="Uthibitisho wa OTP wa namba ya simu unapatikana kwa akaunti za wauzaji. Akaunti yako inaendelea kutumia barua pepe na nenosiri kuingia." en="Phone OTP verification is available for seller accounts. Your account continues to use email and password to sign in." /></p>
      </section>
    )}

    <p style={{ marginTop: 24 }}><Link href="/dashboard"><LanguageText sw="Rudi kwenye dashibodi" en="Back to dashboard" /></Link></p>
  </main>;
}
