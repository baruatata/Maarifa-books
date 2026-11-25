import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function notFound() {
  return new Response("Faili halipatikani au huna ruhusa ya kulifungua.", {
    status: 404,
    headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const search = new URL(request.url).searchParams;
  const asset = search.get("asset");
  const asDownload = search.get("download") === "1";
  const asDownload = search.get("download") === "1";
  const supabase = await createClient();

  const [{ data: book, error: bookError }, { data: { session } }] = await Promise.all([
    supabase
      .from("books")
      .select("id,status,cover_path,file_path,preview_path")
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.getSession(),
  ]);

  if (bookError || !book) return notFound();

  let storagePath: string | null = null;
  if (asset === "cover") {
    storagePath = book.cover_path;
  } else if (asset === "preview") {
    storagePath = book.preview_path;
  } else if (asset === "full") {
    storagePath = book.file_path;
  } else if (asset === "chapter") {
    const chapterId = search.get("chapterId");
    if (!chapterId) return notFound();
    const { data: chapter, error } = await supabase
      .from("book_audio_chapters")
      .select("audio_path")
      .eq("id", chapterId)
      .eq("book_id", id)
      .maybeSingle();
    if (error || !chapter) return notFound();
    storagePath = chapter.audio_path;
  } else {
    return notFound();
  }

  if (!storagePath) return notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !apiKey) {
    return new Response("Huduma ya mafaili haipatikani kwa sasa.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  const storageBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const storageUrl = `${storageBase}/storage/v1/object/authenticated/book-files/${encodedPath}`;
  const upstreamHeaders = new Headers({
    apikey: apiKey,
    Authorization: `Bearer ${session?.access_token ?? apiKey}`,
  });
  const range = request.headers.get("range");
  if (range) upstreamHeaders.set("range", range);

  let upstream: Response;
  try {
    upstream = await fetch(storageUrl, {
      method: "GET",
      headers: upstreamHeaders,
      cache: "no-store",
    });
  } catch {
    return new Response("Imeshindikana kufungua faili kwa sasa.", {
      status: 502,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  if (!upstream.ok && upstream.status !== 206 && upstream.status !== 416) {
    return new Response("Faili halipatikani au huna ruhusa ya kulifungua.", {
      status: upstream.status === 401 || upstream.status === 403 ? 403 : 404,
      headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  }

  const responseHeaders = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": asDownload ? "attachment" : "inline",
  });
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
