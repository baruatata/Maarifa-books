import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TotpEnrollment } from "@/components/totp-enrollment";

export default async function AccountSecurityPage() {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/ingia");
  const {data}=await supabase.auth.mfa.listFactors();
  const active=(data?.totp??[]).filter(f=>f.status==="verified");
  return <main className="page">
    <p className="eyebrow">MAARIFABOOKS</p><h1>Usalama wa akaunti</h1>
    <p className="muted">Dhibiti uthibitishaji wa hatua mbili kwenye akaunti yako.</p>
    {active.length ? <section className="panel" style={{padding:20,marginTop:20}}><h2><span aria-hidden="true">✓ </span>Authenticator imewashwa</h2><p className="muted">Akaunti yako itaomba msimbo wa Authenticator baada ya kuingiza nenosiri.</p><form action={async()=>{"use server";const client=await createClient();const {data}=await client.auth.mfa.listFactors();const factor=(data?.totp??[]).find(f=>f.status==="verified");if(factor)await client.auth.mfa.unenroll({factorId:factor.id});redirect("/dashboard/usalama?updated=1");}}><button className="btn btn-outline">Zima Authenticator</button></form></section> : <TotpEnrollment />}
    <p style={{marginTop:24}}><Link href="/dashboard">Rudi kwenye dashibodi</Link></p>
  </main>;
}
