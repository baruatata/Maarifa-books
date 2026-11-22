"use client";

import { useState } from "react";
import { RedeemBookCoupon } from "@/components/redeem-book-coupon";
import { RequestBookCoupon } from "@/components/request-book-coupon";

export function BookCouponOptions({ bookId, requested = false, error }: { bookId: string; requested?: boolean; error?: string }) {
  const [choice, setChoice] = useState<"has" | "none" | null>(requested ? "has" : null);

  return <section className="coupon-redeem">
    {error && <p className="message" role="status">{error}</p>}
    {requested && <p className="notice">Ombi lako limetumwa kwa muuzaji. Baada ya kuthibitisha malipo na kukutumia coupon, ingiza hapa chini.</p>}
    <h3>Una coupon ya kitabu hiki?</h3>
    <div className="coupon-choice-actions">
      <button type="button" className={choice === "has" ? "btn" : "btn btn-outline"} aria-pressed={choice === "has"} onClick={() => setChoice("has")}>Nina Coupon</button>
      <button type="button" className={choice === "none" ? "btn" : "btn btn-outline"} aria-pressed={choice === "none"} onClick={() => setChoice("none")}>Sina Coupon</button>
    </div>
    {choice === "has" && <RedeemBookCoupon bookId={bookId}/>}
    {choice === "none" && <RequestBookCoupon bookId={bookId}/>}
  </section>;
}
