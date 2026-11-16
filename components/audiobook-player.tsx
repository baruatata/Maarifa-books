"use client";

import { useEffect, useRef, useState } from "react";

type Props = { bookId: string };

function splitIntoChunks(text: string, maxLength = 1800): string[] {
  const remainingText = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let remaining = remainingText;

  while (remaining.length > maxLength) {
    let cut = remaining.lastIndexOf(" ", maxLength);
    if (cut < Math.floor(maxLength * 0.6)) cut = maxLength;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function readWavPcm(buffer: ArrayBuffer): Uint8Array {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const fourCC = (offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));

  if (bytes.length < 44 || fourCC(0) !== "RIFF" || fourCC(8) !== "WAVE") {
    throw new Error("Fish Audio imerudisha sauti yenye muundo usiotambulika.");
  }

  let offset = 12;
  let formatOk = false;
  while (offset + 8 <= bytes.length) {
    const id = fourCC(offset);
    const size = view.getUint32(offset + 4, true);
    const dataStart = offset + 8;
    const dataEnd = Math.min(dataStart + size, bytes.length);

    if (id === "fmt " && size >= 16) {
      const format = view.getUint16(dataStart, true);
      const channels = view.getUint16(dataStart + 2, true);
      const sampleRate = view.getUint32(dataStart + 4, true);
      const bitsPerSample = view.getUint16(dataStart + 14, true);
      formatOk = format === 1 && channels === 1 && sampleRate === 44100 && bitsPerSample === 16;
    }

    if (id === "data") {
      if (!formatOk) {
        throw new Error("Muundo wa sauti uliorudishwa hauendani. Jaribu tena.");
      }
      return bytes.slice(dataStart, dataEnd);
    }

    offset = dataStart + size + (size % 2);
  }

  throw new Error("Sehemu ya sauti haina data ya kusikiliza.");
}

function combineWavParts(parts: Uint8Array[]): Blob {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const pcm = new Uint8Array(totalLength);
  let cursor = 0;
  for (const part of parts) {
    pcm.set(part, cursor);
    cursor += part.length;
  }

  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const writeText = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 44100, true);
  view.setUint32(28, 88200, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, pcm.length, true);

  return new Blob([header, pcm], { type: "audio/wav" });
}

export default function AudiobookPlayer({ bookId }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [speed, setSpeed] = useState("1");

  function clearAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  }

  useEffect(() => () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  useEffect(() => {
    if (status === "ready" && audioRef.current && audioUrlRef.current) {
      audioRef.current.src = audioUrlRef.current;
      audioRef.current.playbackRate = Number(speed);
      audioRef.current.load();
    }
  }, [status]);

  async function start() {
    clearAudio();
    setStatus("loading");
    setMessage("Inachambua maandishi ya kitabu...");
    setProgress(0);
    setTotal(0);

    try {
      const textResponse = await fetch("/api/audiobook/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await textResponse.json();
      if (!textResponse.ok) throw new Error(data.error || "Kitabu hakikuweza kuchambuliwa.");

      const fullText = (data.pages as string[]).filter((page) => page?.trim()).join("\n\n");
      const chunks = splitIntoChunks(fullText);
      if (!chunks.length) throw new Error("Hakuna maandishi ya kusikiliza kwenye PDF hii.");

      setTotal(chunks.length);
      const pcmParts: Uint8Array[] = [];

      for (let index = 0; index < chunks.length; index++) {
        setProgress(index + 1);
        setMessage(`Inaandaa sauti: sehemu ${index + 1} kati ya ${chunks.length}...`);
        const response = await fetch("/api/audiobook/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunks[index] }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Imeshindikana kuandaa sehemu ${index + 1}.`);
        }

        const audioBuffer = await response.arrayBuffer();
        if (!audioBuffer.byteLength) throw new Error(`Sehemu ${index + 1} imerudi bila sauti.`);
        pcmParts.push(readWavPcm(audioBuffer));
      }

      const completeAudio = combineWavParts(pcmParts);
      if (!completeAudio.size) throw new Error("Sauti ya kitabu haikuweza kuunganishwa.");
      audioUrlRef.current = URL.createObjectURL(completeAudio);
      setStatus("ready");
      setMessage("Kitabu chote kimeandaliwa kama sauti moja. Bonyeza Play mara moja kusikiliza bila kukatika kati ya sehemu.");
    } catch (error) {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Imeshindikana kuandaa sauti.");
    }
  }

  return (
    <section className="panel reader-audio" style={{ margin: "1rem 0", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>🎧 Sikiliza kitabu</h2>
      <p className="muted">Sauti inaandaliwa kwa vipande vidogo kisha kuunganishwa kuwa faili moja linalocheza mfululizo.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem", alignItems: "center" }}>
        <button className="btn" type="button" onClick={() => void start()} disabled={status === "loading"}>
          {status === "loading" ? "Inaandaa sauti..." : status === "ready" ? "Andaa tena" : "▶ Andaa sauti"}
        </button>
        <label style={{ display: "inline-flex", gap: ".35rem", alignItems: "center" }}>
          Kasi
          <select value={speed} onChange={(event) => {
            setSpeed(event.target.value);
            if (audioRef.current) audioRef.current.playbackRate = Number(event.target.value);
          }}>
            <option value="0.8">0.8×</option>
            <option value="1">1×</option>
            <option value="1.2">1.2×</option>
            <option value="1.5">1.5×</option>
          </select>
        </label>
      </div>
      {message && <p className="reader-footnote" aria-live="polite">{message}</p>}
      {status === "loading" && total > 0 && (
        <p className="reader-footnote">Sehemu {progress} kati ya {total}</p>
      )}
      {status === "ready" && (
        <audio
          ref={audioRef}
          controls
          preload="metadata"
          onEnded={() => setMessage("Kitabu kimemaliza kusomwa. Unaweza kurudia kusikiliza.")}
          onError={() => setMessage("Kicheza sauti kimeshindwa kufungua faili. Bonyeza Andaa tena ujaribu upya.")}
          style={{ display: "block", width: "100%", marginTop: ".75rem" }}
        >
          Kivinjari chako hakitumii kicheza sauti.
        </audio>
      )}
    </section>
  );
}
