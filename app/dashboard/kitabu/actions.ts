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
  const price_tzs = Number(formData.get("price_tzs") ?? 0);
  if (!title || title.length > 180 || !["pdf","epub","audiobook"].includes(format) || !["sw","en","other"].includes(language) || !Number.isSafeInteger(price_tzs) || price_tzs < 0 || price_tzs > 100000000) return {ok:false,error:"Kagua jina, muundo, lugha na bei ya kitabu."};
  const { data, error } = await supabase.from("books").insert({
    seller_id:user.id,title,author_name,description,category,format,language,price_tzs,status:"pending"
  }).select("id").single();
  if (error || !data) return {ok:false,error:error?.message ?? "Kitabu hakikuweza kuanzishwa."};
  return {ok:true,bookId:data.id};
}

export async function finishBookUpload(bookId:string,filePath:string,coverPath:string,previewPath:string|null = null): Promise<{ok:true}|{ok:false;error:string}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {ok:false,error:"Tafadhali ingia tena."};
  const expectedPrefix = `${user.id}/${bookId}/`;
  if (!filePath.startsWith(expectedPrefix) || !coverPath.startsWith(expectedPrefix) || (previewPath && !previewPath.startsWith(expectedPrefix))) return {ok:false,error:"Njia ya faili si sahihi."};
  const {data:book}=await supabase.from("books").select("price_tzs").eq("id",bookId).eq("seller_id",user.id).eq("status","pending").maybeSingle();
  if (!book) return {ok:false,error:"Kitabu hakijapatikana."};
  if (book.price_tzs > 0 && !previewPath) return {ok:false,error:"Kitabu cha kulipia lazima kiwe na faili la sampuli ya bure."};
  if (previewPath) {
    const previewName = previewPath.split("/").pop();
    const { data: stored, error: storageError } = await supabase.storage.from("book-files").list(user.id+"/"+bookId);
    const previewFile = stored?.find(file => file.name === previewName);
    if (storageError || !previewFile) return {ok:false,error:"Sampuli iliyotengenezwa haijapatikana kwenye hifadhi."};
    const previewSize = Number(previewFile.metadata?.size ?? previewFile.metadata?.contentLength ?? 0);
    if (previewSize > 35 * 1024 * 1024) return {ok:false,error:"Sampuli ya bure haiwezi kuzidi MB 35."};
  }
  const { error } = await supabase.from("books").update({file_path:filePath,cover_path:coverPath,preview_path:previewPath}).eq("id",bookId).eq("seller_id",user.id).eq("status","pending");
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
  let phone_number=String(formData.get("phone_number")||"").trim().replace(/[\s()-]/g,"");
  if(phone_number.startsWith("+")) phone_number=phone_number.slice(1);
  if(/^0[67]\d{8}$/.test(phone_number)) phone_number="255"+phone_number.slice(1);
  if(!["mixx","mpesa","airtel_money","tigo_pesa"].includes(provider)||!/^255[67]\d{8}$/.test(phone_number)||!account_name) return {ok:false,error:"Weka mtandao, jina la akaunti na namba sahihi ya simu."};
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
  const price_tzs=Number(formData.get("price_tzs")??0);
  if(!title||title.length>180||!["sw","en","other"].includes(language)||!Number.isSafeInteger(price_tzs)||price_tzs<0||price_tzs>100000000) return {ok:false,error:"Kagua taarifa na bei ya kitabu."};
  const {data:existingBook}=await supabase.from("books").select("preview_path,format").eq("id",bookId).eq("seller_id",user.id).maybeSingle();
  if(price_tzs>0&&!existingBook?.preview_path&&existingBook?.format!=="audiobook") return {ok:false,error:"Kitabu cha kulipia kinahitaji sampuli ya bure. Wasiliana na Admin ili kuweka sampuli."};
  if(price_tzs>0&&existingBook?.format==="audiobook"){const {data:previewChapters}=await supabase.from("book_audio_chapters").select("id").eq("book_id",bookId).eq("is_preview",true).limit(1);if(!previewChapters?.length)return {ok:false,error:"Audiobook ya kulipia inahitaji angalau sura moja ya sampuli ya bure."};}
  const {count: soldCount,error: soldError}=await supabase.from("order_items").select("id",{count:"exact",head:true}).eq("book_id",bookId);
  if(soldError) return {ok:false,error:"Imeshindikana kukagua historia ya mauzo."};
  if((soldCount??0)>0) return {ok:false,error:"Kitabu hiki tayari kimenunuliwa. Huwezi kubadilisha toleo lililonunuliwa; wasiliana na Admin kwa marekebisho."};
  const {error}=await supabase.from("books").update({title,author_name,description,category,language,price_tzs,status:"pending"}).eq("id",bookId).eq("seller_id",user.id);
  if(error) return {ok:false,error:error.message};
  return {ok:true};
}


export async function replaceSellerBookPdf(bookId:string,newFilePath:string,newPreviewPath:string|null=null):Promise<{ok:true}|{ok:false;error:string}> {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false,error:"Ingia kwanza."};
  const {data:application}=await supabase.from("seller_applications").select("status").eq("user_id",user.id).maybeSingle();
  if(application?.status!=="approved") return {ok:false,error:"Akaunti ya muuzaji haijaidhinishwa."};
  const expectedPrefix=user.id+"/"+bookId+"/";
  if(!newFilePath.startsWith(expectedPrefix)||!newFilePath.toLowerCase().endsWith(".pdf")||(newPreviewPath!==null&&(!newPreviewPath.startsWith(expectedPrefix)||!newPreviewPath.toLowerCase().endsWith(".pdf")))) return {ok:false,error:"Njia ya PDF au sampuli si sahihi."};
  const {data:book,error:bookError}=await supabase.from("books").select("id,file_path,preview_path,price_tzs").eq("id",bookId).eq("seller_id",user.id).maybeSingle();
  if(bookError||!book) return {ok:false,error:"Kitabu hakijapatikana."};
  if(book.price_tzs>0&&!newPreviewPath) return {ok:false,error:"Kitabu cha kulipia kinahitaji sampuli mpya ya Sura ya Kwanza."};
  const {count,error:countError}=await supabase.from("order_items").select("id",{count:"exact",head:true}).eq("book_id",bookId);
  if(countError) return {ok:false,error:"Imeshindikana kukagua historia ya kitabu."};
  if((count??0)>0) return {ok:false,error:"Kitabu hiki kina historia ya mauzo; wasiliana na Admin kabla ya kubadilisha PDF."};
  const filename=newFilePath.split("/").pop();
  const {data:stored,error:listError}=await supabase.storage.from("book-files").list(user.id+"/"+bookId);
  if(listError||!stored?.some(file=>file.name===filename)) return {ok:false,error:"PDF mpya haijapatikana kwenye hifadhi."};
  if(newPreviewPath){const previewName=newPreviewPath.split("/").pop();if(!stored?.some(file=>file.name===previewName)) return {ok:false,error:"Sampuli mpya haijapatikana kwenye hifadhi."};}
  const {error}=await supabase.from("books").update({file_path:newFilePath,preview_path:newPreviewPath,format:"pdf",status:"pending",approved_by:null,approved_at:null}).eq("id",bookId).eq("seller_id",user.id);
  if(error) return {ok:false,error:error.message};
  const oldPaths=[book.file_path,book.preview_path].filter((path):path is string=>Boolean(path)&&path!==newFilePath&&path!==newPreviewPath);
  if(oldPaths.length) await supabase.storage.from("book-files").remove(oldPaths);
  return {ok:true};
}

export async function deleteSellerBook(bookId:string):Promise<{ok:true}|{ok:false;error:string}> {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false,error:"Ingia kwanza."};
  const {data:application}=await supabase.from("seller_applications").select("status").eq("user_id",user.id).maybeSingle();
  if(application?.status!=="approved") return {ok:false,error:"Akaunti ya muuzaji haijaidhinishwa."};
  const {data:book,error:readError}=await supabase.from("books").select("id,file_path,preview_path,cover_path,format").eq("id",bookId).eq("seller_id",user.id).maybeSingle();
  if(readError||!book) return {ok:false,error:"Kitabu hakijapatikana."};
  const {count,error:countError}=await supabase.from("order_items").select("id",{count:"exact",head:true}).eq("book_id",bookId);
  if(countError) return {ok:false,error:countError.message};
  if((count??0)>0) return {ok:false,error:"Kitabu hiki tayari kimenunuliwa. Huwezi kukifuta kabisa ili kuhifadhi historia ya wanunuzi; badala yake wasiliana na Admin akiondoe kwenye maktaba."};
  const paths=[book.file_path,book.preview_path,book.cover_path].filter(Boolean) as string[];
  if(book.format==="audiobook"){const {data:chapters}=await supabase.from("book_audio_chapters").select("audio_path").eq("book_id",bookId).eq("seller_id",user.id);for(const chapter of chapters??[])paths.push(chapter.audio_path);}
  const {error}=await supabase.from("books").delete().eq("id",bookId).eq("seller_id",user.id);
  if(error) return {ok:false,error:error.message};
  if(paths.length) await supabase.storage.from("book-files").remove([...new Set(paths)]);
  return {ok:true};
}


export async function finishAudiobookUpload(bookId:string,coverPath:string,chapters:{title:string;audioPath:string;isPreview:boolean}[]):Promise<{ok:true}|{ok:false;error:string}> {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {ok:false,error:"Tafadhali ingia tena."};
  const prefix=user.id+"/"+bookId+"/";
  if(!coverPath.startsWith(prefix)||!chapters.length||chapters.length>100) return {ok:false,error:"Taarifa za audiobook si sahihi."};
  if(chapters.some((c,i)=>!c.title.trim()||c.title.trim().length>180||!c.audioPath.startsWith(prefix)||!(/\.(mp3|m4a)$/i.test(c.audioPath))||!Number.isInteger(i+1))) return {ok:false,error:"Kagua majina na faili za sura."};
  const {data:book}=await supabase.from("books").select("id,price_tzs").eq("id",bookId).eq("seller_id",user.id).eq("status","pending").eq("format","audiobook").maybeSingle();
  if(!book) return {ok:false,error:"Rasimu ya audiobook haijapatikana."};
  if(book.price_tzs>0&&!chapters.some(c=>c.isPreview)) return {ok:false,error:"Kwa audiobook ya kulipia, chagua angalau sura moja ya sampuli ya bure."};
  const {data:files,error:listError}=await supabase.storage.from("book-files").list(user.id+"/"+bookId);
  if(listError) return {ok:false,error:"Imeshindikana kuthibitisha faili zilizopakiwa."};
  const names=new Set((files??[]).map(f=>f.name));
  if(!names.has(coverPath.split("/").pop()!)||chapters.some(c=>!names.has(c.audioPath.split("/").pop()!))) return {ok:false,error:"Baadhi ya faili hazijafika kwenye hifadhi."};
  const rows=chapters.map((c,i)=>({book_id:bookId,seller_id:user.id,chapter_index:i+1,title:c.title.trim(),audio_path:c.audioPath,is_preview:c.isPreview}));
  const {error:chapterError}=await supabase.from("book_audio_chapters").insert(rows);
  if(chapterError) return {ok:false,error:chapterError.message};
  const {error}=await supabase.from("books").update({file_path:chapters[0].audioPath,cover_path:coverPath,preview_path:null}).eq("id",bookId).eq("seller_id",user.id).eq("status","pending");
  if(error){await supabase.from("book_audio_chapters").delete().eq("book_id",bookId).eq("seller_id",user.id);return {ok:false,error:error.message};}
  return {ok:true};
}
