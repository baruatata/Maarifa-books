"use client";

import { useRef, useState } from "react";

type Props = { bookId: string };

export default function AudiobookPlayer({ bookId }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [speed, setSpeed] = useState("1");

  function clearAudio() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
  }

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
      const chunks = (data.pages as string[]).flatMap((page) => {
        const parts = page.match(/[\\s\\S]{1,1800}/g) || [];
        return parts.map((part) => part.trim()).filter(Boolean);
      });
      if (!chunks.length) throw new Error("Hakuna maandishi ya kusikiliza kwenye PDF hii.");
      setTotal(chunks.length);
      const audioParts: Blob[] = [];
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
        audioParts.push(await response.blob());
      }
      const combined = new Blob(audioParts, { type: "audio/mpeg" });
      urlRef.current = URL.createObjectURL(combined);
      if (audioRef.current) {
        audioRef.current.src = urlRef.current;
        audioRef.current.playbackRate = Number(speed);
        audioRef.current.load();
      }
      setStatus("ready");
      setMessage("Sauti iko tayari. Bonyeza Play kwenye kicheza sauti hapa chini.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Imeshindikana kuandaa sauti.");
    }
  }

  return (
    <section className="panel reader-audio" style={{ margin: "1rem 0", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>🎧 Sikiliza kitabu</h2>
      <p className="muted">Andaa sauti ya Kiswahili ya kitabu hiki, kisha bonyeza Play kusikiliza.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem", alignItems: "center" }}>
        <button className="btn" type="button" onClick={() => void start()} disabled={status === "loading"}>
          {status === "loading" ? "Inaandaa sauti..." : status === "ready" ? "Andaa tena" : "▶ Andaa sauti"}
        </button>
        <label style={{ display: "inline-flex", gap: ".35rem", alignItems: "center" }}>
          Kasi
          <select value={speed} onChange={(event) => { setSpeed(event.target.value); if (audioRef.current) audioRef.current.playbackRate = Number(event.target.value); }}>
            <option value="0.8">0.8×</option><option value="1">1×</option><option value="1.2">1.2×</option><option value="1.5">1.5×</option>
          </select>
        </label>
      </div>
      {message && <p className="reader-footnote" aria-live="polite">{message}</p>}
      {total > 0 && status === "loading" && <p className="reader-footnote">Sehemu {progress} kati ya {total}</p>}
      <audio ref={audioRef} controls preload="none" style={{ display: status === "ready" ? "block" : "none", width: "100%", marginTop: ".75rem" }}>
        Kivinjari chako hakitumii kicheza sauti.
      </audio>
    </section>
  );
}
