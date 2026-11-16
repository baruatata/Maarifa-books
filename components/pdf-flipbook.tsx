"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = { url: string; title: string; closeHref: string };

export default function PdfFlipbook({ url, title, closeHref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(1.25);

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
        const availableWidth = Math.max(280, window.innerWidth - 24);
        const fitScale = availableWidth / base.width;
        const viewport = pdfPage.getViewport({ scale: fitScale * zoom });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        renderTask = pdfPage.render({
          canvasContext: context,
          viewport,
          transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0],
        });
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
  }, [pdf, page, zoom]);

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
        <Link className="flipbook-close" href={closeHref} aria-label="Funga kisomaji" title="Funga kisomaji"><span aria-hidden="true">×</span><small>Funga</small></Link>
      </div>
      {!loading && !error && <div className="zoom-controls" aria-label="Ukubwa wa maandishi">
        <span>Ukubwa wa maandishi</span>
        <button onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))} disabled={zoom <= 1} aria-label="Punguza ukubwa">A−</button>
        <strong>{Math.round(zoom * 100)}%</strong>
        <button onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))} disabled={zoom >= 3} aria-label="Ongeza ukubwa">A+</button>
        <button className="fit-button" onClick={() => setZoom(1)}>Linganisha skrini</button>
      </div>}
      {loading ? <div className="flipbook-message">Tafadhali subiri, tunafungua kurasa za kitabu...</div> :
        error ? <div className="flipbook-message flipbook-error">{error}</div> :
        <div className="flipbook-stage"
          onTouchStart={(e) => { touchStartX.current = e.touches[0]?.clientX ?? null; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(delta) > 65) go(page + (delta < 0 ? 1 : -1));
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
      <p className="flipbook-hint">Tumia A+ kuongeza maandishi. Ukurasa ukiwa mkubwa, telezesha pembeni kusoma sehemu zote; telezesha juu/chini kusoma ukurasa.</p>
      <style jsx>{`
        .flipbook{position:fixed;inset:0;z-index:10000;width:100%;height:100dvh;max-width:none;margin:0;background:#f3f5f8;color:#18212f;display:flex;flex-direction:column;overflow:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}
        .flipbook-toolbar{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;background:#172b4d;color:white;border-radius:0;font-size:14px;flex:0 0 auto;min-height:54px}
        .flipbook-title{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .flipbook-count{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:12px}.flipbook-close{display:flex;align-items:center;gap:4px;color:white;text-decoration:none;font-weight:700;flex:0 0 auto}.flipbook-close span{font-size:32px;line-height:28px}.flipbook-close small{font-size:12px}
        .zoom-controls{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:8px;background:#f5f7fa;flex:0 0 auto}
        .zoom-controls span{font-size:13px;font-weight:600}
        .zoom-controls button{min-width:46px;min-height:44px;border:1px solid #b9c5d4;border-radius:9px;background:white;color:#172b4d;font-weight:800;font-size:17px;padding:8px 12px}
        .zoom-controls button:disabled{opacity:.35}
        .zoom-controls strong{min-width:48px;text-align:center;font-variant-numeric:tabular-nums}
        .zoom-controls .fit-button{font-size:13px;font-weight:650}
        .flipbook-stage{display:flex;align-items:stretch;justify-content:center;gap:6px;padding:8px 4px;background:#e9edf3;min-height:0;flex:1;overflow:hidden}
        .flipbook-paper{background:white;box-shadow:0 5px 22px #15223825;flex:1;min-width:0;max-width:calc(100% - 84px);overflow:auto;line-height:0;transition:opacity .16s ease;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
        .flipbook-paper canvas{display:block;max-width:none;height:auto}
        .flipbook-busy{opacity:.6}
        .flipbook-arrow{position:sticky;top:45%;align-self:flex-start;margin-top:160px;border:0;border-radius:50%;width:36px;height:36px;flex:0 0 36px;background:#fff;color:#172b4d;font-size:27px;line-height:1;cursor:pointer;box-shadow:0 2px 8px #0002}
        .flipbook-arrow:disabled,.flipbook-controls button:disabled{opacity:.3;cursor:not-allowed}
        .flipbook-controls{display:flex;justify-content:center;align-items:center;gap:12px;padding:8px;flex-wrap:wrap;background:#f3f5f8;flex:0 0 auto}
        .flipbook-controls button{min-height:44px;border:1px solid #ccd4df;background:white;border-radius:9px;padding:10px 16px;font-weight:650;color:#172b4d}
        .flipbook-controls label{font-size:14px;display:flex;align-items:center;gap:7px}
        .flipbook-controls input{width:70px;min-height:42px;padding:8px;border:1px solid #ccd4df;border-radius:8px;text-align:center;font-size:16px}
        .flipbook-message{padding:42px 18px;text-align:center;background:#f3f5f8;color:#445}
        .flipbook-error{color:#a12626}
        .flipbook-hint{text-align:center;color:#596579;font-size:12px;line-height:1.35;margin:0;padding:2px 10px 6px;flex:0 0 auto}
        @media(max-width:600px){.flipbook-toolbar{font-size:13px;padding:8px 9px;min-height:50px}.flipbook-title{max-width:45vw}.flipbook-close span{font-size:30px}.flipbook-close small{display:none}.zoom-controls{gap:7px}.zoom-controls span{width:100%;text-align:center}.flipbook-stage{gap:3px;padding:8px 2px;min-height:220px}.flipbook-paper{max-width:calc(100% - 58px)}.flipbook-arrow{width:26px;height:34px;flex-basis:26px;font-size:23px;margin-top:110px}.flipbook-hint{font-size:12px}}
      `}</style>
    </section>
  );
}
