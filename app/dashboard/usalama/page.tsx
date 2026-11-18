import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SellerPhoneOtp } from "@/components/seller-phone-otp";

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
    <h1>Usalama wa akaunti</h1>
    <p className="muted">Linda akaunti yako kwa nenosiri imara na usimshirikishe mtu mwingine. Kwa akaunti ya muuzaji, thibitisha pia namba ya simu iliyosajiliwa kwa OTP.</p>

    {isSeller ? (
      <section className="panel" style={{ padding: 20, marginTop: 24 }}>
        <h2>Uthibitisho wa namba ya simu</h2>
        <p className="muted">Tutatumia namba iliyopo kwenye taarifa za duka lako. Huwezi kubadilisha namba hapa; hii inalinda akaunti yako dhidi ya kuthibitisha namba ya mtu mwingine.</p>
        <SellerPhoneOtp phone={savedPhone} verified={isVerified} />
      </section>
    ) : (
      <section className="panel" style={{ padding: 20, marginTop: 24 }}>
        <h2>Akaunti yako</h2>
        <p className="muted">Uthibitisho wa OTP wa namba ya simu unapatikana kwa akaunti za wauzaji. Akaunti yako inaendelea kutumia barua pepe na nenosiri kuingia.</p>
      </section>
    )}

    <p style={{ marginTop: 24 }}><Link href="/dashboard">Rudi kwenye dashibodi</Link></p>
  </main>;
}
