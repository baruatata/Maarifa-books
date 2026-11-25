"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/language-provider";

type ApiResult = { success?: boolean; verified?: boolean; phone?: string; message?: string; error?: string };

export function SellerPhoneOtp({ phone, verified }: { phone: string; verified: boolean }) {
  const { en } = useLanguage();
  const [code, setCode] = useState("");
  const [isVerified, setIsVerified] = useState(verified);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function call(action: "send" | "verify") {
    setBusy(true);
    setMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error((en ? "Your session has expired. Please sign in again." : "Kikao kimeisha. Ingia tena kwenye akaunti yako."));

      const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/seller-phone-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({ action, phone, code }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || !data.success) throw new Error(data.error || (en ? "The request failed." : "Ombi halijafanikiwa."));
      if (action === "verify" && data.verified) {
        setIsVerified(true);
        setCode("");
      }
      setMessage(data.message || (action === "verify" ? (en ? "Phone number verified." : "Namba imethibitishwa.") : (en ? "OTP sent." : "OTP imetumwa.")));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (en ? "An error occurred." : "Hitilafu imetokea."));
    } finally {
      setBusy(false);
    }
  }

  return <div className="field">
    <label htmlFor="account-seller-phone">{en ? "Registered phone number" : "Namba iliyosajiliwa"}</label>
    <input id="account-seller-phone" type="tel" value={phone ? "+" + phone.replace(/^\+/, "") : (en ? "No registered number" : "Hakuna namba iliyosajiliwa")} readOnly disabled />
    {isVerified ? (
      <p className="notice" role="status">Namba imethibitishwa. Akaunti yako imelindwa.</p>
    ) : (
      <>
        <p className="muted">Msimbo wa tarakimu 6 utatumwa kwa SMS kwenye namba hii. OTP itaisha baada ya dakika 5.</p>
        <button type="button" className="btn" disabled={busy || !phone} onClick={() => call("send")}>
          {busy ? (en ? "Sending..." : "Inatuma...") : (en ? "Send OTP" : "Tuma OTP")}
        </button>
        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <input
            aria-label=(en ? "OTP code" : "Namba ya OTP")
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder=(en ? "Enter the 6-digit OTP" : "Ingiza OTP ya tarakimu 6")
            disabled={busy}
          />
          <button type="button" className="btn" disabled={busy || code.length !== 6} onClick={() => call("verify")}>
            {busy ? "..." : (en ? "Verify" : "Thibitisha")}
          </button>
        </div>
      </>
    )}
    {message && <p className="message" role="status">{message}</p>}
  </div>;
}
