import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <header className="site-header">
    <Link className="brand" href="/">Maarifa<span>Books</span></Link>
    <nav><Link href="/#vitabu">Vitabu</Link><Link href="/wauzaji">Uza vitabu</Link><Link className="nav-cta" href={user ? "/dashboard" : "/ingia"}>{user ? "Dashibodi" : "Ingia / Jisajili"}</Link></nav>
  </header>;
}
