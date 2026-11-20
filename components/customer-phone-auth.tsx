"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import posthog from "posthog-js";

function toE164(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "+255" + digits.slice(1);
  if (digits.startsWith("255") && digits.length === 12) return "+" + digits;
  if ((digits.startsWith("6") || digits.startsWith("7")) && digits.length === 9) return "+255" + digits;
  throw new Error("Weka namba sahihi ya Tanzania, mfano 0652245742.");
}

export function CustomerPhoneAuth({ next }: { next?: string }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"details" | "verify">("details");
  const [busy, setBusy] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  async function sendOtp() {
    const phone = toE164(phoneInput);
    if (mode === "signup" && name.trim().length < 2) throw new Error("Weka jina lako kamili.");
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: mode === "signup",
        ...(mode === "signup" ? { data: { full_name: name.trim(), preferred_language: "sw" } } : {}),
      },
    });
    if (otpError) throw otpError;
    posthog.capture("customer_otp_requested", { flow: mode });
    setStep("verify");
    setResendCountdown(60);
    setMessage("Ombi la OTP limetumwa. Ingiza msimbo mara tu unapoupokea; ukichelewa unaweza kuomba mwingine baada ya sekunde 60.");
  }

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      await sendOtp();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kuomba OTP.");
    } finally { setBusy(false); }
  }

  async function resendOtp() {
    if (busy || resendCountdown > 0) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await sendOtp();
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kutuma OTP tena.");
    } finally { setBusy(false); }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const phone = toE164(phoneInput);
      if (!/^\d{6}$/.test(code.trim())) throw new Error("Ingiza OTP yenye tarakimu 6.");
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ phone, token: code.trim(), type: "sms" });
      if (verifyError) throw verifyError;
      if (!data.user) throw new Error("Imeshindikana kuthibitisha akaunti.");
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      if (profileError) throw profileError;
      if (profile?.role && profile.role !== "buyer") {
        await supabase.auth.signOut();
        throw new Error("Huduma ya Jihudumie ni kwa wateja pekee. Tumia ukurasa wa muuzaji.");
      }
      const { error: profileUpdateError } = await supabase.from("profiles").update({ phone, phone_verified_at: new Date().toISOString() }).eq("id", data.user.id);
      if (profileUpdateError) throw profileUpdateError;
      posthog.identify(data.user.id);
      posthog.capture(mode === "signup" ? "customer_phone_signup_completed" : "customer_phone_login_completed", { method: "sms_otp" });
      posthog.capture(mode === "signup" ? "user_signed_up" : "user_logged_in", { method: "sms_otp" });
      window.location.assign(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard/jihudumie");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP haijathibitishwa.");
    } finally { setBusy(false); }
  }

  return <section className="panel form" style={{ marginBottom: 20 }}>
    <h2>{mode === "signup" ? "Jisajili kwa simu" : "Ingia kwa simu"}</h2>
    <p className="muted">Huhitaji barua pepe wala nenosiri. Utatumia OTP ya SMS kuthibitisha namba yako.</p>
    {error && <p className="message" role="alert">{error}</p>}
    {message && <p className="notice" role="status">{message}</p>}
    {step === "details" ? <form onSubmit={requestOtp}>
      <div className="field">
        <label htmlFor="customer-phone-mode">Unataka kufanya nini?</label>
        <select id="customer-phone-mode" value={mode} onChange={e => setMode(e.target.value as "signup" | "login")}>
          <option value="signup">Fungua akaunti mpya</option>
          <option value="login">Nina akaunti tayari</option>
        </select>
      </div>
      {mode === "signup" && <div className="field">
        <label htmlFor="customer-full-name">Jina kamili</label>
        <input id="customer-full-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required />
      </div>}
      <div className="field">
        <label htmlFor="customer-phone">Namba ya simu</label>
        <input id="customer-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0652245742" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} required />
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Subiri..." : "Tuma OTP"}</button>
    </form> : <form onSubmit={verifyOtp}>
      <div className="field">
        <label htmlFor="customer-otp">OTP ya tarakimu 6</label>
        <input id="customer-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
      </div>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Inathibitisha..." : "Thibitisha na uendelee"}</button>
      <button className="btn secondary" type="button" disabled={busy || resendCountdown > 0} onClick={resendOtp}>
        {resendCountdown > 0 ? `Tuma OTP tena baada ya sekunde ${resendCountdown}` : "Tuma OTP tena"}
      </button>
      <button className="btn secondary" type="button" disabled={busy} onClick={() => { setStep("details"); setCode(""); setMessage(""); setError(""); setResendCountdown(0); }}>Badili namba</button>
    </form>}
  </section>;
}
