"use client";
import { useState } from "react";

type ApiResult = { success?: boolean; verified?: boolean; phone?: string; message?: string; error?: string };
export function SellerPhoneOtp() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function call(action: "send" | "verify") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/seller-phone-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
          Authorization: "Bearer " + (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""),
        },
        body: JSON.stringify({ action, phone, code }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || !data.success) throw new Error(data.error || "Ombi halijafanikiwa.");
      if (action === "verify" && data.verified && data.phone) setVerifiedPhone(data.phone);
      setMessage(data.message || (action === "verify" ? "Namba imethibitishwa." : "OTP imetumwa."));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Hitilafu imetokea.");
    } finally { setBusy(false); }
  }
  return <div className="field">
    <label htmlFor="seller-phone">Namba ya simu ya malipo na uthibitisho</label>
    <input id="seller-phone" type="tel" value={phone} onChange={e => { setPhone(e.target.value); setVerifiedPhone(""); }} placeholder="07XXXXXXXX au 2557XXXXXXXX" required disabled={!!verifiedPhone} />
    {!verifiedPhone && <button type="button" className="btn" disabled={busy || phone.trim().length < 9} onClick={() => call("send")}>{busy ? "Inatuma..." : "Tuma OTP"}</button>}
    {!verifiedPhone && <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <input aria-label="Namba ya OTP" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Ingiza OTP ya tarakimu 6" />
      <button type="button" className="btn" disabled={busy || code.length !== 6} onClick={() => call("verify")}>{busy ? "..." : "Thibitisha"}</button>
    </div>}
    {verifiedPhone && <p className="notice">Namba imethibitishwa: {verifiedPhone}</p>}
    {message && <p className="message" role="status">{message}</p>}
    <input type="hidden" name="phone_number" value={verifiedPhone} />
  </div>;
}
