"use client";

import { useRef, useState } from "react";

type Props = { bookId: string };

export default function AudiobookPlayer({ bookId }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "paused" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [speed, setSpeed] = useState("1");

  function clearAudio() {
    audioRef.current?.pause();
    audioRef.current = null;
    urlsRef.current.forEach(URL.revokeObjectURL);
    urlsRef.current = [];
  }

  async function playFrom(chunks: string[], index: number) {
    if (index >= chunks.length) {
      setStatus("done");
      setMessage("Umemaliza kusikiliza kitabu.");
      return;
    }
    setProgress(index + 1);
    setStatus("loading");
    setMessage("Inaandaa sauti...");
    try {
      const response = await fetch("/api/audiobook/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunks[index] }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Sauti haikuweza kutengenezwa.");
      }
      const url = URL.createObjectURL(await response.blob());
      urlsRef.current.push(url);
      const audio = new Audio(url);
      audio.playbackRate = Number(speed);
      audioRef.current = audio;
      audio.onended = () => { void playFrom(chunks, index + 1); };
      audio.onerror = () => { setStatus("error"); setMessage("Sauti haikuweza kuchezwa kwenye kifaa hiki."); };
      await audio.play();
      setStatus("playing");
      setMessage("Inasoma kitabu kwa sauti...");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Hitilafu ya sauti.");
    }
  }

  async function start() {
    clearAudio();
    setStatus("loading");
    setMessage("Inachambua maandishi ya kitabu...");
    setProgress(0);
    try {
      const response = await fetch("/api/audiobook/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Kitabu hakikuweza kuchambuliwa.");
      const chunks = (data.pages as string[]).flatMap((page) => {
        const words = page.match(/[\s\S]{1,1800}/g) || [];
        return words.map((part) => part.trim()).filter(Boolean);
      });
      if (!chunks.length) throw new Error("Hakuna maandishi ya kusikiliza kwenye PDF hii.");
      setTotal(chunks.length);
      await playFrom(chunks, 0);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Imeshindikana kuanza kusoma.");
    }
  }

  function pause() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      void audioRef.current.play();
      setStatus("playing");
    } else {
      audioRef.current.pause();
      setStatus("paused");
    }
  }

  function stop() {
    clearAudio();
    setStatus("idle");
    setProgress(0);
    setMessage("Usikilizaji umesimamishwa.");
  }

  return (
    <section className="panel reader-audio" style={{ margin: "1rem 0", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Sikiliza kitabu</h2>
      <p className="muted">Sikiliza maandishi ya PDF kwa sauti ya AI. Unaweza kusimamisha na kuendelea wakati wowote.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem", alignItems: "center" }}>
        <button className="btn" type="button" onClick={() => void start()} disabled={status === "loading" || status === "playing" || status === "paused"}>
          {status === "done" ? "Sikiliza tena" : "▶ Sikiliza"}
        </button>
        <button className="btn" type="button" onClick={pause} disabled={!audioRef.current || status === "loading" || status === "done" || status === "error"}>
          {status === "paused" ? "Endelea" : "Sitisha kwa muda"}
        </button>
        <button className="btn btn-secondary" type="button" onClick={stop} disabled={status === "idle"}>Simamisha</button>
        <label style={{ display: "inline-flex", gap: ".35rem", alignItems: "center" }}>
          Kasi
          <select value={speed} onChange={(event) => { setSpeed(event.target.value); if (audioRef.current) audioRef.current.playbackRate = Number(event.target.value); }}>
            <option value="0.8">0.8×</option><option value="1">1×</option><option value="1.2">1.2×</option><option value="1.5">1.5×</option>
          </select>
        </label>
      </div>
      {message && <p className="reader-footnote" aria-live="polite">{message}</p>}
      {total > 0 && <p className="reader-footnote">Sehemu {progress} kati ya {total}</p>}
      <audio ref={audioRef} hidden />
    </section>
  );
}
