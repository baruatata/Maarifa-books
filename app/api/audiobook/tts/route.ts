import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const apiKey = process.env.FISH_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Fish Audio API Key haijawekwa kwenye Production." }, { status: 503 });

  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ error: "Hakuna maandishi ya kusoma." }, { status: 400 });
    if (text.length > 2200) return NextResponse.json({ error: "Sehemu ya maandishi ni ndefu sana." }, { status: 413 });

    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        model: "s2.1-pro-free",
      },
      body: JSON.stringify({ text, format: "wav", sample_rate: 44100 }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: detail.slice(0, 300) || "Fish Audio imeshindwa kutengeneza sauti." }, { status: 502 });
    }

    const audio = await response.arrayBuffer();
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Hitilafu imetokea wakati wa kutengeneza sauti." }, { status: 500 });
  }
}
