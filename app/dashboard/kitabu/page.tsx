import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
async function submitBook(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: application } = await supabase.from("seller_applications").select("status").eq("user_id", user.id).maybeSingle();
  if (application?.status !== "approved") redirect("/wauzaji?error=Ombi+la+muuzaji+linahitaji+kuidhinishwa");
  const title = String(formData.get("title") ?? "").trim();
  const author_name = String(formData.get("author_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const format = String(formData.get("format") ?? "pdf");
  const language = String(formData.get("language") ?? "sw");
  const price_tzs = Number(formData.get("price_tzs"));
  if (!title || !["pdf","epub","audiobook"].includes(format) || !["sw","en","other"].includes(language) || !Number.isInteger(price_tzs) || price_tzs < 0) redirect("/dashboard/kitabu?error=Kagua+taarifa");
  const { error } = await supabase.from("books").insert({ seller_id: user.id, title, author_name, description, format, language, price_tzs, status: "pending" });
  if (error) redirect("/dashboard/kitabu?error=" + encodeURIComponent(error.message));
  redirect("/dashboard");
}
export default async function AddBookPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="page"><p className="eyebrow">DASHIBODI YA MUUZAJI</p><h1>Wasilisha kitabu</h1><p className="muted">Kitabu kitaonekana baada ya msimamizi kukikagua. Upakiaji wa faili utaongezwa katika hatua inayofuata.</p>
    <form action={submitBook} className="panel form">{params.error && <p className="message">{params.error}</p>}<div className="field"><label>Jina la kitabu</label><input name="title" required /></div><div className="field"><label>Mwandishi</label><input name="author_name" /></div><div className="field"><label>Maelezo</label><textarea name="description" /></div><div className="field"><label>Aina</label><select name="format"><option value="pdf">PDF</option><option value="epub">EPUB</option><option value="audiobook">Audiobook</option></select></div><div className="field"><label>Lugha</label><select name="language"><option value="sw">Kiswahili</option><option value="en">English</option><option value="other">Nyingine</option></select></div><div className="field"><label>Bei (TSh)</label><input name="price_tzs" type="number" min="0" required /></div><button className="btn">Wasilisha kwa ukaguzi</button></form>
  </main>;
}
