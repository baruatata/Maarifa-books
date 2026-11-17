"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { createBookDraft, finishBookUpload } from "@/app/dashboard/kitabu/actions";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_PREVIEW_SIZE = 35 * 1024 * 1024;

function validBookFile(file: File, format: string) {
  if (format === "pdf") return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  return file.type === "application/epub+zip" || file.type === "application/octet-stream" || file.name.toLowerCase().endsWith(".epub");
}

export function UploadBookForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");

  async function submit(formData: FormData) {
    setBusy(true);
    setMessage("");
    setProgress("");
    const uploadedPaths: string[] = [];
    try {
      const bookFile = formData.get("book_file");
      const coverFile = formData.get("cover_file");
      const previewFile = formData.get("preview_file");
      const format = String(formData.get("format") ?? "pdf");
      const price = Number(formData.get("price_tzs") ?? 0);
      if (!(bookFile instanceof File) || bookFile.size === 0) throw new Error("Chagua faili kamili la kitabu kwanza.");
      if (!(coverFile instanceof File) || coverFile.size === 0) throw new Error("Chagua picha ya jalada kwanza.");
      if (!Number.isSafeInteger(price) || price < 0 || price > 100000000) throw new Error("Weka bei sahihi ya kitabu kwa TZS.");
      if (bookFile.size > MAX_FILE_SIZE) throw new Error("Faili la kitabu limezidi MB 100.");
      if (coverFile.size > 8 * 1024 * 1024) throw new Error("Jalada lisizidi MB 8.");
      if (!validBookFile(bookFile, format)) throw new Error("Faili la kitabu halilingani na muundo uliochagua.");
      if (![ "image/jpeg", "image/png", "image/webp" ].includes(coverFile.type)) throw new Error("Jalada liwe JPG, PNG au WebP.");
      if (price > 0) {
        if (!(previewFile instanceof File) || previewFile.size === 0) throw new Error("Kwa kitabu cha kulipia, pakia pia PDF/EPUB ya sampuli yenye angalau sura moja ya bure.");
        if (previewFile.size > MAX_PREVIEW_SIZE) throw new Error("Sampuli ya bure isizidi MB 35.");
        if (!validBookFile(previewFile, format)) throw new Error("Sampuli lazima iwe katika muundo uleule wa kitabu.");
      }
      const metadata = new FormData();
      ["title", "author_name", "description", "category", "format", "language", "price_tzs"].forEach((key) => metadata.set(key, String(formData.get(key) ?? "")));
      const draft = await createBookDraft(metadata);
      if (!draft.ok) throw new Error(draft.error);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ingia tena ili kuendelea.");
      const base = `${user.id}/${draft.bookId}/`;
      const ext = format === "epub" ? "epub" : "pdf";
      const coverExt = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${base}book.${ext}`;
      const coverPath = `${base}cover.${coverExt}`;
      const previewPath = price > 0 ? `${base}preview.${ext}` : null;
      setProgress("Inapakia kitabu kamili...");
      const bookUpload = await supabase.storage.from("book-files").upload(filePath, bookFile, { upsert: false, contentType: bookFile.type || undefined });
      if (bookUpload.error) throw new Error(bookUpload.error.message);
      uploadedPaths.push(filePath);
      setProgress("Inapakia jalada...");
      const coverUpload = await supabase.storage.from("book-files").upload(coverPath, coverFile, { upsert: false, contentType: coverFile.type });
      if (coverUpload.error) throw new Error(coverUpload.error.message);
      uploadedPaths.push(coverPath);
      if (previewFile instanceof File && previewPath) {
        setProgress("Inapakia sampuli ya bure...");
        const previewUpload = await supabase.storage.from("book-files").upload(previewPath, previewFile, { upsert: false, contentType: previewFile.type || undefined });
        if (previewUpload.error) throw new Error(previewUpload.error.message);
        uploadedPaths.push(previewPath);
      }
      const finished = await finishBookUpload(draft.bookId, filePath, coverPath, previewPath);
      if (!finished.ok) throw new Error(finished.error);
      setMessage("Kitabu kimewasilishwa kwa Admin kwa ukaguzi. Baada ya kuidhinishwa, wasomaji wataona sampuli ya bure na watawasiliana nawe WhatsApp kununua kitabu kizima.");
      setProgress("");
      (document.getElementById("upload-book-form") as HTMLFormElement | null)?.reset();
    } catch (error) {
      if (uploadedPaths.length) {
        try {
          const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
          await supabase.storage.from("book-files").remove(uploadedPaths);
        } catch { /* cleanup is best effort */ }
      }
      setMessage(error instanceof Error ? error.message : "Imeshindikana kupakia kitabu.");
      setProgress("");
    } finally {
      setBusy(false);
    }
  }

  return <form id="upload-book-form" action={submit} className="panel form upload-form">
    <h2>Taarifa za kitabu</h2>
    <div className="field"><label htmlFor="book-title">Jina la kitabu</label><input id="book-title" name="title" required maxLength={180}/></div>
    <div className="field"><label htmlFor="book-author">Mwandishi</label><input id="book-author" name="author_name" maxLength={160}/></div>
    <div className="field"><label htmlFor="book-description">Maelezo ya kitabu</label><textarea id="book-description" name="description" maxLength={3000}/></div>
    <div className="field"><label htmlFor="book-category">Kategoria</label><select id="book-category" name="category"><option value="elimu">Elimu</option><option value="biashara">Biashara</option><option value="maendeleo-binafsi">Maendeleo binafsi</option><option value="hadithi">Hadithi na fasihi</option><option value="dini">Dini</option><option value="teknolojia">Teknolojia</option><option value="nyingine">Nyingine</option></select></div>
    <div className="field"><label htmlFor="book-format">Muundo wa kitabu</label><select id="book-format" name="format"><option value="pdf">PDF</option><option value="epub">EPUB</option></select></div>
    <div className="field"><label htmlFor="book-language">Lugha</label><select id="book-language" name="language"><option value="sw">Kiswahili</option><option value="en">English</option><option value="other">Nyingine</option></select></div>
    <div className="field"><label htmlFor="book-price">Bei ya kitabu (TZS)</label><input id="book-price" name="price_tzs" type="number" min="0" max="100000000" step="1" defaultValue="0" required/><small className="muted">Weka 0 kama kitabu ni bure. Ukiweka bei, kitabu kitakuwa cha kulipia na sampuli ya bure itahitajika.</small></div>
    <div className="field"><label htmlFor="book-cover">Jalada la kitabu (JPG, PNG, WebP; hadi MB 8)</label><input id="book-cover" name="cover_file" type="file" accept="image/jpeg,image/png,image/webp" required/></div>
    <div className="field"><label htmlFor="book-file">Kitabu kamili (PDF/EPUB; hadi MB 100)</label><input id="book-file" name="book_file" type="file" accept=".pdf,.epub,application/pdf" required/></div>
    <div className="field"><label htmlFor="book-preview">Sampuli ya bure (PDF/EPUB; hadi MB 35)</label><input id="book-preview" name="preview_file" type="file" accept=".pdf,.epub,application/pdf"/><small className="muted">Kwa kitabu cha kulipia, tengeneza faili tofauti lenye sura unazotaka msomaji azisome bure (angalau sura moja). Faili kamili litafunguliwa baada ya coupon kuthibitishwa.</small></div>
    {progress && <p className="muted" role="status">{progress}</p>}
    {message && <p className={message.startsWith("Kitabu kimewasilishwa") ? "notice" : "message"} role="status">{message}</p>}
    <button className="btn" disabled={busy}>{busy ? "Inapakia..." : "Pakia na wasilisha kwa ukaguzi"}</button>
    <p className="muted upload-note">Faili la kitabu linahifadhiwa faragha. Admin atakagua kabla kitabu hakijaonekana kwa wasomaji.</p>
  </form>;
}
