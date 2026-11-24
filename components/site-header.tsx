import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { LanguageToggle, LanguageText } from "@/components/language-provider";

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
      <nav aria-label="Main menu">
        <Link className="nav-cta" href="/#vitabu"><LanguageText sw="Vitabu" en="Books" /></Link>
        <Link className="nav-cta" href="/mafunzo"><LanguageText sw="Muongozo" en="Guide" /></Link>
        {user ? (
          <>
            {profile?.role === "buyer" && <Link className="nav-cta" href="/dashboard/jihudumie"><LanguageText sw="Jihudumie" en="My account" /></Link>}
            {profile?.role !== "buyer" && <Link className="nav-cta" href={sellerApproved ? "/dashboard/kitabu" : "/wauzaji"}>{sellerApproved ? <LanguageText sw="Pakia kitabu" en="Upload a book" /> : <LanguageText sw="Uza vitabu" en="Sell books" />}</Link>}
            {profile?.role === "admin" ? (
              <Link className="nav-cta" href="/admin"><LanguageText sw="Admin" en="Admin" /></Link>
            ) : (
              <details className="account-menu">
                <summary className="nav-cta"><LanguageText sw="Akaunti yangu" en="My account" /></summary>
                <div className="account-menu-panel">
                  <Link href="/dashboard"><LanguageText sw="Dashibodi" en="Dashboard" /></Link>
                  {profile?.role === "buyer" && <Link href="/dashboard/jihudumie">Jihudumie</Link>}
                  {sellerApproved && <Link href="/dashboard/kitabu"><LanguageText sw="Pakia kitabu" en="Upload a book" /></Link>}
                  <form action={signOut}><button type="submit"><LanguageText sw="Toka" en="Sign out" /></button></form>
                </div>
              </details>
            )}
          </>
        ) : (
          <>
            <Link className="nav-cta" href="/ingia?next=%2Fdashboard%2Fjihudumie">Jihudumie</Link>
            <Link className="nav-cta" href="/ingia#jisajili"><LanguageText sw="Jisajili" en="Sign up" /></Link>
          </>
        )}
      </nav>
      <LanguageToggle />
    </header>
  );
}
