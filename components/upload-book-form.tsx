"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { createBookDraft, finishBookUpload } from "@/app/dashboard/kitabu/actions";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export function UploadBookForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");

  async function submit(formData: FormData) {
    setBusy(true);
    setMessage("");
    setProgress("");
    try {
      const bookFile = formData.get("book_file");
      const coverFile = formData.get("cover_file");
      if (!(bookFile instanceof File) || bookFile.size === 0) throw new Error("Chagua faili la kitabu kwanza.");
      if (!(coverFile instanceof File) || coverFile.size === 0) throw new Error("Chagua picha ya jalada kwanza.");
      if (bookFile.size > MAX_FILE_SIZE) throw new Error("Faili la kitabu limezidi MB 100.");
      if (coverFile.size > 8 * 1024 * 1024) throw new Error("Jalada lisizidi MB 8.");
      const format = String(formData.get("format") ?? "pdf");
      const allowed = format === "pdf"
        ? ["application/pdf"]
        : format === "epub"
          ? ["application/epub+zip", "application/octet-stream"]
          : ["audio/mpeg", "audio/mp4", "audio/aac", "audio/x-m4a"];
      if (!allowed.includes(bookFile.type) && !(format === "epub" && bookFile.name.toLowerCase().endsWith(".epub"))) {
        throw new Error("Aina ya faili haiendani na muundo uliochagua.");
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(coverFile.type)) throw new Error("Jalada liwe JPG, PNG au WebP.");
      const draft = await createBookDraft(formData);
      if (!draft.ok) throw new Error(draft.error);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      const ext = bookFile.name.split(".").pop()?.toLowerCase() || (format === "audiobook" ? "mp3" : format);
      const coverExt = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const base = `${draft.bookId}/`;
      const filePath = `${base}book.${ext}`;
      const coverPath = `${base}cover.${coverExt}`;
      setProgress("Inapakia faili la kitabu...");
      const bookUpload = await supabase.storage.from("book-files").upload(filePath, bookFile, { upsert: false, contentType: bookFile.type || undefined });
      if (bookUpload.error) throw new Error(bookUpload.error.message);
      setProgress("Inapakia jalada...");
      const coverUpload = await supabase.storage.from("book-files").upload(coverPath, coverFile, { upsert: false, contentType: coverFile.type });
      if (coverUpload.error) {
        await supabase.storage.from("book-files").remove([filePath]);
        throw new Error(coverUpload.error.message);
      }
      const finished = await finishBookUpload(draft.bookId, filePath, coverPath);
      if (!finished.ok) throw new Error(finished.error);
      setMessage("Kitabu kimewasilishwa kwa Admin kwa ukaguzi. Kitaonekana maktabani baada ya kuidhinishwa.");
      setProgress("");
      (document.getElementById("upload-book-form") as HTMLFormElement | null)?.reset();
    } catch (error) {
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
    <div className="field"><label htmlFor="book-format">Muundo wa kitabu</label><select id="book-format" name="format"><option value="pdf">PDF</option><option value="epub">EPUB</option><option value="audiobook">Audiobook</option></select></div>
    <div className="field"><label htmlFor="book-language">Lugha</label><select id="book-language" name="language"><option value="sw">Kiswahili</option><option value="en">English</option><option value="other">Nyingine</option></select></div>
    <div className="field"><label htmlFor="book-price">Bei (TSh)</label><input id="book-price" name="price_tzs" type="number" min="0" step="1" required/></div>
    <div className="field"><label htmlFor="book-cover">Jalada la kitabu (JPG, PNG, WebP; hadi MB 8)</label><input id="book-cover" name="cover_file" type="file" accept="image/jpeg,image/png,image/webp" required/></div>
    <div className="field"><label htmlFor="book-file">Faili la kitabu (hadi MB 100)</label><input id="book-file" name="book_file" type="file" accept=".pdf,.epub,.mp3,.m4a,.aac,audio/*,application/pdf" required/></div>
    {progress && <p className="muted" role="status">{progress}</p>}
    {message && <p className={message.startsWith("Kitabu kimewasilishwa") ? "notice" : "message"} role="status">{message}</p>}
    <button className="btn" disabled={busy}>{busy ? "Inapakia..." : "Pakia na wasilisha kwa ukaguzi"}</button>
    <p className="muted upload-note">Faili linahifadhiwa faragha. Admin pekee ndiye atakayekagua kabla ya kitabu kuonekana kwa wateja.</p>
  </form>;
}
