"use client";

import { useActionState, useState } from "react";
import { createBookAccessCoupon, type CouponActionState } from "@/app/dashboard/kuponi/actions";

const initialState: CouponActionState = {};

export function CreateBookCoupon({ bookId }: { bookId: string }) {
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
      <input type="hidden" name="book_id" value={bookId}/>
      <button className="btn" disabled={pending}>{pending ? "Inatengeneza..." : "Tengeneza Coupon mpya"}</button>
    </form>
    {state.error && <p className="message" role="status">{state.error}</p>}
    {state.code && <div className="coupon-result">
      <p><strong>Coupon yako mpya</strong></p>
      <code>{state.code}</code>
      <button type="button" className="btn btn-outline" onClick={copyCode}>{copied ? "Imenakiliwa" : "Nakili Coupon"}</button>
      <small className="muted">Hifadhi na mtumie mteja huyu msimbo mara moja. Hautaweza kuonyesha tena msimbo huu baada ya kuondoka kwenye ukurasa.</small>
    </div>}
  </div>;
}
