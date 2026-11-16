import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TotpChallenge } from "@/components/totp-challenge";

export default async function MfaChallengePage() {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/ingia");
  const {data,error}=await supabase.auth.mfa.listFactors();
  if(error) redirect("/dashboard");
  const factor=(data?.totp??[]).find(item=>item.status==="verified");
  if(!factor) redirect("/dashboard/usalama");
  const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId:factor.id});
  if(challengeError) redirect("/ingia?error=Imeshindikana+kuanzisha+uthibitishaji");
  return <TotpChallenge factorId={factor.id} challengeId={challenge.id}/>;
}
