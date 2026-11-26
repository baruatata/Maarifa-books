"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { createFirstChapterPreview } from "@/lib/book-preview";
import { saveSellerBookPreview } from "@/app/dashboard/kitabu/actions";
import { useLanguage } from "@/components/language-provider";

const MAX_BOOK_SIZE = 100 * 1024 * 1024;

export function GenerateBookPreview({ bookId, currentFilePath, format, isPaid, hasPreview }: {
  bookId: string;
  currentFilePath: string | null;
  format: string;
  isPaid: boolean;
  hasPreview: boolean;
}) {
  const { en } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function generate() {
    if (!currentFilePath || !["pdf", "epub"].includes(format) || !isPaid) return;
    setBusy(true);
    setMessage(en ? "Reading the uploaded book and preparing Chapter One..." : "Inasoma kitabu ulichopakia na kuandaa sampuli ya Sura ya Kwanza...");
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    let uploadedPath: string | null = null;
    try {
      const { data: source, error: downloadError } = await supabase.storage.from("book-files").download(currentFilePath);
      if (downloadError || !source) throw new Error(downloadError?.message || (en ? "Could not download the original book file." : "Imeshindikana kusoma faili la kitabu."));
      if (source.size > MAX_BOOK_SIZE) throw new Error(en ? "The original book exceeds 100 MB." : "Faili la kitabu limezidi MB 100.");
      const extension = format === "epub" ? "epub" : "pdf";
      const sourceFile = new File([source], "book." + extension, { type: format === "epub" ? "application/epub+zip" : "application/pdf" });
      const preview = await createFirstChapterPreview(sourceFile, format as "pdf" | "epub");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(en ? "Please sign in again." : "Tafadhali ingia tena.");
      uploadedPath = user.id + "/" + bookId + "/preview-generated-" + Date.now() + "." + extension;
      setMessage(en ? "Saving the free preview..." : "Inahifadhi sampuli ya bure...");
      const { error: uploadError } = await supabase.storage.from("book-files").upload(uploadedPath, preview, {
        upsert: false,
        contentType: format === "epub" ? "application/epub+zip" : "application/pdf",
      });
      if (uploadError) throw new Error(uploadError.message);
      const saved = await saveSellerBookPreview(bookId, uploadedPath);
      if (!saved.ok) throw new Error(saved.error);
      uploadedPath = null;
      setMessage(en ? "The free Chapter One preview has been generated successfully." : "Sampuli ya bure ya Sura ya Kwanza imetengenezwa kikamilifu.");
      router.refresh();
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("book-files").remove([uploadedPath]);
      setMessage(error instanceof Error ? error.message : (en ? "Could not generate the preview." : "Imeshindikana kutengeneza sampuli."));
    } finally {
      setBusy(false);
    }
  }

  if (!isPaid || !["pdf", "epub"].includes(format)) return null;

  return <section className="panel form" style={{ marginTop: 20 }}>
    <h2>{en ? "Free book preview" : "Sampuli ya bure ya kitabu"}</h2>
    <p className="muted">{hasPreview
      ? (en ? "A free preview is already saved. You can generate it again from the original uploaded book if needed." : "Sampuli ya bure tayari ipo. Unaweza kuitengeneza upya kutoka kwenye kitabu cha awali ikiwa inahitajika.")
      : (en ? "No preview is saved for this book yet. Generate it directly from your uploaded PDF/EPUB; you do not need to contact an administrator." : "Kitabu hiki bado hakina sampuli. Itengeneze moja kwa moja kutoka kwenye PDF/EPUB uliyopakia; huhitaji kuwasiliana na Admin.")}</p>
    {message && <p className={message.includes("successfully") || message.includes("kikamilifu") ? "notice" : "message"} role="status">{message}</p>}
    <button className="btn" type="button" onClick={generate} disabled={busy || !currentFilePath}>
      {busy ? (en ? "Generating..." : "Inatengeneza...") : (hasPreview ? (en ? "Regenerate free preview" : "Tengeneza upya sampuli") : (en ? "Generate free preview" : "Tengeneza sampuli ya bure"))}
    </button>
  </section>;
}
