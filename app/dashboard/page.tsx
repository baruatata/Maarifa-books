import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).single();
  const { data: books } = await supabase.from("books").select("id,title,status,price_tzs").eq("seller_id", user.id).order("created_at", { ascending: false });
  const { data: application } = await supabase.from("seller_applications").select("store_name,status").eq("user_id", user.id).maybeSingle();
  return <main className="page"><p className="eyebrow">DASHIBODI</p><h1>Karibu, {profile?.full_name || user.email}</h1><p className="muted">Akaunti: {profile?.role ?? "buyer"}</p>
    <div className="dashlinks"><Link href="/wauzaji">Omba kuwa muuzaji</Link><Link href="/dashboard/kitabu">Wasilisha kitabu</Link><Link href="/">Maktaba</Link><form action={signOut}><button className="btn">Toka</button></form></div>
    {application && <section className="panel" style={{ padding: 18, marginBottom: 20 }}>Ombi la {application.store_name}: <span className="status">{application.status}</span></section>}
    <section className="panel" style={{ padding: 18 }}><h2>Vitabu vyangu</h2>{!books?.length ? <p className="muted">Bado hujawasilisha kitabu.</p> : <table className="table"><thead><tr><th>Kitabu</th><th>Bei</th><th>Hali</th></tr></thead><tbody>{books.map(book => <tr key={book.id}><td>{book.title}</td><td>TSh {book.price_tzs.toLocaleString("en-TZ")}</td><td><span className="status">{book.status}</span></td></tr>)}</tbody></table>}</section>
  </main>;
}
