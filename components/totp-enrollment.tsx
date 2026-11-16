"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TotpEnrollment() {
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  async function start() {
    setBusy(true); setMessage("");
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "MaarifaBooks Authenticator",
    });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
    setMessage("Scan QR Code kwa Google Authenticator au Microsoft Authenticator.");
  }

  async function verify() {
    if (!factorId || !/^\d{6}$/.test(code)) { setMessage("Weka msimbo sahihi wa tarakimu 6."); return; }
    setBusy(true); setMessage("");
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) { setBusy(false); setMessage(challengeError.message); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    setBusy(false);
    if (error) { setMessage("Msimbo si sahihi. Jaribu tena."); return; }
    setQr(""); setSecret(""); setFactorId(""); setCode("");
    setMessage("Authenticator imewashwa kikamilifu kwenye akaunti yako.");
  }

  return <section className="panel form" style={{padding:20,marginTop:20}}>
    <h2>Authenticator ya akaunti</h2>
    <p className="muted">Tumia Google Authenticator au Microsoft Authenticator. Msimbo mpya wa tarakimu 6 hutengenezwa kila sekunde 30.</p>
    {!factorId ? <button className="btn" disabled={busy} onClick={start}>{busy ? "Inaanza..." : "Washa Authenticator"}</button> : <>
      {qr && <div style={{background:"#fff",padding:12,width:"fit-content",borderRadius:12}}><img src={qr} alt="QR Code ya kuunganisha Authenticator" width="220" height="220"/></div>}
      <p className="muted">Ikiwa huwezi kuskani QR Code, weka siri hii mwenyewe kwenye programu ya Authenticator:</p>
      <p style={{fontWeight:700,wordBreak:"break-all"}}>{secret}</p>
      <div className="field"><label htmlFor="totp-code">Msimbo wa tarakimu 6</label><input id="totp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}/></div>
      <button className="btn" disabled={busy || code.length!==6} onClick={verify}>{busy ? "Inathibitisha..." : "Thibitisha na kuwasha"}</button>
    </>}
    {message && <p className="notice" role="status">{message}</p>}
  </section>;
}
