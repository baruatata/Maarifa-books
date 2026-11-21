"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { signInForClient, signUp } from "@/app/auth/actions";
import { PasswordField } from "@/components/password-field";

export function AuthForms({ error, success, next }: { error?: string; success?: string; next?: string }) {
  const signupEventSent = useRef(false);
  const router = useRouter();
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const result = await signInForClient(new FormData(event.currentTarget));
      if (!result.ok) {
        setLoginError(result.error);
        return;
      }
      // Identify the authenticated user before navigating away from the login page.
      posthog.identify(result.user.id, {
        email: result.user.email,
        name: result.user.name,
      });
      router.push(result.redirectTo);
      router.refresh();
    } catch {
      setLoginError("Imeshindikana kuingia. Tafadhali jaribu tena.");
    } finally {
      setIsLoggingIn(false);
    }
  }
  useEffect(() => {
    if (!success || signupEventSent.current) return;
    signupEventSent.current = true;
    posthog.capture("user_signed_up", { method: "email" });
    const url = new URL(window.location.href);
    url.searchParams.delete("success");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [success]);

  const [language, setLanguage] = useState<"sw" | "en">("sw");
  const en = language === "en";
  return <section>
    <div className="field language-choice">
      <label htmlFor="auth-language">{en ? "Choose language" : "Chagua lugha"}</label>
      <select id="auth-language" value={language} onChange={e => setLanguage(e.target.value as "sw" | "en")}>
        <option value="sw">Kiswahili</option><option value="en">English</option>
      </select>
    </div>
    {error && <p className="message">{error}</p>}
    {success && <p className="notice">{en ? "Check your email to confirm your account." : success}</p>}
    <div className="auth-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 20 }}>
      <form className="panel form" onSubmit={handleLogin}><input type="hidden" name="next" value={next || ""}/>
        <h2>{en ? "Log in" : "Ingia"}</h2>
        {loginError && <p className="message" role="alert">{loginError}</p>}
        <div className="field"><label htmlFor="login-email">{en ? "Email address" : "Barua pepe"}</label><input id="login-email" name="email" type="email" autoComplete="email" required /></div>
        <PasswordField name="password" label={en ? "Password" : "Nenosiri"} />
        <button className="btn" type="submit" disabled={isLoggingIn}>{isLoggingIn ? (en ? "Logging in…" : "Inaingia…") : (en ? "Log in" : "Ingia")}</button>
      </form>
      <form id="jisajili" className="panel form" action={signUp}><input type="hidden" name="next" value={next || ""}/>
        <h2>{en ? "Create an account" : "Jisajili"}</h2>
        <div className="field"><label htmlFor="full-name">{en ? "Full name" : "Jina kamili"}</label><input id="full-name" name="full_name" autoComplete="name" required /></div>
        <div className="field"><label htmlFor="phone">{en ? "Phone number" : "Namba ya simu"}</label><input id="phone" name="phone" type="tel" autoComplete="tel" /></div>
        <div className="field"><label htmlFor="signup-email">{en ? "Email address" : "Barua pepe"}</label><input id="signup-email" name="email" type="email" autoComplete="email" required /></div>
        <PasswordField name="password" label={en ? "Password (at least 8 characters)" : "Nenosiri (angalau herufi 8)"} minLength={8} />
        <input type="hidden" name="preferred_language" value={language} />
        <button className="btn">{en ? "Create account" : "Fungua akaunti"}</button>
        <p className="muted">{en ? "Marketing consent is optional and will be requested separately." : "Idhini ya matangazo ni hiari na itaombwa kando."}</p>
      </form>
    </div>
  </section>;
}
