import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SWAHILI_MALE_VOICE = "ezWcjzmShLr2IarIA07u";
const MAX_CHAPTER_CHARS = 5000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ingia kwanza ili kutengeneza audiobook." }, { status: 401 });

  const body = await request.json().catch(() => null) as { bookId?: string; title?: string; text?: string; voice?: string; isPreview?: boolean } | null;
  const bookId = String(body?.bookId ?? "");
  const title = String(body?.title ?? "").trim();
  const text = String(body?.text ?? "").trim();
  const voice = String(body?.voice ?? SWAHILI_MALE_VOICE);
  const isPreview = body?.isPreview === true;

  if (!bookId || !title || title.length > 180 || !text) {
    return NextResponse.json({ error: "Weka jina la sura na maandishi yake." }, { status: 400 });
  }
  if (text.length > MAX_CHAPTER_CHARS) {
    return NextResponse.json({ error: "Sura hii imezidi herufi 5,000. Igawanye katika sehemu ndogo." }, { status: 400 });
  }
  if (voice !== SWAHILI_MALE_VOICE) {
    return NextResponse.json({ error: "Sauti iliyochaguliwa haipatikani kwa sasa." }, { status: 400 });
  }

  const { data: application } = await supabase.from("seller_applications").select("status").eq("user_id", user.id).maybeSingle();
  if (application?.status !== "approved") {
    return NextResponse.json({ error: "Akaunti yako bado haijaidhinishwa kuwa muuzaji." }, { status: 403 });
  }

  const { data: book } = await supabase.from("books")
    .select("id,price_tzs,status,format")
    .eq("id", bookId).eq("seller_id", user.id).eq("format", "audiobook")
    .in("status", ["approved", "pending"]).maybeSingle();
  if (!book) return NextResponse.json({ error: "Audiobook haijapatikana au haiwezi kuhaririwa." }, { status: 404 });

  const { data: chapters, error: chapterReadError } = await supabase.from("book_audio_chapters")
    .select("chapter_index,is_preview").eq("book_id", bookId).order("chapter_index", { ascending: false });
  if (chapterReadError) return NextResponse.json({ error: "Imeshindikana kusoma sura zilizopo." }, { status: 500 });
  if ((chapters?.length ?? 0) >= 100) return NextResponse.json({ error: "Audiobook haiwezi kuzidi sura 100." }, { status: 400 });
  if (book.price_tzs > 0 && !isPreview && !(chapters ?? []).some(chapter => chapter.is_preview)) {
    return NextResponse.json({ error: "Audiobook ya kulipia lazima iwe na angalau sura moja ya sampuli ya bure." }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Huduma ya sauti haijawekwa tayari. Wasiliana na Admin." }, { status: 503 });

  let audioResponse: Response;
  try {
    audioResponse = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + SWAHILI_MALE_VOICE + "?output_format=mp3_44100_128", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", language_code: "sw", voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true } }),
      signal: AbortSignal.timeout(50000)
    });
  } catch {
    return NextResponse.json({ error: "Imeshindikana kuwasiliana na ElevenLabs. Jaribu tena baadaye." }, { status: 502 });
  }
  if (!audioResponse.ok) {
    const detail = await audioResponse.text().catch(() => "");
    return NextResponse.json({ error: audioResponse.status === 401 || audioResponse.status === 403 ? "API Key ya ElevenLabs haijakubaliwa. Admin akague mipangilio." : audioResponse.status === 429 ? "Salio au kikomo cha matumizi ya ElevenLabs kimefikiwa." : "ElevenLabs imeshindwa kutengeneza sauti. " + detail.slice(0, 180) }, { status: 502 });
  }

  const audioBytes = Buffer.from(await audioResponse.arrayBuffer());
  if (!audioBytes.length) return NextResponse.json({ error: "ElevenLabs imerudisha sauti tupu." }, { status: 502 });

  const chapterIndex = Math.max(0, ...(chapters ?? []).map(chapter => chapter.chapter_index)) + 1;
  const filePath = user.id + "/" + bookId + "/ai-audio-chapter-" + String(chapterIndex).padStart(3, "0") + "-" + crypto.randomUUID() + ".mp3";
  const { error: uploadError } = await supabase.storage.from("book-files").upload(filePath, audioBytes, { contentType: "audio/mpeg", upsert: false });
  if (uploadError) return NextResponse.json({ error: "Sauti imetengenezwa lakini haikuweza kuhifadhiwa: " + uploadError.message }, { status: 500 });

  if (book.status === "approved") {
    const { error: statusError } = await supabase.from("books").update({ status: "pending" }).eq("id", bookId).eq("seller_id", user.id);
    if (statusError) {
      await supabase.storage.from("book-files").remove([filePath]);
      return NextResponse.json({ error: "Sauti imetengenezwa lakini kitabu hakikuweza kupelekwa kwa ukaguzi." }, { status: 500 });
    }
  }

  const { error: insertError } = await supabase.from("book_audio_chapters").insert({
    book_id: bookId, seller_id: user.id, chapter_index: chapterIndex, title, audio_path: filePath, is_preview: isPreview
  });
  if (insertError) {
    await supabase.storage.from("book-files").remove([filePath]);
    if (book.status === "approved") await supabase.from("books").update({ status: "approved" }).eq("id", bookId).eq("seller_id", user.id);
    return NextResponse.json({ error: "Sauti imetengenezwa lakini sura haikuweza kuhifadhiwa: " + insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, chapter: { id: crypto.randomUUID(), chapterIndex, title }, message: "Sauti imetengenezwa na kuhifadhiwa. Audiobook imerudishwa kwa Admin kwa ukaguzi." });
}
