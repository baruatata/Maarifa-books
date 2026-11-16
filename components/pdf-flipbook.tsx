"use client";

import Link from "next/link";

type Props = { url: string; title: string; closeHref: string };

export default function PdfFlipbook({ url, title, closeHref }: Props) {
  return (
    <main className="pdf-reader" aria-label={`PDF yote ya ${title}`}>
      <header className="pdf-toolbar">
        <span className="pdf-title">{title}</span>
        <a className="pdf-open" href={url} target="_blank" rel="noreferrer">Fungua PDF</a>
        <Link className="pdf-close" href={closeHref} aria-label="Funga PDF" title="Funga PDF">×</Link>
      </header>
      <iframe
        className="pdf-document"
        src={`${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
        title={`PDF: ${title}`}
        allow="fullscreen"
      />
      <style jsx>{`
        .pdf-reader{position:fixed;inset:0;z-index:10000;width:100%;height:100vh;height:100dvh;background:#eef1f5;display:flex;flex-direction:column;overflow:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}
        .pdf-toolbar{height:54px;min-height:54px;display:flex;align-items:center;gap:12px;padding:0 12px;background:#172b4d;color:white}
        .pdf-title{font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
        .pdf-open{color:white;font-size:13px;font-weight:650;text-decoration:underline;white-space:nowrap}
        .pdf-close{width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;color:#172b4d;text-decoration:none;font-size:32px;line-height:1;font-weight:400;flex:0 0 40px}
        .pdf-document{display:block;width:100%;height:calc(100% - 54px);flex:1;border:0;background:#fff}
        @media(max-width:600px){.pdf-toolbar{height:50px;min-height:50px;padding:0 9px;gap:9px}.pdf-title{font-size:13px}.pdf-open{font-size:12px}.pdf-close{width:38px;height:38px;flex-basis:38px}}
      `}</style>
    </main>
  );
}
