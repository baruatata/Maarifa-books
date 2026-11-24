import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { MobileAppNav } from "@/components/mobile-app-nav";
import { LanguageProvider } from "@/components/language-provider";

const siteUrl = "https://maarifabooks.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "MaarifaBooks",
  title: { default: "MaarifaBooks | Vitabu vya Kidijitali", template: "%s | MaarifaBooks" },
  description: "Soma, sikiliza na gundua vitabu vya kidijitali vya Kiswahili na Kiingereza kupitia MaarifaBooks.",
  keywords: ["MaarifaBooks", "vitabu vya Kiswahili", "vitabu vya Kiingereza", "vitabu vya kidijitali", "kusoma vitabu online", "vitabu PDF", "audiobooks za Kiswahili"],
  verification: { google: "VwIPWIolhogVFqUanq6c9kV2nmbm74Vuox6ubicY-wE" },
  openGraph: { type: "website", locale: "sw_TZ", siteName: "MaarifaBooks", title: "MaarifaBooks | Vitabu vya Kidijitali", description: "Soma, sikiliza na gundua vitabu vya kidijitali vya Kiswahili na Kiingereza.", url: siteUrl },
  twitter: { card: "summary", title: "MaarifaBooks | Vitabu vya Kidijitali", description: "Soma, sikiliza na gundua vitabu vya kidijitali vya Kiswahili na Kiingereza." },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sw">
      <body>
        <LanguageProvider>
          <SiteHeader />
          {children}
          <MobileAppNav />
        </LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
