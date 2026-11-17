"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = { url: string; title: string; closeHref: string };
type PdfDocument = { numPages: number; getPage: (n: number) => Promise<any>; destroy: () => Promise<void> };

export default function PdfFlipbook({ url, title, closeHref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<PdfDocument | null>(null);
  const renderRef = useRef<any>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [turn, setTurn] = useState<"next" | "prev" | "">("");
  const [fit, setFit] = useState(1);

  const go = useCallback((next: number) => {
    const bounded = Math.max(1, Math.min(total || 1, next));
    if (bounded === page) return;
    setTurn(bounded > page ? "next" : "prev");
    setPage(bounded);
    window.setTimeout(() => setTurn(""), 320);
  }, [page, total]);

  useEffect(() => {
    let active = true;
    let loaded: PdfDocument | null = null;
    setLoading(true);
    setError("");
    import("pdfjs-dist/legacy/build/pdf.mjs").then(async (pdfjs: any) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs";
      const task = pdfjs.getDocument({ url, isEvalSupported: false });
      const document = await task.promise;
      loaded = document;
      if (!active) { await document.destroy(); return; }
      pdfRef.current = document;
      setTotal(document.numPages);
      setPage(1);
      setLoading(false);
    }).catch((err: unknown) => {
      if (active) {
        setError(err instanceof Error ? err.message : "PDF haikuweza kufunguliwa.");
        setLoading(false);
      }
    });
    return () => {
      active = false;
      if (renderRef.current) renderRef.current.cancel();
      if (loaded) void loaded.destroy();
      pdfRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const width = Math.max(240, stage.clientWidth - 28);
      const height = Math.max(260, stage.clientHeight - 28);
      setFit(Math.min(width / 595, height / 842));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas || !fit) return;
    if (renderRef.current) renderRef.current.cancel();
    pdf.getPage(page).then((pdfPage: any) => {
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = pdfPage.getViewport({ scale: fit * dpr });
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;
      renderRef.current = pdfPage.render({ canvasContext: context, viewport });
      return renderRef.current.promise;
    }).catch((err: unknown) => {
      if (!cancelled && !(err instanceof Error && err.name === "RenderingCancelledException")) {
        setError("Ukurasa haukuweza kuonyeshwa. Jaribu tena.");
      }
    });
    return () => { cancelled = true; if (renderRef.current) renderRef.current.cancel(); };
  }, [page, fit, total]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown") go(page + 1);
      if (event.key === "ArrowLeft" || event.key === "PageUp") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  return (
    <main className="flip-reader" aria-label={`Kisomaji cha ${title}`}>
      <header className="flip-toolbar">
        <Link className="flip-close" href={closeHref} aria-label="Rudi kwenye kitabu">‹</Link>
        <span className="flip-title">{title}</span>
      </header>
      <section
        className="flip-stage"
        ref={stageRef}
        onTouchStart={(event) => { const t = event.touches[0]; touchStart.current = { x: t.clientX, y: t.clientY }; }}
        onTouchEnd={(event) => {
          if (!touchStart.current) return;
          const dx = event.changedTouches[0].clientX - touchStart.current.x;
          const dy = event.changedTouches[0].clientY - touchStart.current.y;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) go(page + (dx < 0 ? 1 : -1));
          touchStart.current = null;
        }}
      >
        {loading ? <div className="flip-message">Inafungua kitabu...</div> : error ? (
          <div className="flip-message flip-error"><p>Imeshindikana kuonyesha PDF.</p><small>{error}</small><a href={url} target="_blank" rel="noreferrer">Fungua PDF yenyewe</a></div>
        ) : (
          <>
            <button className="page-arrow prev" type="button" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Ukurasa uliopita">‹</button>
            <div className={`page-paper ${turn ? `turn-${turn}` : ""}`}><canvas ref={canvasRef} aria-label={`Ukurasa wa ${page}`} /></div>
            <button className="page-arrow next" type="button" onClick={() => go(page + 1)} disabled={page >= total} aria-label="Ukurasa unaofuata">›</button>
          </>
        )}
      </section>
      <footer className="flip-controls">
        <button type="button" onClick={() => go(page - 1)} disabled={page <= 1}>← Nyuma</button>
        <label><span>Ukurasa</span><input aria-label="Namba ya ukurasa" type="number" min="1" max={total || 1} value={page} onChange={(e) => go(Number(e.target.value) || 1)} /><span>/ {total || "—"}</span></label>
        <button type="button" onClick={() => go(page + 1)} disabled={page >= total}>Mbele →</button>
      </footer>
      <div className="flip-progress"><span style={{ width: total ? `${(page / total) * 100}%` : "0%" }} /></div>
      <style jsx>{`
        .flip-reader{position:fixed;inset:0;z-index:10000;display:flex;flex-direction:column;width:100%;height:100vh;height:100dvh;background:#e9edf3;overflow:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);color:#172b4d}
        .flip-toolbar{height:52px;min-height:52px;display:flex;align-items:center;gap:10px;padding:0 12px;background:#172b4d;color:#fff;box-shadow:0 2px 8px #10213a25}
        .flip-close{font-size:32px;line-height:1;color:#fff;text-decoration:none;width:30px;flex:0 0 30px}
        .flip-title{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
        .flip-stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:12px 34px;overflow:hidden;touch-action:pan-y}
        .page-paper{display:flex;align-items:center;justify-content:center;max-width:100%;max-height:100%;background:white;box-shadow:0 8px 26px #1b2c451f;border-radius:2px;overflow:hidden;transform-origin:left center}
        .page-paper canvas{display:block;max-width:100%;max-height:100%;object-fit:contain}
        .turn-next{animation:turnNext .28s ease-out}.turn-prev{animation:turnPrev .28s ease-out}
        @keyframes turnNext{0%{opacity:.65;transform:perspective(900px) rotateY(-9deg) translateX(12px)}100%{opacity:1;transform:perspective(900px) rotateY(0) translateX(0)}}
        @keyframes turnPrev{0%{opacity:.65;transform:perspective(900px) rotateY(9deg) translateX(-12px)}100%{opacity:1;transform:perspective(900px) rotateY(0) translateX(0)}}
        .page-arrow{position:absolute;z-index:2;top:50%;transform:translateY(-50%);width:34px;height:52px;border:0;border-radius:9px;background:#172b4d;color:#fff;font-size:30px;line-height:1;box-shadow:0 2px 8px #172b4d30}
        .page-arrow:disabled{opacity:.2}.page-arrow.prev{left:5px}.page-arrow.next{right:5px}
        .flip-message{padding:24px;text-align:center;color:#52627a}.flip-error{display:flex;flex-direction:column;gap:10px}.flip-error a{color:#1557a6}
        .flip-controls{min-height:58px;display:flex;align-items:center;justify-content:center;gap:clamp(10px,4vw,30px);padding:8px 12px;background:#fff;border-top:1px solid #dce2eb}
        .flip-controls button{border:0;background:#edf2f8;color:#172b4d;border-radius:20px;padding:10px 13px;font-size:12px;font-weight:700;white-space:nowrap}
        .flip-controls button:disabled{opacity:.35}.flip-controls label{display:flex;align-items:center;gap:6px;font-size:12px;color:#64748b;white-space:nowrap}
        .flip-controls input{width:48px;text-align:center;border:1px solid #cbd5e1;border-radius:8px;padding:7px;color:#172b4d;font-size:14px}
        .flip-progress{height:3px;background:#d7dfeb;flex:0 0 3px}.flip-progress span{display:block;height:100%;background:#2563a6;transition:width .2s}
        @media(max-width:600px){.flip-toolbar{height:48px;min-height:48px;padding:0 9px;gap:7px}.flip-title{font-size:12px}.flip-stage{padding:8px 27px}.page-arrow{width:29px;height:44px;font-size:26px}.flip-controls{min-height:54px;gap:8px;padding:7px 6px}.flip-controls button{padding:9px 10px;font-size:11px}.flip-controls label{gap:4px;font-size:11px}.flip-controls input{width:40px;padding:6px}}
        @media(prefers-reduced-motion:reduce){.turn-next,.turn-prev{animation:none}}
      `}</style>

    </main>
  );
}
