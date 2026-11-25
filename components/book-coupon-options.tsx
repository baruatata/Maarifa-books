"use client";

import { useEffect, useState } from "react";
import { RedeemBookCoupon } from "@/components/redeem-book-coupon";
import { RequestBookCoupon } from "@/components/request-book-coupon";
import { useLanguage } from "@/components/language-provider";

export function BookCouponOptions({ bookId, requested = false, error }: { bookId: string; requested?: boolean; error?: string }) {
  const { en } = useLanguage();
  const [choice, setChoice] = useState<"has" | "none" | null>(requested ? "has" : null);
  const [open, setOpen] = useState(requested);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const openChoice = (next: "has" | "none") => {
    setChoice(next);
    setOpen(true);
  };

  return <section className="coupon-redeem coupon-options">
    {error && <p className="message" role="status">{error}</p>}
    {requested && <p className="notice">{en ? "Your request has been sent to the seller. After payment is confirmed and the coupon is sent, enter it below." : "Ombi lako limetumwa kwa muuzaji. Baada ya kuthibitisha malipo na kukutumia coupon, ingiza hapa chini."}</p>}
    <h3>{en ? "Do you have a coupon for this book?" : "Una coupon ya kitabu hiki?"}</h3>
    <div className="coupon-choice-actions">
      <button type="button" className={choice === "has" ? "btn" : "btn btn-outline"} aria-pressed={choice === "has"} onClick={() => openChoice("has")}>{en ? "I have a coupon" : "Nina Coupon"}</button>
      <button type="button" className={choice === "none" ? "btn" : "btn btn-outline"} aria-pressed={choice === "none"} onClick={() => openChoice("none")}>{en ? "I don’t have a coupon" : "Sina Coupon"}</button>
    </div>

    {open && choice && <div className="coupon-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
      <section className="coupon-modal" role="dialog" aria-modal="true" aria-labelledby="coupon-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="coupon-modal-heading">
          <h2 id="coupon-modal-title">{choice === "has" ? (en ? "Enter coupon" : "Ingiza Coupon") : (en ? "Request coupon" : "Omba Coupon")}</h2>
          <button type="button" className="coupon-modal-close" aria-label={en ? "Close dialog" : "Funga popup"} onClick={() => setOpen(false)}>×</button>
        </div>
        {choice === "has" ? <RedeemBookCoupon bookId={bookId}/> : <RequestBookCoupon bookId={bookId}/>}
      </section>
    </div>}
  </section>;
}
