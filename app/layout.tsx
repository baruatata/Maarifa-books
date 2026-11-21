import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { PostHogAuthIdentity } from "@/components/posthog-auth-identity";

const siteUrl = "https://maarifabooks.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "MaarifaBooks",
  title: {
    default: "MaarifaBooks | Vitabu vya Kidijitali",
    template: "%s | MaarifaBooks",
  },
  description:
    "Soma, sikiliza na gundua vitabu vya kidijitali vya Kiswahili na Kiingereza kupitia MaarifaBooks.",
  keywords: [
    "vitabu vya Kiswahili",
    "vitabu vya kidijitali",
    "kusoma vitabu online",
    "vitabu PDF",
    "MaarifaBooks",
  ],
  openGraph: {
    type: "website",
    locale: "sw_TZ",
    siteName: "MaarifaBooks",
    title: "MaarifaBooks | Vitabu vya Kidijitali",
    description:
      "Soma, sikiliza na gundua vitabu vya kidijitali vya Kiswahili na Kiingereza.",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "MaarifaBooks | Vitabu vya Kidijitali",
    description:
      "Soma, sikiliza na gundua vitabu vya kidijitali vya Kiswahili na Kiingereza.",
  },
  robots: {
    index: true,
    follow: true,
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
        <PostHogAuthIdentity />
        <SiteHeader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
