"use server";

import { createClient } from "@/lib/supabase/server";

export async function createBookDraft(formData: FormData): Promise<{ok:true;bookId:string}|{ok:false;error:string}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {ok:false,error:"Ingia kwanza ili kupakia kitabu."};
  const { data: application } = await supabase.from("seller_applications").select("status").eq("user_id",user.id).maybeSingle();
  if (application?.status !== "approved") return {ok:false,error:"Akaunti yako bado haijaidhinishwa kuwa muuzaji."};
  const title = String(formData.get("title") ?? "").trim();
  const author_name = String(formData.get("author_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "nyingine");
  const format = String(formData.get("format") ?? "pdf");
  const language = String(formData.get("language") ?? "sw");
  const price_tzs = Number(formData.get("price_tzs"));
  if (!title || title.length > 180 || !["pdf","epub","audiobook"].includes(format) || !["sw","en","other"].includes(language) || !Number.isSafeInteger(price_tzs) || price_tzs < 0) return {ok:false,error:"Kagua jina, muundo, lugha na bei ya kitabu."};
  const { data, error } = await supabase.from("books").insert({
    seller_id:user.id,title,author_name,description,category,format,language,price_tzs,status:"pending"
  }).select("id").single();
  if (error || !data) return {ok:false,error:error?.message ?? "Kitabu hakikuweza kuanzishwa."};
  return {ok:true,bookId:data.id};
}

export async function finishBookUpload(bookId:string,filePath:string,coverPath:string): Promise<{ok:true}|{ok:false;error:string}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {ok:false,error:"Tafadhali ingia tena."};
  const expectedPrefix = `${user.id}/${bookId}/`;
  if (!filePath.startsWith(expectedPrefix) || !coverPath.startsWith(expectedPrefix)) return {ok:false,error:"Njia ya faili si sahihi."};
  const { error } = await supabase.from("books").update({file_path:filePath,cover_path:coverPath}).eq("id",bookId).eq("seller_id",user.id).eq("status","pending");
  if (error) return {ok:false,error:error.message};
  return {ok:true};
}
