"use client";

import { useState } from "react";

export function CopyPhoneButton({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="btn btn-outline book-copy-phone-button" onClick={copyPhone}>
      {copied ? "Namba imenakiliwa" : "Nakili namba"}
    </button>
  );
}
