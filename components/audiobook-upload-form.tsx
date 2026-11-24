"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { createBookDraft, finishAudiobookUpload } from "@/app/dashboard/kitabu/actions";
import { useLanguage } from "@/components/language-provider";

type Chapter={title:string;file:File|null;isPreview:boolean};
const MAX_AUDIO_SIZE=100*1024*1024;

export function AudiobookUploadForm(){
  const { en } = useLanguage();
  const [chapters,setChapters]=useState<Chapter[]>([{title:"Sura ya Kwanza",file:null,isPreview:true}]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [progress,setProgress]=useState("");
  function patch(index:number,values:Partial<Chapter>){setChapters(current=>current.map((c,i)=>i===index?{...c,...values}:c));}
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");setProgress("");
    const uploaded:string[]=[];
    try{
      const form=event.currentTarget;const data=new FormData(form);
      const cover=data.get("cover_file");
      if(!(cover instanceof File)||!cover.size)throw new Error("{en ? "Choose a book cover." : "Chagua jalada la kitabu."}");
      if(cover.size>8*1024*1024||!["image/jpeg","image/png","image/webp"].includes(cover.type))throw new Error("{en ? "The cover must be JPG, PNG or WebP and no larger than 8 MB." : "Jalada liwe JPG, PNG au WebP na lisizidi MB 8."}");
      if(!chapters.length||chapters.some(c=>!c.title.trim()||!c.file))throw new Error("{en ? "Enter a title and choose a file for every chapter." : "Jaza jina na faili la kila sura."}");
      if(chapters.some(c=>!c.file||c.file.size>MAX_AUDIO_SIZE||!(/\.(mp3|m4a)$/i.test(c.file.name))))throw new Error("{en ? "Audio files must be MP3 or M4A and no larger than 100 MB each." : "Sauti ziwe MP3 au M4A na zisizidi MB 100 kila moja."}");
      const price=Number(data.get("price_tzs")||0);
      if(!Number.isSafeInteger(price)||price<0||price>100000000)throw new Error("{en ? "Enter a valid book price." : "Weka bei sahihi ya kitabu."}");
      if(price>0&&!chapters.some(c=>c.isPreview))throw new Error("{en ? "Select at least one free preview chapter for a paid audiobook." : "Chagua angalau sura moja ya sampuli ya bure kwa kitabu cha kulipia."}");
      const metadata=new FormData();
      ["title","author_name","description","category","language","price_tzs"].forEach(k=>metadata.set(k,String(data.get(k)||"")));
      metadata.set("format","audiobook");
      setProgress("{en ? "Preparing audiobook details..." : "Inaandaa taarifa za audiobook..."}");
      const draft=await createBookDraft(metadata);if(!draft.ok)throw new Error(draft.error);
      const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
      const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("{en ? "Please sign in again to continue." : "Ingia tena ili kuendelea."}");
      const base=user.id+"/"+draft.bookId+"/";
      const coverExt=cover.name.split(".").pop()?.toLowerCase()||"jpg";
      const coverPath=base+"cover-audiobook."+coverExt;
      setProgress("{en ? "Uploading cover..." : "Inapakia jalada..."}");
      const coverResult=await supabase.storage.from("book-files").upload(coverPath,cover,{upsert:false,contentType:cover.type});
      if(coverResult.error)throw new Error(coverResult.error.message);uploaded.push(coverPath);
      const uploadedChapters:{title:string;audioPath:string;isPreview:boolean}[]=[];
      for(let i=0;i<chapters.length;i++){
        const chapter=chapters[i];const file=chapter.file!;
        const ext=file.name.toLowerCase().endsWith(".m4a")?"m4a":"mp3";
        const path=base+"audio-chapter-"+String(i+1).padStart(3,"0")+"."+ext;
        setProgress((en ? "Uploading chapter " : "Inapakia sura ")+(i+1)+(en ? " of " : " kati ya ")+chapters.length+"...");
        const result=await supabase.storage.from("book-files").upload(path,file,{upsert:false,contentType:ext==="m4a"?"audio/mp4":"audio/mpeg"});
        if(result.error)throw new Error(result.error.message);
        uploaded.push(path);uploadedChapters.push({title:chapter.title,audioPath:path,isPreview:chapter.isPreview});
      }
      setProgress("{en ? "Saving chapter order..." : "Inahifadhi mpangilio wa sura..."}");
      const done=await finishAudiobookUpload(draft.bookId,coverPath,uploadedChapters);if(!done.ok)throw new Error(done.error);
      uploaded.length=0;setMessage("{en ? "Audiobook submitted to the administrator for review." : "Audiobook imewasilishwa kwa Admin kwa ukaguzi."}");setProgress("");form.reset();setChapters([{title:"Sura ya Kwanza",file:null,isPreview:true}]);
    }catch(error){
      if(uploaded.length){try{const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);await supabase.storage.from("book-files").remove(uploaded);}catch{}}
      setMessage(error instanceof Error?error.message:"{en ? "Could not upload the audiobook." : "Imeshindikana kupakia audiobook."}");setProgress("");
    }finally{setBusy(false);}
  }
  return <form onSubmit={submit} className="panel form" style={{marginTop:24}}>
    <h2>{en ? "Upload audiobook" : "Pakia audiobook (kitabu cha kusikiliza)"}</h2>
    <p className="muted">{en ? "Upload each chapter audio separately. Files are stored privately and the audiobook will appear after administrator approval." : "Pakia sauti ya kila sura kivyake. Faili zinahifadhiwa faragha na audiobook itaonekana baada ya Admin kuiidhinisha."}</p>
    <div className="field"><label>{en ? "Audiobook title" : "Jina la audiobook"}</label><input name="title" required maxLength={180}/></div>
    <div className="field"><label>{en ? "Author" : "Mwandishi"}</label><input name="author_name" maxLength={160}/></div>
    <div className="field"><label>{en ? "Description" : "Maelezo"}</label><textarea name="description" maxLength={3000}/></div>
    <div className="field"><label>{en ? "Category" : "Kategoria"}</label><select name="category"><option value="elimu">Elimu</option><option value="biashara">Biashara</option><option value="maendeleo-binafsi">Maendeleo binafsi</option><option value="hadithi">Hadithi na fasihi</option><option value="dini">Dini</option><option value="teknolojia">Teknolojia</option><option value="nyingine">Nyingine</option></select></div>
    <div className="field"><label>{en ? "Language" : "Lugha"}</label><select name="language"><option value="sw">Kiswahili</option><option value="en">English</option><option value="other">Nyingine</option></select></div>
    <div className="field"><label>{en ? "Price (TZS)" : "Bei (TZS)"}</label><input name="price_tzs" type="number" min="0" max="100000000" step="1" defaultValue="0" required/></div>
    <div className="field"><label>{en ? "Cover (JPG, PNG, WebP; up to 8 MB)" : "Jalada (JPG, PNG, WebP; hadi MB 8)"}</label><input name="cover_file" type="file" accept="image/jpeg,image/png,image/webp" required/></div>
    <h3>{en ? "Audiobook chapters" : "Sura za audiobook"}</h3>
    {chapters.map((chapter,index)=><section key={index} className="notice" style={{marginBottom:12}}>
      <div className="field"><label>{en ? "Chapter title {index+1}" : "Jina la sura {index+1}"}</label><input value={chapter.title} onChange={e=>patch(index,{title:e.target.value})} required maxLength={180}/></div>
      <div className="field"><label>{en ? "Audio file (MP3/M4A; up to 100 MB)" : "Faili la sauti (MP3/M4A; hadi MB 100)"}</label><input type="file" accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a" onChange={e=>patch(index,{file:e.target.files?.[0]||null})} required/></div>
      <label style={{display:"flex",gap:8,alignItems:"center"}}><input type="checkbox" checked={chapter.isPreview} onChange={e=>patch(index,{isPreview:e.target.checked})}/> {en ? "Make this chapter a free preview" : "Ruhusu sura hii kuwa sampuli ya bure"}</label>
      {chapters.length>1&&<button type="button" className="btn btn-outline" onClick={()=>setChapters(current=>current.filter((_,i)=>i!==index))}>{en ? "Remove chapter" : "Ondoa sura hii"}</button>}
    </section>)}
    <button type="button" className="btn btn-outline" onClick={()=>setChapters(current=>[...current,{title:"Sura ya "+["Pili","Tatu","Nne","Tano"][Math.min(current.length-1,4)]||"Ziada",file:null,isPreview:false}])}>{en ? "+ Add chapter" : "+ Ongeza sura"}</button>
    {progress&&<p className="muted" role="status">{progress}</p>}
    {message&&<p className={message.startsWith("Audiobook imewasilishwa")?"notice":"message"} role="status">{message}</p>}
    <button className="btn" disabled={busy}>{busy?(en?"Processing...":"Inachakata..."):(en?"Submit audiobook for review":"Wasilisha audiobook kwa ukaguzi")}</button>
    <p className="muted">{en ? "You can upload up to 100 chapters. Make sure you have the rights to use the audio files." : "Unaweza kupakia hadi sura 100. Hakikisha una haki ya kutumia sauti unazopakia."}</p>
  </form>;
}
