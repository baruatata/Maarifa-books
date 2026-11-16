"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TotpChallenge({factorId,challengeId}:{factorId:string;challengeId:string}) {
  const [code,setCode]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const router=useRouter();
  const supabase=createClient();
  async function verify() {
    setBusy(true); setError("");
    const {error}=await supabase.auth.mfa.verify({factorId,challengeId,code});
    setBusy(false);
    if(error){setError("Msimbo si sahihi au muda wake umeisha. Jaribu tena.");return;}
    router.replace("/dashboard"); router.refresh();
  }
  return <main className="page" style={{maxWidth:480}}>
    <p className="eyebrow">USALAMA WA AKAUNTI</p><h1>Thibitisha kuingia</h1>
    <p className="muted">Fungua programu yako ya Authenticator na uweke msimbo wa tarakimu 6 wa MaarifaBooks.</p>
    <form className="panel form" style={{padding:20}} onSubmit={e=>{e.preventDefault();void verify();}}>
      <div className="field"><label htmlFor="totp-login-code">Msimbo wa uthibitishaji</label><input id="totp-login-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} required /></div>
      {error && <p className="message" role="alert">{error}</p>}
      <button className="btn" disabled={busy || code.length!==6}>{busy?"Inathibitisha...":"Thibitisha na uingie"}</button>
    </form>
  </main>;
}
