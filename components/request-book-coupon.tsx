"use client";

import { requestBookCoupon } from "@/app/kitabu/[id]/actions";

export function RequestBookCoupon({ bookId }: { bookId: string }) {
  return <section className="coupon-redeem">
    <h3>Umelipia kitabu hiki?</h3>
    <p className="muted">Baada ya kulipa moja kwa moja kwa muuzaji, tuma ombi la coupon hapa. Muuzaji atathibitisha malipo kisha akutumie coupon.</p>
    <form action={requestBookCoupon.bind(null, bookId)} className="coupon-redeem-form">
      <label htmlFor={"customer-name-" + bookId}>Jina lako (si lazima)</label>
      <input id={"customer-name-" + bookId} name="customer_name" autoComplete="name" placeholder="Jina lako"/>
      <label htmlFor={"customer-phone-" + bookId}>Namba ya simu</label>
      <input id={"customer-phone-" + bookId} name="customer_phone" inputMode="tel" autoComplete="tel" placeholder="07XXXXXXXX" required/>
      <label htmlFor={"transaction-reference-" + bookId}>Kumbukumbu ya malipo</label>
      <input id={"transaction-reference-" + bookId} name="transaction_reference" autoComplete="off" placeholder="Namba ya muamala" required minLength={3} maxLength={100}/>
      <button className="btn" type="submit">Omba Coupon</button>
    </form>
  </section>;
}
