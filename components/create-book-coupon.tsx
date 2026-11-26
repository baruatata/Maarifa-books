"use client";

import { useActionState, useState } from "react";
import { createBookAccessCoupon, type CouponActionState } from "@/app/dashboard/kuponi/actions";
import { useLanguage } from "@/components/language-provider";

const initialState: CouponActionState = {};

export function CreateBookCoupon({ bookId, requestId }: { bookId: string; requestId: string }) {
  const { en } = useLanguage();
  const [state, action, pending] = useActionState(createBookAccessCoupon, initialState);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!state.code) return;
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return <div className="coupon-maker">
    <form action={action}>
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="request_id" value={requestId} />
      <button className="btn" disabled={pending}>{pending ? (en ? "Creating..." : "Inatengeneza...") : (en ? "Create coupon for this request" : "Tengeneza Coupon ya ombi hili")}</button>
    </form>
    {state.error && <p className="message" role="status">{state.error}</p>}
    {state.code && <div className="coupon-result">
      <p><strong>{en ? "Your new coupon" : "Coupon yako mpya"}</strong></p>
      <code>{state.code}</code>
      <button type="button" className="btn btn-outline" onClick={copyCode}>{copied ? (en ? "Copied" : "Imenakiliwa") : (en ? "Copy coupon" : "Nakili Coupon")}</button>
      <small className="muted">{en ? "Save and send this code to this customer now. You will not be able to view it again after leaving this page." : "Hifadhi na mtumie mteja huyu msimbo mara moja. Hautaweza kuonyesha tena msimbo huu baada ya kuondoka kwenye ukurasa."}</small>
    </div>}
  </div>;
}
