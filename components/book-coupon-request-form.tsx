"use client";

import { useActionState } from "react";
import { createBookCouponRequest, type CouponRequestState } from "@/app/kitabu/actions";

const initialState: CouponRequestState = {};

export function BookCouponRequestForm({ bookId }: { bookId: string }) {
  const [state, action, pending] = useActionState(createBookCouponRequest, initialState);
  if (state.success) return <div className="notice" role="status">Ombi lako la coupon limetumwa kwa muuzaji. Atakagua malipo na kukutumia coupon yako.</div>;
  return <section className="panel" style={{ padding: 16, marginTop: 16 }}>
    <h3>Umelipa tayari? Omba Coupon</h3>
    <p className="muted">Jaza namba uliyotumia kulipa na kumbukumbu ya muamala. Jina ni hiari; kama umeingia kwenye akaunti tutatumia jina lililohifadhiwa.</p>
    <form action={action} style={{ display: "grid", gap: 10 }}>
      <input type="hidden" name="book_id" value={bookId}/>
      <label style={{ display: "grid", gap: 5 }}>Jina lako (hiari)<input name="customer_name" maxLength={120} placeholder="Jina kamili"/></label>
      <label style={{ display: "grid", gap: 5 }}>Namba ya simu uliyotumia kulipa<input name="phone" type="tel" required placeholder="07XXXXXXXX"/></label>
      <label style={{ display: "grid", gap: 5 }}>Namba ya muamala / kumbukumbu ya malipo<input name="transaction_reference" required minLength={3} maxLength={100} placeholder="Mfano: MPESA12345"/></label>
      {state.error && <p className="message" role="alert">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>{pending ? "Inatuma ombi..." : "Tuma ombi la Coupon"}</button>
    </form>
  </section>;
}
