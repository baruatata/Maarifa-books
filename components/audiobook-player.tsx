"use client";

import { useEffect, useRef, useState } from "react";

type Props = { bookId: string };

export default function AudiobookPlayer({ bookId }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<string[]>([]);
  const segmentRef = useRef(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [segment, setSegment] = useState(0);
  const [speed, setSpeed] = useState("1");

  function clearAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
    segmentRef.current = 0;
    setSegment(0);
  }

  useEffect(() => () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    if (status === "ready" && audioRef.current && urlsRef.current.length) {
      segmentRef.current = 0;
      setSegment(0);
      audioRef.current.src = urlsRef.current[0];
      audioRef.current.playbackRate = Number(speed);
      audioRef.current.load();
    }
  }, [status]);

  function playSegment(index: number, autoplay = true) {
    const urls = urlsRef.current;
    const audio = audioRef.current;
    if (!audio || index < 0 || index >= urls.length) return;
    segmentRef.current = index;
    setSegment(index);
    audio.src = urls[index];
    audio.playbackRate = Number(speed);
    audio.load();
    if (autoplay) {
      void audio.play().catch(() => {
        setMessage("Sauti iko tayari. Bonyeza Play kwenye kicheza sauti.");
      });
    }
  }

  function handleEnded() {
    const next = segmentRef.current + 1;
    if (next < urlsRef.current.length) {
      playSegment(next, true);
    } else {
      setMessage("Kitabu kimemaliza kusomwa. Unaweza kurudia kusikiliza.");
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
        const normalized = page.replace(/\s+/g, " ").trim();
        const parts = normalized.match(/[\s\S]{1,1800}/g) || [];
        return parts.map((part) => part.trim()).filter(Boolean);
      });
      if (!chunks.length) throw new Error("Hakuna maandishi ya kusikiliza kwenye PDF hii.");
      setTotal(chunks.length);
      const audioUrls: string[] = [];
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
        const audioBlob = await response.blob();
        if (!audioBlob.size) throw new Error(`Sehemu ${index + 1} imerudi bila sauti.`);
        audioUrls.push(URL.createObjectURL(audioBlob));
      }
      urlsRef.current = audioUrls;
      setStatus("ready");
      setMessage(`Sauti zote ${audioUrls.length} ziko tayari. Bonyeza Play kusikiliza; zitaendelea zenyewe kwa mfuatano.`);

    } catch (error) {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current = [];
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Imeshindikana kuandaa sauti.");
    }
  }

  return (
    <section className="panel reader-audio" style={{ margin: "1rem 0", padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>🎧 Sikiliza kitabu</h2>
      <p className="muted">Andaa sauti ya Kiswahili ya kitabu hiki. Vipande vitachezwa kwa mfuatano bila kuunganishwa kuwa faili moja.</p>
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
      {status === "loading" && total > 0 && <p className="reader-footnote">Sehemu {progress} kati ya {total}</p>}
      {status === "ready" && (
        <>
          <p className="reader-footnote">Unasikiliza sehemu {segment + 1} kati ya {urlsRef.current.length}.</p>
          <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem" }}>
            <button className="btn" type="button" onClick={() => playSegment(segment - 1, true)} disabled={segment <= 0}>Sehemu iliyopita</button>
            <button className="btn" type="button" onClick={() => playSegment(segment + 1, true)} disabled={segment >= urlsRef.current.length - 1}>Sehemu inayofuata</button>
          </div>
          <audio ref={audioRef} controls preload="metadata" onEnded={handleEnded} style={{ display: "block", width: "100%", marginTop: ".75rem" }}>
            Kivinjari chako hakitumii kicheza sauti.
          </audio>
        </>
      )}
    </section>
  );
}
