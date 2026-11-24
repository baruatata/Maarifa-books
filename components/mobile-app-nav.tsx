"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Mwanzo", icon: "⌂", exact: true },
  { href: "/#vitabu", label: "Vitabu", icon: "▤" },
  { href: "/mafunzo", label: "Muongozo", icon: "◇" },
  { href: "/ingia?next=%2Fdashboard", label: "Akaunti", icon: "○" },
];

export function MobileAppNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-app-nav" aria-label="Menyu ya app">
      {items.map((item) => {
        const active = item.exact ? pathname === "/" : item.href.startsWith("/#") ? pathname === "/" : pathname.startsWith(item.href.split("?")[0]);
        return (
          <Link className={active ? "mobile-app-nav-item active" : "mobile-app-nav-item"} href={item.href} key={item.label} aria-current={active ? "page" : undefined}>
            <span className="mobile-app-nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
