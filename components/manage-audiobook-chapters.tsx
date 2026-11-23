"use client";

import {useState} from "react";
import {createBrowserClient} from "@supabase/ssr";
import {addAudiobookChapter,updateAudiobookChapter} from "@/app/dashboard/kitabu/actions";

type Chapter={id:string;chapter_index:number;title:string;audio_path:string;is_preview:boolean};
const MAX_AUDIO_SIZE=100*1024*1024;

export default function ManageAudiobookChapters({bookId,initialChapters,price}:{bookId:string;initialChapters:Chapter[];price:number}){
  const [chapters,setChapters]=useState(initialChapters);
  const [title,setTitle]=useState("");
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function uploadAudio(selected:File){
    if(selected.size>MAX_AUDIO_SIZE||!(/\.(mp3|m4a)$/i.test(selected.name))) throw new Error("Sauti iwe MP3 au M4A na isizidi MB 100.");
    const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) throw new Error("Ingia tena ili kuendelea.");
    const ext=selected.name.toLowerCase().endsWith(".m4a")?"m4a":"mp3";
    const path=user.id+"/"+bookId+"/audio-chapter-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
    const {error}=await supabase.storage.from("book-files").upload(path,selected,{upsert:false,contentType:ext==="m4a"?"audio/mp4":"audio/mpeg"});
    if(error) throw new Error(error.message);
    return {supabase,path};
  }
  async function addChapter(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!file||!title.trim())return;
    setBusy(true);setMessage("");
    let uploaded:{supabase:ReturnType<typeof createBrowserClient>;path:string}|null=null;
    try{
      uploaded=await uploadAudio(file);
      const result=await addAudiobookChapter(bookId,title,uploaded.path,preview);
      if(!result.ok)throw new Error(result.error);
      setChapters(current=>[...current,{id:"new-"+Date.now(),chapter_index:Math.max(0,...current.map(c=>c.chapter_index))+1,title:title.trim(),audio_path:uploaded!.path,is_preview:preview}]);
      setTitle("");setFile(null);setPreview(false);event.currentTarget.reset();
      setMessage("Sura mpya imeongezwa. Audiobook imerudishwa kwa Admin kwa ukaguzi.");
    }catch(error){
      if(uploaded)await uploaded.supabase.storage.from("book-files").remove([uploaded.path]);
      setMessage(error instanceof Error?error.message:"Imeshindikana kuongeza sura.");
    }finally{setBusy(false);}
  }
  async function saveChapter(chapter:Chapter,index:number,form:HTMLFormElement){
    const data=new FormData(form);const nextTitle=String(data.get("title")||"").trim();
    const nextPreview=data.get("is_preview")==="on";
    const selected=(data.get("audio") instanceof File&&(data.get("audio") as File).size>0)?data.get("audio") as File:null;
    setBusy(true);setMessage("");let uploaded:{supabase:ReturnType<typeof createBrowserClient>;path:string}|null=null;
    try{
      if(selected)uploaded=await uploadAudio(selected);
      const result=await updateAudiobookChapter(bookId,chapter.id,nextTitle,uploaded?.path||null,nextPreview);
      if(!result.ok)throw new Error(result.error);
      setChapters(current=>current.map((c,i)=>i===index?{...c,title:nextTitle,is_preview:nextPreview,audio_path:uploaded?.path||c.audio_path}:c));
      form.reset();
      setMessage("Mabadiliko ya sura yamehifadhiwa. Audiobook imerudishwa kwa Admin kwa ukaguzi.");
    }catch(error){
      if(uploaded)await uploaded.supabase.storage.from("book-files").remove([uploaded.path]);
      setMessage(error instanceof Error?error.message:"Imeshindikana kuhifadhi sura.");
    }finally{setBusy(false);}
  }
  return <section className="panel form" style={{marginTop:24}}>
    <h2>Simamia sura za audiobook</h2>
    <p className="muted">Unaweza kuongeza sura mpya au kubadilisha jina, faili na sampuli ya sura iliyopo. Sura nyingine hazitaathirika. Mabadiliko yatapelekwa kwa Admin kuidhinishwa tena.</p>
    {chapters.length?chapters.map((chapter,index)=><form key={chapter.id} className="notice" style={{marginBottom:14}} onSubmit={e=>{e.preventDefault();void saveChapter(chapter,index,e.currentTarget);}}>
      <h3>Sura ya {chapter.chapter_index}</h3>
      <div className="field"><label htmlFor={"chapter-title-"+chapter.id}>Jina la sura</label><input id={"chapter-title-"+chapter.id} name="title" defaultValue={chapter.title} required maxLength={180}/></div>
      <div className="field"><label htmlFor={"chapter-audio-"+chapter.id}>Badilisha sauti (hiari; MP3/M4A, hadi MB 100)</label><input id={"chapter-audio-"+chapter.id} name="audio" type="file" accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a"/></div>
      <label style={{display:"flex",gap:8,alignItems:"center"}}><input name="is_preview" type="checkbox" defaultChecked={chapter.is_preview}/> Ruhusu sura hii kuwa sampuli ya bure</label>
      <button className="btn btn-outline" disabled={busy} style={{marginTop:12}}>Hifadhi sura hii</button>
    </form>):<p className="muted">Bado hakuna sura zilizohifadhiwa.</p>}
    {chapters.length<100&&<form onSubmit={addChapter} className="notice" style={{marginTop:16}}>
      <h3>Ongeza sura nyingine</h3>
      <div className="field"><label htmlFor="new-chapter-title">Jina la sura mpya</label><input id="new-chapter-title" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={180} placeholder="Mfano: Sura ya Pili"/></div>
      <div className="field"><label htmlFor="new-chapter-audio">Faili la sauti (MP3/M4A; hadi MB 100)</label><input id="new-chapter-audio" type="file" accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a" onChange={e=>setFile(e.target.files?.[0]||null)} required/></div>
      <label style={{display:"flex",gap:8,alignItems:"center"}}><input type="checkbox" checked={preview} onChange={e=>setPreview(e.target.checked)}/> Ruhusu sura hii kuwa sampuli ya bure</label>
      <button className="btn" disabled={busy||!file||!title.trim()} style={{marginTop:12}}>{busy?"Inachakata...":"+ Ongeza sura"}</button>
    </form>}
    {message&&<p className="notice" role="status">{message}</p>}
    <p className="muted">Sura zilizopo: {chapters.length}/100. {price>0?"Audiobook ya kulipia lazima iwe na angalau sura moja ya sampuli ya bure.":""}</p>
  </section>;
}
