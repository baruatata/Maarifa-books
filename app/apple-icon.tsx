import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#101d36", borderRadius: 34 }}>
      <svg width="142" height="142" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="book" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#244d7e" />
            <stop offset="1" stopColor="#071a35" />
          </linearGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff0b8" />
            <stop offset="1" stopColor="#b97822" />
          </linearGradient>
        </defs>
        <path d="M8 15Q21 9 31 17V51Q20 43 8 49Z" fill="url(#book)" stroke="url(#gold)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M56 15Q43 9 33 17V51Q44 43 56 49Z" fill="url(#book)" stroke="url(#gold)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M32 17V52" stroke="#f7d58c" strokeWidth="2" />
        <path d="M13 24Q21 21 27 25M13 31Q21 28 27 32M37 25Q44 21 51 24M37 32Q44 28 51 31" stroke="#f5d99f" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>,
    { width: 180, height: 180 },
  );
}
