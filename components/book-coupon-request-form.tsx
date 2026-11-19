"use client";

import { useState, useActionState } from "react";
import { createBookCouponRequest, type CouponRequestState } from "@/app/kitabu/actions";
import { RedeemBookCoupon } from "@/components/redeem-book-coupon";

const initialState: CouponRequestState = {};

export function BookCouponRequestForm({ bookId }: { bookId: string }) {
  const [state, action, pending] = useActionState(createBookCouponRequest, initialState);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showCouponEntry, setShowCouponEntry] = useState(false);

  if (state.success) return (
    <section className="panel" style={{ padding: 16, marginTop: 16 }}>
      <div className="notice" role="status">
        <p>Ombi lako limehifadhiwa na linaonekana kwenye dashibodi ya muuzaji. Atakagua malipo na kukutumia coupon yako kupitia simu.</p>
        {state.whatsappUrl ? <a className="btn" href={state.whatsappUrl} target="_blank" rel="noreferrer">Tuma taarifa kwa muuzaji WhatsApp</a> : <p className="muted">Namba ya WhatsApp ya muuzaji haipatikani; ombi lako bado limehifadhiwa kwenye dashibodi yake.</p>}
        <p className="muted">Bonyeza kitufe cha WhatsApp kisha bonyeza Tuma ndani ya WhatsApp ili ujumbe umfikie muuzaji.</p>
      </div>
      <button
        className="btn btn-outline"
        type="button"
        aria-expanded={showCouponEntry}
        onClick={() => setShowCouponEntry((visible) => !visible)}
      >
        {showCouponEntry ? "Funga sehemu ya coupon" : "Nimepokea coupon — Ingiza hapa"}
      </button>
      {showCouponEntry && <RedeemBookCoupon bookId={bookId} />}
    </section>
  );

  return (
    <section className="panel" style={{ padding: 16, marginTop: 16 }}>
      <h3>Umelipa tayari?</h3>
      <p className="muted">Baada ya kulipa kwa muuzaji, dai coupon hapa. Muuzaji atakagua malipo yako na kukutumia coupon kupitia simu.</p>
      {!showRequestForm ? (
        <button className="btn" type="button" onClick={() => setShowRequestForm(true)}>
          Dai coupon
        </button>
      ) : (
        <>
          <form action={action} style={{ display: "grid", gap: 10 }}>
            <input type="hidden" name="book_id" value={bookId}/>
            <label style={{ display: "grid", gap: 5 }}>Jina lako (hiari)<input name="customer_name" maxLength={120} placeholder="Jina kamili"/></label>
            <label style={{ display: "grid", gap: 5 }}>Namba ya simu uliyotumia kulipa<input name="phone" type="tel" required placeholder="07XXXXXXXX"/></label>
            <label style={{ display: "grid", gap: 5 }}>Namba ya muamala / kumbukumbu ya malipo<input name="transaction_reference" required minLength={3} maxLength={100} placeholder="Mfano: MPESA12345"/></label>
            {state.error && <p className="message" role="alert">{state.error}</p>}
            <button className="btn" type="submit" disabled={pending}>{pending ? "Inatuma ombi..." : "Tuma ombi la coupon"}</button>
          </form>
          <button className="btn btn-outline" type="button" onClick={() => setShowRequestForm(false)}>
            Funga
          </button>
        </>
      )}
    </section>
  );
}
