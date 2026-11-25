"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type Language = "sw" | "en";
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; en: boolean };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children, initialLanguage = "sw" }: { children: ReactNode; initialLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    document.cookie = `maarifa-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
  };
  const value = useMemo(() => ({ language, setLanguage, en: language === "en" }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const nextLanguage: Language = language === "sw" ? "en" : "sw";
  const choose = () => {
    setLanguage(nextLanguage);
    router.refresh();
  };
  return (
    <button
      type="button"
      className="language-toggle"
      onClick={choose}
      aria-label={language === "sw" ? "Switch language to English" : "Badili lugha iwe Kiswahili"}
      title={language === "sw" ? "English" : "Kiswahili"}
    >
      <span aria-hidden="true">{language === "sw" ? "🇹🇿" : "🇬🇧"}</span>
    </button>
  );
}

export function LanguageText({ sw, en }: { sw: string; en: string }) {
  const { en: isEnglish } = useLanguage();
  return <>{isEnglish ? en : sw}</>;
}
