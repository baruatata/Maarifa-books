"use client";

import { useActionState, useState } from "react";
import { createBookAccessCoupon, markBookCouponRequestFulfilled, type CouponActionState, type FulfillRequestState } from "@/app/dashboard/kuponi/actions";

const initialState: CouponActionState = {};
const initialFulfillState: FulfillRequestState = {};

export function CreateBookCoupon({ bookId, requestId }: { bookId: string; requestId?: string }) {
  const [state, action, pending] = useActionState(createBookAccessCoupon, initialState);
  const [fulfillState, fulfillAction, fulfilling] = useActionState(markBookCouponRequestFulfilled, initialFulfillState);
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
      {requestId && <input type="hidden" name="request_id" value={requestId}/>}
      <button className="btn" disabled={pending}>{pending ? "Inatengeneza..." : requestId ? "Tengeneza coupon ya ombi hili" : "Tengeneza Coupon mpya"}</button>
    </form>
    {state.error && <p className="message" role="status">{state.error}</p>}
    {state.code && <div className="coupon-result">
      <p><strong>Coupon yako mpya</strong></p>
      <code>{state.code}</code>
      <button type="button" className="btn btn-outline" onClick={copyCode}>{copied ? "Imenakiliwa" : "Nakili Coupon"}</button>
      <small className="muted">Nakili coupon hii na umtumie mteja. Baada ya kuituma, bonyeza “Nimetuma coupon kwa mteja” hapa chini.</small>
    </div>}
    {requestId && <form action={fulfillAction} style={{ marginTop: 8 }}>
      <input type="hidden" name="request_id" value={requestId}/>
      <button className="btn btn-outline" type="submit" disabled={fulfilling}>{fulfilling ? "Inahifadhi..." : "Nimetuma coupon kwa mteja"}</button>
      {fulfillState.error && <p className="message" role="alert">{fulfillState.error}</p>}
      {fulfillState.ok && <p className="notice" role="status">Ombi limewekwa kuwa limehudumiwa. Taarifa mpya imeondolewa kwenye dashboard.</p>}
    </form>}
  </div>;
}
