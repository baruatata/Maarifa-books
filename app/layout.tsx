import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "MaarifaBooks | Vitabu vya Kidijitali",
  description: "Soma, sikiliza na uza vitabu vya kidijitali kwa Kiswahili na Kiingereza.",
  verification: {
    google: "VwIPWIolhogVFqUanq6c9kV2nmbm74Vuox6ubicY-wE",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sw">
      <body>
        <SiteHeader />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
