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

export async function saveSellerPayoutMethod(formData:FormData):Promise<{ok:true}|{ok:false;error:string}> {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false,error:"Ingia kwanza."};
  const {data:application}=await supabase.from("seller_applications").select("status").eq("user_id",user.id).maybeSingle();
  if(application?.status!=="approved") return {ok:false,error:"Akaunti ya muuzaji haijaidhinishwa."};
  const provider=String(formData.get("provider")||"");
  const account_name=String(formData.get("account_name")||"").trim();
  let phone_number=String(formData.get("phone_number")||"").trim().replace(/[\\s()-]/g,"");
  if(phone_number.startsWith("+")) phone_number=phone_number.slice(1);
  if(/^0[67]\\d{8}$/.test(phone_number)) phone_number="255"+phone_number.slice(1);
  if(!["mixx","mpesa","airtel_money","tigo_pesa"].includes(provider)||!/^255[67]\\d{8}$/.test(phone_number)||!account_name) return {ok:false,error:"Weka mtandao, jina la akaunti na namba sahihi ya simu."};
  const {error}=await supabase.from("seller_payout_methods").upsert({seller_id:user.id,provider,phone_number,account_name,updated_at:new Date().toISOString()},{onConflict:"seller_id"});
  if(error) return {ok:false,error:error.message};
  return {ok:true};
}

export async function updateSellerBook(bookId:string,formData:FormData):Promise<{ok:true}|{ok:false;error:string}> {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false,error:"Ingia kwanza."};
  const {data:application}=await supabase.from("seller_applications").select("status").eq("user_id",user.id).maybeSingle();
  if(application?.status!=="approved") return {ok:false,error:"Akaunti ya muuzaji haijaidhinishwa."};
  const title=String(formData.get("title")||"").trim();
  const author_name=String(formData.get("author_name")||"").trim();
  const description=String(formData.get("description")||"").trim();
  const category=String(formData.get("category")||"nyingine");
  const language=String(formData.get("language")||"sw");
  const price_tzs=Number(formData.get("price_tzs"));
  if(!title||title.length>180||!["sw","en","other"].includes(language)||!Number.isSafeInteger(price_tzs)||price_tzs<0) return {ok:false,error:"Kagua taarifa na bei ya kitabu."};
  const {error}=await supabase.from("books").update({title,author_name,description,category,language,price_tzs,status:"pending"}).eq("id",bookId).eq("seller_id",user.id);
  if(error) return {ok:false,error:error.message};
  return {ok:true};
}

export async function deleteSellerBook(bookId:string):Promise<{ok:true}|{ok:false;error:string}> {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false,error:"Ingia kwanza."};
  const {data:application}=await supabase.from("seller_applications").select("status").eq("user_id",user.id).maybeSingle();
  if(application?.status!=="approved") return {ok:false,error:"Akaunti ya muuzaji haijaidhinishwa."};
  const {data:book,error:readError}=await supabase.from("books").select("id,file_path,cover_path").eq("id",bookId).eq("seller_id",user.id).maybeSingle();
  if(readError||!book) return {ok:false,error:"Kitabu hakijapatikana."};
  const {count,error:countError}=await supabase.from("order_items").select("id",{count:"exact",head:true}).eq("book_id",bookId);
  if(countError) return {ok:false,error:countError.message};
  if((count??0)>0) return {ok:false,error:"Kitabu hiki tayari kimenunuliwa. Huwezi kukifuta kabisa ili kuhifadhi historia ya wanunuzi; badala yake wasiliana na Admin akiondoe kwenye maktaba."};
  const {error}=await supabase.from("books").delete().eq("id",bookId).eq("seller_id",user.id);
  if(error) return {ok:false,error:error.message};
  const paths=[book.file_path,book.cover_path].filter(Boolean) as string[];
  if(paths.length) await supabase.storage.from("book-files").remove(paths);
  return {ok:true};
}
