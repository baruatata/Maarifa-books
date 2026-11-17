"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = { url: string; title: string; closeHref: string };
type PdfPage = {
  getViewport: (options: { scale: number }) => any;
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: any }) => { promise: Promise<void>; cancel: () => void };
};
type PdfDocument = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
};

function PdfScrollPage({
  pdf,
  pageNumber,
  onVisible,
}: {
  pdf: PdfDocument;
  pageNumber: number;
  onVisible: (page: number) => void;
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderRef = useRef<{ cancel: () => void } | null>(null);
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          onVisible(pageNumber);
        }
      });
    }, { rootMargin: "900px 0px" });
    observer.observe(shell);
    const resize = new ResizeObserver(() => setWidth(shell.clientWidth));
    resize.observe(shell);
    setWidth(shell.clientWidth);
    return () => {
      observer.disconnect();
      resize.disconnect();
    };
  }, [onVisible, pageNumber]);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!visible || !canvas || !width) return;
    if (renderRef.current) renderRef.current.cancel();

    pdf.getPage(pageNumber).then((pdfPage) => {
      if (cancelled) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = (Math.min(width, 920) / base.width) * dpr;
      const viewport = pdfPage.getViewport({ scale });
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = (viewport.width / dpr) + "px";
      canvas.style.height = (viewport.height / dpr) + "px";
      const task = pdfPage.render({ canvasContext: context, viewport });
      renderRef.current = task;
      return task.promise;
    }).catch((error: unknown) => {
      if (!cancelled && !(error instanceof Error && error.name === "RenderingCancelledException")) {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
      if (renderRef.current) renderRef.current.cancel();
    };
  }, [pdf, pageNumber, visible, width]);

  return (
    <section className="scroll-page" ref={shellRef} aria-label={"Ukurasa wa " + pageNumber}>
      <div className="scroll-page-number">UKURASA {pageNumber}</div>
      {failed ? (
        <div className="scroll-page-error">Ukurasa huu haukuweza kuonyeshwa. Jaribu kupakia upya kitabu.</div>
      ) : (
        <canvas ref={canvasRef} className="scroll-page-canvas" />
      )}
    </section>
  );
}

export default function PdfFlipbook({ url, title, closeHref }: Props) {
  const pdfRef = useRef<PdfDocument | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      if (!active) {
        await document.destroy();
        return;
      }
      pdfRef.current = document;
      setTotal(document.numPages);
      setCurrentPage(1);
      setLoading(false);
    }).catch((err: unknown) => {
      if (active) {
        setError(err instanceof Error ? err.message : "PDF haikuweza kufunguliwa.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
      if (loaded) void loaded.destroy();
      pdfRef.current = null;
    };
  }, [url]);

  const markVisible = (page: number) => {
    setCurrentPage((previous) => previous === page ? previous : page);
  };

  return (
    <div className="scroll-reader" aria-label={"Kisomaji cha " + title}>
      <header className="scroll-toolbar">
        <Link className="scroll-back" href={closeHref} aria-label="Rudi kwenye kitabu">‹</Link>
        <div className="scroll-book-title">
          <strong>{title}</strong>
          <span>{loading ? "Inafungua kitabu..." : total ? "Ukurasa " + currentPage + " kati ya " + total : "Kisomaji cha MaarifaBooks"}</span>
        </div>
        <a className="scroll-download" href={url} target="_blank" rel="noreferrer">PDF</a>
      </header>

      {loading ? (
        <div className="scroll-status">Inafungua kitabu chako, tafadhali subiri...</div>
      ) : error ? (
        <div className="scroll-status scroll-error">
          <strong>Imeshindikana kufungua PDF.</strong>
          <span>{error}</span>
          <a href={url} target="_blank" rel="noreferrer">Fungua PDF yenyewe</a>
        </div>
      ) : pdfRef.current ? (
        <div className="scroll-pages">
          {Array.from({ length: total }, (_, index) => (
            <PdfScrollPage
              key={index + 1}
              pdf={pdfRef.current as PdfDocument}
              pageNumber={index + 1}
              onVisible={markVisible}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
