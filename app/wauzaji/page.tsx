import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function applyAsSeller(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const store_name = String(formData.get("store_name") ?? "").trim();
  const rawPhone = String(formData.get("phone_number") ?? "").trim().replace(/[\s()-]/g, "");
  const bio = String(formData.get("bio") ?? "").trim();
  let phone_number = rawPhone.startsWith("+") ? rawPhone.slice(1) : rawPhone;
  if (/^0[67]\d{8}$/.test(phone_number)) phone_number = "255" + phone_number.slice(1);
  else if (/^[67]\d{8}$/.test(phone_number)) phone_number = "255" + phone_number;
  if (!store_name || !/^255[67]\d{8}$/.test(phone_number)) {
    redirect("/wauzaji?error=" + encodeURIComponent("Jaza jina la duka na namba sahihi ya simu ya Tanzania."));
  }
  const { error } = await supabase.from("seller_applications").insert({ user_id: user.id, store_name, phone_number, bio, status: "pending" });
  if (error) redirect("/wauzaji?error=" + encodeURIComponent(error.message));
  redirect("/dashboard");
}
export default async function SellersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <main className="page"><p className="eyebrow">JIUNGE NA WAFANYABIASHARA</p><h1>Uza vitabu kupitia MaarifaBooks</h1><p className="lead">Wasilisha ombi lako. Timu itakagua taarifa zako kabla ya kuidhinisha duka. Kwa sasa muuzaji anapata 100% ya mauzo yake.</p>
    {!user ? <p className="notice">Tafadhali <a href="/ingia"><u>ingia au jisajili</u></a> kwanza.</p> : <form action={applyAsSeller} className="panel form"><h2>Ombi la muuzaji</h2>{params.error && <p className="message">{params.error}</p>}<div className="field"><label htmlFor="store-name">Jina la duka</label><input id="store-name" name="store_name" required /></div><div className="field"><label htmlFor="seller-phone-number">Namba ya simu (bila OTP)</label><input id="seller-phone-number" name="phone_number" type="tel" inputMode="tel" autoComplete="tel" placeholder="07XXXXXXXX au +2557XXXXXXXX" required /><small className="muted">Tutaitumia kwa mawasiliano kuhusu duka lako.</small></div><div className="field"><label htmlFor="seller-bio">Maelezo</label><textarea id="seller-bio" name="bio" /></div><button className="btn">Tuma ombi</button></form>}
  </main>;
}