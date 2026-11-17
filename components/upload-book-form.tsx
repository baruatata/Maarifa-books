"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { createBookDraft, finishBookUpload } from "@/app/dashboard/kitabu/actions";
import { createFirstChapterPreview } from "@/lib/book-preview";

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
      const format = String(formData.get("format") ?? "pdf");
      const price = Number(formData.get("price_tzs") ?? 0);
      if (!(bookFile instanceof File) || bookFile.size === 0) throw new Error("Chagua faili kamili la kitabu kwanza.");
      if (!(coverFile instanceof File) || coverFile.size === 0) throw new Error("Chagua picha ya jalada kwanza.");
      if (!Number.isSafeInteger(price) || price < 0 || price > 100000000) throw new Error("Weka bei sahihi ya kitabu kwa TZS.");
      if (bookFile.size > MAX_FILE_SIZE) throw new Error("Faili la kitabu limezidi MB 100.");
      if (coverFile.size > 8 * 1024 * 1024) throw new Error("Jalada lisizidi MB 8.");
      if (!["pdf", "epub"].includes(format) || !validBookFile(bookFile, format)) throw new Error("Faili la kitabu halilingani na muundo uliochagua.");
      if (!["image/jpeg", "image/png", "image/webp"].includes(coverFile.type)) throw new Error("Jalada liwe JPG, PNG au WebP.");

      let previewBlob: Blob | null = null;
      if (price > 0) {
        setProgress("Mfumo unachambua kitabu na kuchagua Sura ya Kwanza...");
        previewBlob = await createFirstChapterPreview(bookFile, format as "pdf" | "epub");
        if (previewBlob.size > MAX_PREVIEW_SIZE) throw new Error("Sampuli ya bure imezidi MB 35. Punguza ukubwa wa faili au picha za sura ya kwanza.");
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
      const previewPath = previewBlob ? `${base}preview.${ext}` : null;

      setProgress("Inapakia kitabu kamili...");
      const bookUpload = await supabase.storage.from("book-files").upload(filePath, bookFile, { upsert: false, contentType: bookFile.type || undefined });
      if (bookUpload.error) throw new Error(bookUpload.error.message);
      uploadedPaths.push(filePath);

      setProgress("Inapakia jalada...");
      const coverUpload = await supabase.storage.from("book-files").upload(coverPath, coverFile, { upsert: false, contentType: coverFile.type });
      if (coverUpload.error) throw new Error(coverUpload.error.message);
      uploadedPaths.push(coverPath);

      if (previewBlob && previewPath) {
        setProgress("Inapakia sampuli ya sura ya kwanza...");
        const previewUpload = await supabase.storage.from("book-files").upload(previewPath, previewBlob, {
          upsert: false,
          contentType: format === "epub" ? "application/epub+zip" : "application/pdf",
        });
        if (previewUpload.error) throw new Error(previewUpload.error.message);
        uploadedPaths.push(previewPath);
      }

      const finished = await finishBookUpload(draft.bookId, filePath, coverPath, previewPath);
      if (!finished.ok) throw new Error(finished.error);
      setMessage(price > 0
        ? "Kitabu kimewasilishwa kwa Admin. Mfumo umetengeneza sampuli ya Sura ya Kwanza moja kwa moja."
        : "Kitabu kimewasilishwa kwa Admin kwa ukaguzi.");
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
    <div className="field"><label htmlFor="book-price">Bei ya kitabu (TZS)</label><input id="book-price" name="price_tzs" type="number" min="0" max="100000000" step="1" defaultValue="0" required/><small className="muted">Weka 0 kama kitabu ni bure. Ukiweka bei, mfumo utatengeneza sampuli ya Sura ya Kwanza moja kwa moja.</small></div>
    <div className="field"><label htmlFor="book-cover">Jalada la kitabu (JPG, PNG, WebP; hadi MB 8)</label><input id="book-cover" name="cover_file" type="file" accept="image/jpeg,image/png,image/webp" required/></div>
    <div className="field"><label htmlFor="book-file">Kitabu kamili (PDF/EPUB; hadi MB 100)</label><input id="book-file" name="book_file" type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" required/></div>
    <div className="notice"><strong>Sampuli ya bure (PDF/EPUB; hadi MB 35)</strong><p className="muted">Huhitaji kupakia sampuli tofauti. Kwa kitabu cha kulipia, mfumo utachambua faili lako na kuchagua Sura ya Kwanza moja kwa moja. Hakikisha vichwa vimeandikwa “SURA YA KWANZA” na “SURA YA PILI” au “CHAPTER ONE” na “CHAPTER TWO”.</p></div>
    {progress && <p className="muted" role="status">{progress}</p>}
    {message && <p className={message.startsWith("Kitabu kimewasilishwa") ? "notice" : "message"} role="status">{message}</p>}
    <button className="btn" disabled={busy}>{busy ? "Inachakata..." : "Pakia na wasilisha kwa ukaguzi"}</button>
    <p className="muted upload-note">Faili la kitabu linahifadhiwa faragha. Admin atakagua kabla kitabu hakijaonekana kwa wasomaji.</p>
  </form>;
}
