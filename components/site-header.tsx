import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  // Admin pages have their own management header and logout control.
  if (profile?.role === "admin") return null;

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="MaarifaBooks mwanzo">
        <img src="/maarifabooks-logo.svg" alt="MaarifaBooks — Soma, Jifunze, Endelea" />
      </Link>
      <nav aria-label="Menyu kuu">
        <Link href="/#vitabu">Vitabu</Link>
        <Link href="/wauzaji">Uza vitabu</Link>
        <Link className="nav-cta" href={user ? "/dashboard" : "/ingia"}>{user ? "Dashibodi" : "Ingia / Jisajili"}</Link>
      </nav>
    </header>
  );
}
