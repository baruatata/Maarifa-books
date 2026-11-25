"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { createFirstChapterPreview } from "@/lib/book-preview";
import { getSellerBookPreviewSource, saveGeneratedSellerBookPreview } from "@/app/dashboard/kitabu/actions";
import { useLanguage } from "@/components/language-provider";

const MAX_PREVIEW_SIZE = 35 * 1024 * 1024;

export function AutoGeneratePaidBookPreview({ bookId, format }: { bookId: string; format: "pdf" | "epub" }) {
  const { en } = useLanguage();
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState(en ? "Preparing the automatic Chapter One preview..." : "Mfumo unatengeneza sampuli ya Sura ya Kwanza moja kwa moja...");

  useEffect(() => {
    let cancelled = false;
    let uploadedPath: string | null = null;

    async function generate() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      try {
        const source = await getSellerBookPreviewSource(bookId);
        if (!source.ok) {
          if (source.error.includes("tayari ipo")) {
            if (!cancelled) { setStatus("done"); setMessage(en ? "A free preview is already available." : "Sampuli ya bure tayari ipo."); }
            return;
          }
          throw new Error(source.error);
        }
        const response = await fetch(source.url);
        if (!response.ok) throw new Error(en ? "Could not read the original book file." : "Imeshindikana kusoma faili la awali la kitabu.");
        const sourceBlob = await response.blob();
        const sourceFile = new File([sourceBlob], source.format === "epub" ? "book.epub" : "book.pdf", {
          type: source.format === "epub" ? "application/epub+zip" : "application/pdf"
        });
        const preview = await createFirstChapterPreview(sourceFile, source.format);
        if (preview.size > MAX_PREVIEW_SIZE) throw new Error(en ? "The generated preview exceeds 35 MB." : "Sampuli iliyotengenezwa imezidi MB 35.");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error(en ? "Please sign in again." : "Ingia tena ili kuendelea.");
        const extension = source.format;
        uploadedPath = user.id + "/" + bookId + "/preview-auto-" + Date.now() + "." + extension;
        const upload = await supabase.storage.from("book-files").upload(uploadedPath, preview, {
          upsert: false,
          contentType: source.format === "epub" ? "application/epub+zip" : "application/pdf"
        });
        if (upload.error) throw new Error(upload.error.message);
        const saved = await saveGeneratedSellerBookPreview(bookId, uploadedPath);
        if (!saved.ok) throw new Error(saved.error);
        uploadedPath = null;
        if (!cancelled) {
          setStatus("done");
          setMessage(en ? "The system has generated and saved the free Chapter One preview. You can now save your book details; the book will remain subject to administrator review." : "Mfumo umetengeneza na kuhifadhi sampuli ya bure ya Sura ya Kwanza. Sasa unaweza kuhifadhi taarifa za kitabu; kitabu kitaendelea kwa ukaguzi wa Admin.");
        }
      } catch (error) {
        if (uploadedPath) await supabase.storage.from("book-files").remove([uploadedPath]);
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : (en ? "Could not generate the preview." : "Imeshindikana kutengeneza sampuli."));
        }
      }
    }

    void generate();
    return () => { cancelled = true; };
  }, [bookId, format, en]);

  return <p className={status === "done" ? "notice" : "message"} role="status" aria-live="polite">{message}</p>;
}
