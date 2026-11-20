import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { PostHogAuthIdentity } from "@/components/posthog-auth-identity";

export const metadata: Metadata = {
  title: "MaarifaBooks | Vitabu vya Kidijitali",
  description: "Soma, sikiliza na uza vitabu vya kidijitali kwa Kiswahili na Kiingereza.",
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
        <PostHogAuthIdentity />
        <SiteHeader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
