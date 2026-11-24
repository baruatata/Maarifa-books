"use client";

import { requestBookCoupon } from "@/app/kitabu/[id]/actions";
import { useLanguage } from "@/components/language-provider";

export function RequestBookCoupon({ bookId }: { bookId: string }) {
  const { en } = useLanguage();
  return <section className="coupon-redeem">
    <h3>{en ? "Have you paid for this book?" : "Umelipia kitabu hiki?"}</h3>
    <p className="muted">{en ? "After paying the seller directly, request a coupon here. The seller will confirm the payment and send you a coupon." : "Baada ya kulipa moja kwa moja kwa muuzaji, tuma ombi la coupon hapa. Muuzaji atathibitisha malipo kisha akutumie coupon."}</p>
    <form action={requestBookCoupon.bind(null, bookId)} className="coupon-redeem-form">
      <label htmlFor={"customer-name-" + bookId}>{en ? "Your name (optional)" : "Jina lako (si lazima)"}</label>
      <input id={"customer-name-" + bookId} name="customer_name" autoComplete="name" placeholder={en ? "Your name" : "Jina lako"}/>
      <label htmlFor={"customer-phone-" + bookId}>{en ? "Phone number" : "Namba ya simu"}</label>
      <input id={"customer-phone-" + bookId} name="customer_phone" inputMode="tel" autoComplete="tel" placeholder="07XXXXXXXX" required/>
      <label htmlFor={"transaction-reference-" + bookId}>{en ? "Payment reference" : "Kumbukumbu ya malipo"}</label>
      <input id={"transaction-reference-" + bookId} name="transaction_reference" autoComplete="off" placeholder={en ? "Transaction reference" : "Namba ya muamala"} required minLength={3} maxLength={100}/>
      <button className="btn" type="submit">{en ? "Request coupon" : "Omba Coupon"}</button>
    </form>
  </section>;
}
