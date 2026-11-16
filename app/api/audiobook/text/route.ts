import { NextResponse } from "next/server";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookId = typeof body?.bookId === "string" ? body.bookId : "";
    if (!bookId) return NextResponse.json({ error: "Kitabu hakijatajwa." }, { status: 400 });

    const supabase = await createClient();
    const { data: book, error } = await supabase.from("books")
      .select("id,format,file_path,status")
      .eq("id", bookId)
      .eq("status", "approved")
      .maybeSingle();

    if (error || !book || book.format !== "pdf" || !book.file_path) {
      return NextResponse.json({ error: "Kitabu cha PDF kilichoidhinishwa hakijapatikana." }, { status: 404 });
    }

    const { data: file, error: downloadError } = await supabase.storage.from("book-files").download(book.file_path);
    if (downloadError || !file) return NextResponse.json({ error: "Imeshindikana kufungua PDF." }, { status: 502 });
    if (file.size > 30 * 1024 * 1024) return NextResponse.json({ error: "PDF ni kubwa sana kwa usomaji wa sauti kwa sasa (kikomo MB 30)." }, { status: 413 });

    const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()), disableWorker: true, useSystemFonts: true }).promise;
    if (pdf.numPages > 250) return NextResponse.json({ error: "Kitabu kina kurasa zaidi ya 250; tafadhali gawanya PDF." }, { status: 413 });

    const pages: string[] = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => typeof item.str === "string" ? item.str : "").filter(Boolean).join(" ").replace(/\\s+/g, " ").trim();
      pages.push(text);
    }
    await pdf.destroy();
    if (!pages.some(Boolean)) return NextResponse.json({ error: "PDF hii haina maandishi yanayoweza kusomwa. Inaweza kuwa imetengenezwa kwa picha." }, { status: 422 });
    return NextResponse.json({ pages });
  } catch {
    return NextResponse.json({ error: "Imeshindikana kuchambua PDF. Jaribu tena." }, { status: 500 });
  }
}
