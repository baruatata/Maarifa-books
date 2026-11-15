import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "MaarifaBooks | Vitabu vya Kidijitali",
  description: "Soma, sikiliza na uza vitabu vya kidijitali kwa Kiswahili na Kiingereza.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="sw"><body><SiteHeader />{children}</body></html>;
}
