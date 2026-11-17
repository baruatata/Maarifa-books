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
  const acceptedTerms = formData.get("accept_terms") === "on";
  const emailMarketing = formData.get("email_marketing") === "on";
  let phone_number = rawPhone.startsWith("+") ? rawPhone.slice(1) : rawPhone;
  if (/^0[67]\d{8}$/.test(phone_number)) phone_number = "255" + phone_number.slice(1);
  else if (/^[67]\d{8}$/.test(phone_number)) phone_number = "255" + phone_number;
  if (!store_name || !/^255[67]\d{8}$/.test(phone_number) || !acceptedTerms) {
    redirect("/wauzaji?error=" + encodeURIComponent("Jaza jina la duka, weka namba sahihi ya WhatsApp ya Tanzania na ukubali sheria za muuzaji."));
  }
  const { error } = await supabase.from("seller_applications").insert({ user_id: user.id, store_name, phone_number, bio, status: "pending", terms_accepted_at: new Date().toISOString(), terms_version: "seller-v1" });
  if (error) redirect("/wauzaji?error=" + encodeURIComponent(error.message));
  if (emailMarketing) {
    const { error: consentError } = await supabase.from("marketing_consents").upsert({ user_id: user.id, channel: "email", consented: true, consent_text_version: "seller-email-v1", consented_at: new Date().toISOString(), withdrawn_at: null }, { onConflict: "user_id,channel" });
    if (consentError) redirect("/wauzaji?error=" + encodeURIComponent("Ombi limetumwa lakini ridhaa ya kampeni haijahifadhiwa. Tafadhali wasiliana na msaada."));
  }
  redirect("/dashboard");
}
export default async function SellersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <main className="page"><p className="eyebrow">JIUNGE NA WAFANYABIASHARA</p><h1>Uza vitabu kupitia MaarifaBooks</h1><p className="lead">Wasilisha ombi lako. Timu itakagua taarifa zako kabla ya kuidhinisha duka. Kwa sasa muuzaji anapata 100% ya mauzo yake.</p>
    {!user ? <p className="notice">Tafadhali <a href="/ingia"><u>ingia au jisajili</u></a> kwanza.</p> : <form action={applyAsSeller} className="panel form"><h2>Ombi la muuzaji</h2>{params.error && <p className="message">{params.error}</p>}<div className="field"><label htmlFor="store-name">Jina la duka</label><input id="store-name" name="store_name" required /></div><div className="field"><label htmlFor="seller-phone-number">Namba yako ya WhatsApp ya kupokea oda</label><input id="seller-phone-number" name="phone_number" type="tel" inputMode="tel" autoComplete="tel" placeholder="07XXXXXXXX au +2557XXXXXXXX" required /><small className="muted">Wateja watabonyeza kitufe cha WhatsApp kwenye kitabu ili wakuulize bei na kulipia. Hakikisha namba hii inatumika WhatsApp na unaipokea mara kwa mara.</small></div><div className="field"><label htmlFor="seller-bio">Maelezo ya duka</label><textarea id="seller-bio" name="bio" /></div><div className="field"><label><input type="checkbox" name="accept_terms" required /> Nimekubali sheria za muuzaji.</label><small className="muted">Nitajaza taarifa za kweli; nitauza vitabu ninavyomiliki au nina ruhusa ya kuuza; namba yangu ya WhatsApp itapokea oda; nitathibitisha malipo kabla ya kutengeneza coupon; nitatuma coupon kwa mnunuzi aliyelipa tu; sitatumia coupon moja kwa watu wengi; nitatoa kitabu nilichoahidi na sitapotosha wateja. MaarifaBooks inaweza kusimamisha akaunti kwa udanganyifu au ukiukaji wa sheria hizi.</small></div><div className="field"><label><input type="checkbox" name="email_marketing" /> Nakubali kupokea kampeni, matangazo na taarifa za MaarifaBooks kupitia barua pepe yangu. (Hiari)</label><small className="muted">Ridhaa hii ni ya hiari na haiathiri ombi langu la kuwa muuzaji.</small></div><button className="btn">Tuma ombi</button></form>}
  </main>;
}