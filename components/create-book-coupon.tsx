"use client";

import { useActionState, useState } from "react";
import {
  createBookAccessCoupon,
  markBookCouponRequestFulfilled,
  setCouponRequestPaymentStatus,
  type CouponActionState,
  type FulfillRequestState,
  type PaymentConfirmationState,
} from "@/app/dashboard/kuponi/actions";

const initialState: CouponActionState = {};
const initialFulfillState: FulfillRequestState = {};
const initialPaymentState: PaymentConfirmationState = {};

export function CreateBookCoupon({ bookId, requestId, paymentStatus }: { bookId: string; requestId?: string; paymentStatus?: string }) {
  const [state, action, pending] = useActionState(createBookAccessCoupon, initialState);
  const [fulfillState, fulfillAction, fulfilling] = useActionState(markBookCouponRequestFulfilled, initialFulfillState);
  const [paymentState, paymentAction, confirming] = useActionState(setCouponRequestPaymentStatus, initialPaymentState);
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
    {requestId && paymentStatus !== "received" && <>
      <p className="muted">Kagua taarifa za muamala kwenye akaunti yako ya simu kabla ya kuthibitisha.</p>
      <form action={paymentAction}>
        <input type="hidden" name="request_id" value={requestId}/>
        <input type="hidden" name="payment_status" value="received"/>
        <button className="btn" disabled={confirming}>{confirming ? "Inahifadhi..." : "Nimethibitisha kupokea fedha"}</button>
      </form>
      <form action={paymentAction} style={{ marginTop: 6 }}>
        <input type="hidden" name="request_id" value={requestId}/>
        <input type="hidden" name="payment_status" value="not_received"/>
        <button className="btn btn-outline" disabled={confirming}>{confirming ? "Inahifadhi..." : "Sijapokea fedha"}</button>
      </form>
      {paymentState.error && <p className="message" role="alert">{paymentState.error}</p>}
      {paymentState.ok && <p className="notice" role="status">Uthibitisho umehifadhiwa.</p>}
    </>}

    {requestId && paymentStatus === "received" && <p className="notice">Muuzaji amethibitisha kupokea malipo. Sasa unaweza kutengeneza coupon ya ombi hili.</p>}

    {(!requestId || paymentStatus === "received") && <form action={action}>
      <input type="hidden" name="book_id" value={bookId}/>
      {requestId && <input type="hidden" name="request_id" value={requestId}/>}
      <button className="btn" disabled={pending}>{pending ? "Inatengeneza..." : requestId ? "Tengeneza coupon ya ombi hili" : "Tengeneza Coupon mpya"}</button>
    </form>}
    {state.error && <p className="message" role="status">{state.error}</p>}
    {state.code && <div className="coupon-result">
      <p><strong>Coupon yako mpya</strong></p>
      <code>{state.code}</code>
      <button type="button" className="btn btn-outline" onClick={copyCode}>{copied ? "Imenakiliwa" : "Nakili Coupon"}</button>
      <small className="muted">Nakili coupon hii na umtumie mteja. Baada ya kuituma, bonyeza “Nimetuma coupon kwa mteja” hapa chini.</small>
    </div>}
    {requestId && state.code && <form action={fulfillAction} style={{ marginTop: 8 }}>
      <input type="hidden" name="request_id" value={requestId}/>
      <button className="btn btn-outline" type="submit" disabled={fulfilling}>{fulfilling ? "Inahifadhi..." : "Nimetuma coupon kwa mteja"}</button>
      {fulfillState.error && <p className="message" role="alert">{fulfillState.error}</p>}
      {fulfillState.ok && <p className="notice" role="status">Ombi limewekwa kuwa limehudumiwa. Taarifa mpya imeondolewa kwenye dashboard.</p>}
    </form>}
  </div>;
}
