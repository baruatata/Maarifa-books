import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AccountSecurityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  return <main className="page">
    <p className="eyebrow">MAARIFABOOKS</p>
    <h1>Usalama wa akaunti</h1>
    <p className="muted">Tumia nenosiri imara na usimshirikishe mtu mwingine. Kuingia kunatumia barua pepe na nenosiri bila msimbo wa ziada.</p>
    <p style={{ marginTop: 24 }}><Link href="/dashboard">Rudi kwenye dashibodi</Link></p>
  </main>;
}
