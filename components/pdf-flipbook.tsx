"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = { url: string; title: string };

export default function PdfFlipbook({ url, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    let task: any;
    import("pdfjs-dist/legacy/build/pdf.mjs").then(async (pdfjs: any) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      task = pdfjs.getDocument({ url });
      const doc = await task.promise;
      if (active) {
        setPdf(doc);
        setTotal(doc.numPages);
        setLoading(false);
      }
    }).catch(() => {
      if (active) {
        setError("PDF haikuweza kupakiwa. Hakikisha intaneti ipo kisha jaribu tena.");
        setLoading(false);
      }
    });
    return () => {
      active = false;
      task?.destroy?.();
    };
  }, [url]);

  useEffect(() => {
    let cancelled = false;
    let renderTask: any;
    async function draw() {
      if (!pdf || !canvasRef.current) return;
      setBusy(true);
      try {
        const pdfPage = await pdf.getPage(page);
        if (cancelled || !canvasRef.current) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const maxWidth = Math.min(window.innerWidth - 32, 900);
        const scale = Math.max(0.5, Math.min(maxWidth / base.width, 1.8));
        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        renderTask = pdfPage.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch {
        if (!cancelled) setError("Imeshindikana kuonyesha ukurasa huu wa PDF.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    draw();
    return () => {
      cancelled = true;
      renderTask?.cancel?.();
    };
  }, [pdf, page]);

  const go = useCallback((next: number) => {
    setPage(Math.max(1, Math.min(total, next)));
  }, [total]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(page + 1);
      if (event.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  return (
    <section className="flipbook" aria-label={`Kisomaji cha ${title}`}>
      <div className="flipbook-toolbar">
        <span className="flipbook-title">{title}</span>
        <span className="flipbook-count">{total ? `Ukurasa ${page} / ${total}` : "Inapakia..."}</span>
      </div>
      {loading ? <div className="flipbook-message">Tafadhali subiri, tunafungua kurasa za kitabu...</div> :
        error ? <div className="flipbook-message flipbook-error">{error}</div> :
        <div className="flipbook-stage"
          onTouchStart={(e) => { touchStartX.current = e.touches[0]?.clientX ?? null; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(delta) > 45) go(page + (delta < 0 ? 1 : -1));
            touchStartX.current = null;
          }}>
          <button className="flipbook-arrow" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Ukurasa uliopita">‹</button>
          <div className={`flipbook-paper ${busy ? "flipbook-busy" : ""}`}>
            <canvas ref={canvasRef} />
          </div>
          <button className="flipbook-arrow" onClick={() => go(page + 1)} disabled={page >= total} aria-label="Ukurasa unaofuata">›</button>
        </div>}
      {!loading && !error && <div className="flipbook-controls">
        <button onClick={() => go(page - 1)} disabled={page <= 1}>← Nyuma</button>
        <label>Ukurasa <input aria-label="Namba ya ukurasa" type="number" min="1" max={total}
          value={page} onChange={(e) => go(Number(e.target.value) || 1)} /></label>
        <button onClick={() => go(page + 1)} disabled={page >= total}>Mbele →</button>
      </div>}
      <p className="flipbook-hint">Telezesha kushoto au kulia kubadilisha ukurasa.</p>
      <style jsx>{`
        .flipbook{width:100%;max-width:980px;margin:0 auto;color:#18212f}
        .flipbook-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 14px;background:#172b4d;color:white;border-radius:14px 14px 0 0;font-size:14px}
        .flipbook-title{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .flipbook-count{white-space:nowrap;font-variant-numeric:tabular-nums}
        .flipbook-stage{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 6px;background:#e9edf3;min-height:280px}
        .flipbook-paper{background:white;box-shadow:0 5px 22px #15223825;max-width:calc(100% - 76px);width:760px;line-height:0;transition:opacity .16s ease}
        .flipbook-paper canvas{display:block;max-width:100%;object-fit:contain}
        .flipbook-busy{opacity:.55}
        .flipbook-arrow{border:0;border-radius:50%;width:38px;height:38px;flex:0 0 38px;background:#fff;color:#172b4d;font-size:28px;line-height:1;cursor:pointer;box-shadow:0 2px 8px #0002}
        .flipbook-arrow:disabled,.flipbook-controls button:disabled{opacity:.3;cursor:not-allowed}
        .flipbook-controls{display:flex;justify-content:center;align-items:center;gap:12px;padding:14px;flex-wrap:wrap}
        .flipbook-controls button{border:1px solid #ccd4df;background:white;border-radius:9px;padding:10px 14px;font-weight:650;color:#172b4d}
        .flipbook-controls label{font-size:13px;display:flex;align-items:center;gap:7px}
        .flipbook-controls input{width:62px;padding:8px;border:1px solid #ccd4df;border-radius:8px;text-align:center}
        .flipbook-message{padding:42px 18px;text-align:center;background:#f3f5f8;color:#445}
        .flipbook-error{color:#a12626}
        .flipbook-hint{text-align:center;color:#697586;font-size:12px;margin:0 0 10px}
        @media(max-width:600px){.flipbook-stage{gap:4px;padding:10px 2px;min-height:220px}.flipbook-paper{max-width:calc(100% - 54px)}.flipbook-arrow{width:28px;height:28px;flex-basis:28px;font-size:22px}.flipbook-toolbar{font-size:12px;padding:10px}}
      `}</style>
    </section>
  );
}
