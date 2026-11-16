import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SellerPhoneOtp } from "@/components/seller-phone-otp";

async function applyAsSeller(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const store_name = String(formData.get("store_name") ?? "").trim();
  const phone_number = String(formData.get("phone_number") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  if (!store_name || !/^255[67]\d{8}$/.test(phone_number)) redirect("/wauzaji?error=" + encodeURIComponent("Jaza jina la duka na thibitisha namba ya simu kwa OTP."));
  const { error } = await supabase.from("seller_applications").insert({ user_id: user.id, store_name, phone_number, bio, status: "pending" });
  if (error) redirect("/wauzaji?error=" + encodeURIComponent(error.message));
  redirect("/dashboard");
}
export default async function SellersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <main className="page"><p className="eyebrow">JIUNGE NA WAFANYABIASHARA</p><h1>Uza vitabu kupitia MaarifaBooks</h1><p className="lead">Wasilisha ombi lako. Timu itakagua taarifa zako kabla ya kuidhinisha duka. Kwa sasa muuzaji anapata 100% ya mauzo yake.</p>
    {!user ? <p className="notice">Tafadhali <a href="/ingia"><u>ingia au jisajili</u></a> kwanza.</p> : <form action={applyAsSeller} className="panel form"><h2>Ombi la muuzaji</h2>{params.error && <p className="message">{params.error}</p>}<div className="field"><label>Jina la duka</label><input name="store_name" required /></div><SellerPhoneOtp /><div className="field"><label>Maelezo</label><textarea name="bio" /></div><button className="btn">Tuma ombi</button></form>}
  </main>;
}
