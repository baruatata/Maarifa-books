"use client";

import { useActionState } from "react";
import { redeemBookCoupon, type RedeemCouponState } from "@/app/kitabu/actions";

const initialState: RedeemCouponState = {};

export function RedeemBookCoupon({ bookId }: { bookId: string }) {
  const [state, action, pending] = useActionState(redeemBookCoupon, initialState);
  return <div className="coupon-redeem">
    <h3>Una coupon ya kitabu hiki?</h3>
    <p className="muted">Ingiza msimbo uliotumwa na muuzaji baada ya kuthibitisha malipo yako.</p>
    <form action={action} className="coupon-redeem-form">
      <input type="hidden" name="book_id" value={bookId}/>
      <label htmlFor={"coupon-" + bookId}>Namba ya Coupon</label>
      <input id={"coupon-" + bookId} name="coupon_code" autoComplete="off" placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX" required/>
      <button className="btn" disabled={pending}>{pending ? "Inathibitisha..." : "Fungua kitabu"}</button>
    </form>
    {state.error && <p className="message" role="status">{state.error}</p>}
  </div>;
}
