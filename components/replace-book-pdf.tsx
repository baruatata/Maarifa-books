"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { replaceSellerBookPdf } from "@/app/dashboard/kitabu/actions";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export function ReplaceBookPdf({bookId,currentFilePath,format}:{bookId:string;currentFilePath:string|null;format:string}) {
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const router=useRouter();

  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input=event.currentTarget.elements.namedItem("replacement_pdf") as HTMLInputElement;
    const file=input.files?.[0];
    if(!file) { setMessage("Chagua PDF mpya kwanza."); return; }
    if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf")) { setMessage("Tafadhali chagua faili la PDF."); return; }
    if(file.size>MAX_FILE_SIZE) { setMessage("PDF isizidi MB 100."); return; }
    setBusy(true); setMessage("Inapakia PDF mpya...");
    const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    try {
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) throw new Error("Ingia tena ili kuendelea.");
      const path=user.id+"/"+bookId+"/book-replacement-"+Date.now()+".pdf";
      const uploaded=await supabase.storage.from("book-files").upload(path,file,{upsert:false,contentType:"application/pdf"});
      if(uploaded.error) throw new Error(uploaded.error.message);
      const result=await replaceSellerBookPdf(bookId,path);
      if(!result.ok) {
        await supabase.storage.from("book-files").remove([path]);
        throw new Error(result.error);
      }
      setMessage("PDF imebadilishwa na kitabu kimerudishwa kwa Admin kukaguliwa.");
      router.refresh();
    } catch(error) {
      setMessage(error instanceof Error?error.message:"Imeshindikana kubadilisha PDF.");
    } finally { setBusy(false); }
  }

  return <section className="panel form" style={{marginTop:20}}>
    <h2>Badilisha PDF ya kitabu</h2>
    <p className="muted">Muundo wa sasa: {format.toUpperCase()}. Ukipakia PDF mpya, itachukua nafasi ya faili la zamani na kitabu kitarudi kwa Admin kukaguliwa.</p>
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="replacement-pdf">Chagua PDF mpya (hadi MB 100)</label><input id="replacement-pdf" name="replacement_pdf" type="file" accept="application/pdf,.pdf" required /></div>
      {message&&<p className={message.startsWith("PDF imebadilishwa")?"notice":"message"} role="status">{message}</p>}
      <button className="btn" type="submit" disabled={busy}>{busy?"Inapakia...":"Badilisha PDF"}</button>
    </form>
  </section>;
}
