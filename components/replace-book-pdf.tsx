"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { replaceSellerBookPdf } from "@/app/dashboard/kitabu/actions";
import { createFirstChapterPreview } from "@/lib/book-preview";
import { useLanguage } from "@/components/language-provider";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_PREVIEW_SIZE = 35 * 1024 * 1024;

export function ReplaceBookPdf({bookId,currentFilePath,format,isPaid}:{bookId:string;currentFilePath:string|null;format:string;isPaid:boolean}) {
  const { en } = useLanguage();
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const router=useRouter();

  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input=event.currentTarget.elements.namedItem("replacement_pdf") as HTMLInputElement;
    const file=input.files?.[0];
    if(!file) { setMessage((en ? "Choose a new PDF first." : "Chagua PDF mpya kwanza.")); return; }
    if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf")) { setMessage((en ? "Please choose a PDF file." : "Tafadhali chagua faili la PDF.")); return; }
    if(file.size>MAX_FILE_SIZE) { setMessage((en ? "The PDF must not exceed 100 MB." : "PDF isizidi MB 100.")); return; }
    setBusy(true); setMessage(isPaid?(en ? "Analyzing Chapter One and preparing the preview..." : "Inachambua sura ya kwanza na kuandaa sampuli..."):(en ? "Uploading the new PDF..." : "Inapakia PDF mpya..."));
    const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    const uploadedPaths:string[]=[];
    try {
      let previewBlob:Blob|null=null;
      if(isPaid) {
        previewBlob=await createFirstChapterPreview(file,"pdf");
        if(previewBlob.size>MAX_PREVIEW_SIZE) throw new Error((en ? "The Chapter One preview exceeds 35 MB." : "Sampuli ya Sura ya Kwanza imezidi MB 35."));
      }
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) throw new Error((en ? "Please sign in again to continue." : "Ingia tena ili kuendelea."));
      const suffix=Date.now();
      const path=user.id+"/"+bookId+"/book-replacement-"+suffix+".pdf";
      const previewPath=previewBlob?user.id+"/"+bookId+"/preview-replacement-"+suffix+".pdf":null;
      const uploaded=await supabase.storage.from("book-files").upload(path,file,{upsert:false,contentType:"application/pdf"});
      if(uploaded.error) throw new Error(uploaded.error.message);
      uploadedPaths.push(path);
      if(previewBlob&&previewPath) {
        setMessage((en ? "Uploading the Chapter One preview..." : "Inapakia sampuli ya Sura ya Kwanza..."));
        const previewUpload=await supabase.storage.from("book-files").upload(previewPath,previewBlob,{upsert:false,contentType:"application/pdf"});
        if(previewUpload.error) throw new Error(previewUpload.error.message);
        uploadedPaths.push(previewPath);
      }
      const result=await replaceSellerBookPdf(bookId,path,previewPath);
      if(!result.ok) throw new Error(result.error);
      uploadedPaths.length=0;
      setMessage(isPaid?(en ? "The PDF and Chapter One preview have been replaced. The book has been returned to the administrator for review." : "PDF na sampuli ya Sura ya Kwanza vimebadilishwa. Kitabu kimerudi kwa Admin kukaguliwa."):(en ? "The PDF has been replaced and the book has been returned to the administrator for review." : "PDF imebadilishwa na kitabu kimerudi kwa Admin kukaguliwa."));
      router.refresh();
    } catch(error) {
      if(uploadedPaths.length) await supabase.storage.from("book-files").remove(uploadedPaths);
      setMessage(error instanceof Error?error.message:(en ? "Could not replace the PDF." : "Imeshindikana kubadilisha PDF."));
    } finally { setBusy(false); }
  }

  return <section className="panel form" style={{marginTop:20}}>
    <h2>{en ? "Replace book PDF" : "Badilisha PDF ya kitabu"}</h2>
    <p className="muted">{en ? `Current format: ${format.toUpperCase()}. If you upload a new PDF, the system will regenerate the Chapter One preview for a paid book.` : `Muundo wa sasa: ${format.toUpperCase()}. Ukipakia PDF mpya, mfumo utatengeneza upya sampuli ya Sura ya Kwanza kwa kitabu cha kulipia.`}</p>
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="replacement-pdf">{en ? "Choose a new PDF (up to 100 MB)" : "Chagua PDF mpya (hadi MB 100)"}</label><input id="replacement-pdf" name="replacement_pdf" type="file" accept="application/pdf,.pdf" required /></div>
      {message&&<p className={message.includes("vimerudi")||message.startsWith("PDF imebadilishwa")||message.startsWith("The PDF")?"notice":"message"} role="status">{message}</p>}
      <button className="btn" type="submit" disabled={busy}>{busy?(en ? "Processing..." : "Inachakata..."):(en ? "Replace PDF" : "Badilisha PDF")}</button>
    </form>
  </section>;
}
