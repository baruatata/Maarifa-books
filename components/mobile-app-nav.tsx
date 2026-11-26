"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

type MobileAppNavProps = {
  accountHref?: string;
};

export function MobileAppNav({
  accountHref = "/ingia?next=%2Fdashboard",
}: MobileAppNavProps) {
  const pathname = usePathname();
  const { en } = useLanguage();

  const items = [
    { href: "/", sw: "Mwanzo", en: "Home", icon: "⌂", exact: true },
    { href: "/dashboard/jihudumie", sw: "Jihudumie", en: "My account", icon: "▣" },
    { href: "/mafunzo", sw: "Muongozo", en: "Guide", icon: "◇" },
    { href: accountHref, sw: "Akaunti", en: "Account", icon: "○" },
  ];

  return (
    <nav className="mobile-app-nav" aria-label={en ? "App navigation" : "Menyu ya app"}>
      {items.map((item) => {
        const active = item.exact ? pathname === "/" : pathname.startsWith(item.href.split("?")[0]);
        return (
          <Link className={active ? "mobile-app-nav-item active" : "mobile-app-nav-item"} href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
            <span className="mobile-app-nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{en ? item.en : item.sw}</span>
          </Link>
        );
      })}
    </nav>
  );
}
