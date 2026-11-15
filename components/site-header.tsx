import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isAdmin = profile?.role === "admin";
  return <header className="site-header">
    <Link className="brand" href="/" aria-label="MaarifaBooks mwanzo">
      <Image src="/maarifabooks-logo.svg" alt="MaarifaBooks — Soma, Jifunze, Endelea" width={620} height={132} priority />
    </Link>
    <nav>
      <Link href="/#vitabu">Vitabu</Link>
      {!isAdmin && <Link href="/wauzaji">Uza vitabu</Link>}
      {isAdmin && <Link href="/admin">Admin Panel</Link>}
      <Link className="nav-cta" href={user ? (isAdmin ? "/admin" : "/dashboard") : "/ingia"}>{user ? (isAdmin ? "Admin Panel" : "Dashibodi") : "Ingia / Jisajili"}</Link>
    </nav>
  </header>;
}
