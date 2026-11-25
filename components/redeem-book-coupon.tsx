"use client";

import { useActionState } from "react";
import Link from "next/link";
import { redeemBookCoupon, type RedeemCouponState } from "@/app/kitabu/actions";
import { useLanguage } from "@/components/language-provider";

const initialState: RedeemCouponState = {};

export function RedeemBookCoupon({ bookId }: { bookId: string }) {
  const { en } = useLanguage();
  const [state, action, pending] = useActionState(redeemBookCoupon, initialState);
  return <div className="coupon-redeem">
    <h3>{en ? "Do you have a coupon for this book?" : "Una coupon ya kitabu hiki?"}</h3>
    <p className="muted">{en ? "Enter the code sent by the seller after your payment was confirmed." : "Ingiza msimbo uliotumwa na muuzaji baada ya kuthibitisha malipo yako."}</p>
    <form action={action} className="coupon-redeem-form">
      <input type="hidden" name="book_id" value={bookId}/>
      <label htmlFor={"coupon-" + bookId}>{en ? "Coupon code" : "Namba ya Coupon"}</label>
      <input id={"coupon-" + bookId} name="coupon_code" autoComplete="off" placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX" required/>
      <button className="btn" disabled={pending}>{pending ? (en ? "Verifying..." : "Inathibitisha...") : (en ? "Open book" : "Fungua kitabu")}</button>
    </form>
    {state.error && <p className="message" role="status">{state.error} <Link href={"/ingia?next=" + encodeURIComponent("/kitabu/" + bookId)}>{en ? "Sign in here" : "Ingia hapa"}</Link>.</p>}
  </div>;
}
