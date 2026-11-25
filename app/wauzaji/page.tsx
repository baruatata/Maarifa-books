import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LanguageText } from "@/components/language-provider";

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
  if (/^0[6-9]\d{8}$/.test(phone_number)) phone_number = "255" + phone_number.slice(1);
  else if (/^[6-9]\d{8}$/.test(phone_number)) phone_number = "255" + phone_number;
  if (!store_name || !/^255[6-9]\d{8}$/.test(phone_number) || !acceptedTerms) {
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
  return <main className="page"><p className="eyebrow"><LanguageText sw="JIUNGE NA WAFANYABIASHARA" en="JOIN OUR SELLER COMMUNITY" /></p><h1><LanguageText sw="Uza vitabu kupitia MaarifaBooks" en="Sell books with MaarifaBooks" /></h1><p className="lead"><LanguageText sw="Wasilisha ombi lako. Timu itakagua taarifa zako kabla ya kuidhinisha duka. Kwa sasa muuzaji anapata 100% ya mauzo yake." en="Submit your application. Our team will review your details before approving your store. Sellers currently receive 100% of their sales." /></p>
    {!user ? <p className="notice"><LanguageText sw="Tafadhali" en="Please" /> <a href="/ingia"><u><LanguageText sw="ingia au jisajili" en="sign in or register" /></u></a> <LanguageText sw="kwanza." en="first." /></p> : <form action={applyAsSeller} className="panel form"><h2><LanguageText sw="Ombi la muuzaji" en="Seller application" /></h2>{params.error && <p className="message">{params.error}</p>}<div className="field"><label htmlFor="store-name"><LanguageText sw="Jina la duka" en="Store name" /></label><input id="store-name" name="store_name" required /></div><div className="field"><label htmlFor="seller-phone-number"><LanguageText sw="Namba yako ya WhatsApp ya kupokea oda" en="Your WhatsApp number for orders" /></label><input id="seller-phone-number" name="phone_number" type="tel" inputMode="tel" autoComplete="tel" placeholder="07XXXXXXXX au +2557XXXXXXXX" required /><small className="muted">Wateja watabonyeza kitufe cha WhatsApp kwenye kitabu ili wakuulize bei na kulipia. Hakikisha namba hii inatumika WhatsApp na unaipokea mara kwa mara.</small></div><div className="field"><label htmlFor="seller-bio"><LanguageText sw="Maelezo ya duka" en="Store description" /></label><textarea id="seller-bio" name="bio" /></div><div className="field"><label><input type="checkbox" name="accept_terms" required /> <LanguageText sw="Nimekubali sheria za muuzaji." en="I agree to the seller terms." /></label><small className="muted">Nitajaza taarifa za kweli; nitauza vitabu ninavyomiliki au nina ruhusa ya kuuza; namba yangu ya WhatsApp itapokea oda; nitathibitisha malipo kabla ya kutengeneza coupon; nitatuma coupon kwa mnunuzi aliyelipa tu; sitatumia coupon moja kwa watu wengi; nitatoa kitabu nilichoahidi na sitapotosha wateja. MaarifaBooks inaweza kusimamisha akaunti kwa udanganyifu au ukiukaji wa sheria hizi.</small></div><div className="field"><label><input type="checkbox" name="email_marketing" /> <LanguageText sw="Nakubali kupokea kampeni, matangazo na taarifa za MaarifaBooks kupitia barua pepe yangu. (Hiari)" en="I agree to receive MaarifaBooks campaigns, promotions and updates by email. (Optional)" /></label><small className="muted">Ridhaa hii ni ya hiari na haiathiri ombi langu la kuwa muuzaji.</small></div><button className="btn"><LanguageText sw="Tuma ombi" en="Submit application" /></button></form>}
  </main>;
}