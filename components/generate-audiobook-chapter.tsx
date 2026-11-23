"use client";

import { useState } from "react";

export default function GenerateAudiobookChapter({ bookId, price }: { bookId: string; price: number }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/audiobook/generate-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, title, text, voice: "ezWcjzmShLr2IarIA07u", isPreview: preview })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Imeshindikana kutengeneza sauti.");
      setMessage(result.message || "Sura imetengenezwa.");
      setTitle("");
      setText("");
      setPreview(false);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Imeshindikana kutengeneza audiobook.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel form" style={{ marginTop: 24 }}>
    <h2>Tengeneza audiobook kwa AI</h2>
    <p className="muted">Bandika maandishi ya sura. ElevenLabs itayasoma kwa sauti ya Kiswahili ya kiume ya Tanzania, kisha sauti itahifadhiwa kama MP3 ndani ya audiobook yako.</p>
    <form onSubmit={generate}>
      <div className="field">
        <label htmlFor="ai-chapter-title">Jina la sura</label>
        <input id="ai-chapter-title" value={title} onChange={event => setTitle(event.target.value)} required maxLength={180} placeholder="Mfano: Sura ya Pili" />
      </div>
      <div className="field">
        <label htmlFor="ai-chapter-text">Maandishi ya sura (hadi herufi 5,000 kwa kila sehemu)</label>
        <textarea id="ai-chapter-text" value={text} onChange={event => setText(event.target.value)} required maxLength={5000} rows={9} placeholder="Bandika maandishi ya sura hapa..." />
        <small className="muted">{text.length.toLocaleString("sw-TZ")} / 5,000 herufi</small>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={preview} onChange={event => setPreview(event.target.checked)} />
        Ruhusu sura hii kuwa sampuli ya bure
      </label>
      <p className="muted">Sauti: Mohammed – Swahili Local (Kiume, Tanzania). Sauti ya kike ya Kiswahili haijapatikana kwenye maktaba iliyokaguliwa kwa sasa.</p>
      {price > 0 && <p className="muted">Kwa audiobook ya kulipia, lazima kuwe na angalau sura moja ya sampuli ya bure.</p>}
      {message && <p className="notice" role="status">{message}</p>}
      <button className="btn" disabled={busy || !title.trim() || !text.trim()}>{busy ? "AI inatengeneza sauti..." : "Tengeneza sauti ya sura"}</button>
    </form>
  </section>;
}
