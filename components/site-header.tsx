import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: sellerApplication }] = user
    ? await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("seller_applications").select("status").eq("user_id", user.id).maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  const sellerApproved = sellerApplication?.status === "approved";

  return (
    <header className="site-header">
      <Link className="brand brand-text-logo" href="/" aria-label="MaarifaBooks mwanzo">
        <span className="brand-mark" aria-hidden="true">📚</span>
        <span className="brand-name">Maarifa<span>Books</span></span>
      </Link>
      <nav aria-label="Menyu kuu">
        <Link href="/#vitabu">Vitabu</Link>
        {user ? (
          <>
            {profile?.role === "buyer" && <Link href="/dashboard/jihudumie">Jihudumie</Link>}
            {profile?.role !== "buyer" && <Link href={sellerApproved ? "/dashboard/kitabu" : "/wauzaji"}>{sellerApproved ? "Pakia kitabu" : "Uza vitabu"}</Link>}
            {profile?.role === "admin" ? (
              <Link className="nav-cta" href="/admin">Admin</Link>
            ) : (
              <details className="account-menu">
                <summary>Akaunti yangu</summary>
                <div className="account-menu-panel">
                  <Link href="/dashboard">Dashibodi</Link>
                  {profile?.role === "buyer" && <Link href="/dashboard/jihudumie">Jihudumie</Link>}
                  {sellerApproved && <Link href="/dashboard/kitabu">Pakia kitabu</Link>}
                  <form action={signOut}><button type="submit">Toka</button></form>
                </div>
              </details>
            )}
          </>
        ) : (
          <>
            <Link className="nav-login" href="/ingia">Ingia</Link>
            <Link className="nav-cta" href="/ingia#jisajili">Jisajili</Link>
          </>
        )}
      </nav>
    </header>
  );
}
