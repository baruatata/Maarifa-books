import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { createCustomerTicket, replyToCustomerTicket, updateCustomerProfile } from "./actions";
import { LanguageText } from "@/components/language-provider";

const categoryLabels: Record<string, { sw: string; en: string }> = {
  payment: { sw: "Tatizo la malipo", en: "Payment issue" },
  book_access: { sw: "Kitabu hakifunguki / sijakipata", en: "Book will not open / not received" },
  book_quality: { sw: "Kurasa au ubora wa kitabu", en: "Book pages or quality" },
  account: { sw: "Akaunti yangu", en: "My account" },
  other: { sw: "Jambo lingine", en: "Other" },
};
const statusLabels: Record<string, { sw: string; en: string }> = {
  received: { sw: "Limepokelewa", en: "Received" },
  in_progress: { sw: "Linafanyiwa kazi", en: "In progress" },
  resolved: { sw: "Limetatuliwa", en: "Resolved" },
};

export default async function CustomerSelfServicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; created?: string; replied?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia?next=%2Fdashboard%2Fjihudumie");

  const { data: profile } = await supabase.from("profiles")
    .select("full_name,phone,email,role").eq("id", user.id).single();
  if (profile?.role !== "buyer") redirect("/dashboard");

  const [{ data: orders }, { data: entitlements }, { data: submissions }, { data: tickets }] = await Promise.all([
    supabase.from("orders")
      .select("id,total_tzs,status,payment_provider,provider_reference,paid_at,created_at,order_items(id,unit_price_tzs,books(id,title,author_name,format))")
      .eq("buyer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("book_entitlements")
      .select("id,created_at,books(id,title,author_name,format,file_path)")
      .eq("buyer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("payment_submissions")
      .select("id,amount_tzs,payment_provider,transaction_reference,status,created_at,reviewed_at,seller_note")
      .eq("buyer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("support_tickets")
      .select("id,reference_code,category,subject,status,sms_notifications_consented,created_at,updated_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const ticketIds = (tickets ?? []).map(ticket => ticket.id);
  const { data: messages } = ticketIds.length
    ? await supabase.from("support_ticket_messages")
        .select("id,ticket_id,sender_id,body,created_at")
        .in("ticket_id", ticketIds).order("created_at", { ascending: true })
    : { data: [] as { id: string; ticket_id: string; sender_id: string; body: string; created_at: string }[] };

  const messagesByTicket = new Map<string, typeof messages>();
  for (const message of messages ?? []) {
    const current = messagesByTicket.get(message.ticket_id) ?? [];
    current.push(message);
    messagesByTicket.set(message.ticket_id, current);
  }

  const purchasedBooks = new Map<string, { id: string; title: string; author_name: string | null; format: string; downloadUrl: string | null }>();
  for (const entitlement of entitlements ?? []) {
    const book = Array.isArray(entitlement.books) ? entitlement.books[0] : entitlement.books;
    if (!book?.id) continue;
    purchasedBooks.set(book.id, {
      ...book,
      downloadUrl: book.file_path ? `/api/book-file/${book.id}?asset=full&download=1` : null,
    });
  }
  const money = (amount: number) => "TSh " + new Intl.NumberFormat("sw-TZ").format(amount);

  return <main className="page" style={{ maxWidth: 1120 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div><p className="eyebrow"><LanguageText sw="HUDUMA ZA MTEJA" en="CUSTOMER SERVICES"/></p><h1><LanguageText sw="Jihudumie" en="Self-service"/></h1><p className="muted"><LanguageText sw={`Karibu, ${profile?.full_name || user.email}. Simamia akaunti na huduma zako hapa.`} en={`Welcome, ${profile?.full_name || user.email}. Manage your account and services here.`}/></p></div>
      <form action={signOut}><button className="btn btn-outline" type="submit"><LanguageText sw="Toka kwenye akaunti" en="Sign out"/></button></form>
    </div>

    {params.error && <p className="message" role="alert">{params.error}</p>}
    {params.saved === "profile" && <p className="notice"><LanguageText sw="Taarifa za akaunti zimehifadhiwa." en="Account details saved."/></p>}
    {params.created && <p className="notice"><LanguageText sw="Malalamiko yako yamepokelewa. Namba ya kumbukumbu: " en="Your complaint has been received. Reference number: "/><strong>{params.created}</strong></p>}
    {params.replied && <p className="notice"><LanguageText sw="Ujumbe wako umetumwa." en="Your message has been sent."/></p>}

    <section className="panel" style={{ padding: 20, marginTop: 20 }}>
      <h2 style={{ marginTop: 0 }}><LanguageText sw="Akaunti yangu" en="My account"/></h2>
      <form action={updateCustomerProfile} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        <label style={{ display: "grid", gap: 6 }}><LanguageText sw="Jina kamili" en="Full name"/>
          <input name="full_name" defaultValue={profile?.full_name ?? ""} required minLength={2} maxLength={120}/>
        </label>
        <label style={{ display: "grid", gap: 6 }}><LanguageText sw="Namba ya simu (kwa taarifa za SMS)" en="Phone number (for SMS updates)"/>
          <input name="phone" type="tel" defaultValue={profile?.phone ?? ""} placeholder="07XXXXXXXX / 2557XXXXXXXX" maxLength={24}/>
        </label>
        <label style={{ display: "grid", gap: 6 }}><LanguageText sw="Barua pepe" en="Email address"/>
          <input value={user.email ?? ""} readOnly aria-label="Account email"/>
        </label>
        <div style={{ display: "flex", alignItems: "end" }}><button className="btn" type="submit"><LanguageText sw="Hifadhi taarifa" en="Save details"/></button></div>
      </form>
      <p className="muted" style={{ marginBottom: 0 }}><LanguageText sw="Kubadilisha nenosiri, tumia sehemu ya " en="To change your password, use the "/><Link href="/dashboard/usalama"><LanguageText sw="Usalama wa akaunti" en="Account security"/></Link>.</p>
    </section>

    <section className="panel" style={{ padding: 20, marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div><h2 style={{ margin: 0 }}><LanguageText sw="Vitabu vyangu" en="My books"/></h2><p className="muted"><LanguageText sw="Vitabu ulivyonunua au ulivyofunguliwa kwa akaunti yako." en="Books you purchased or unlocked with your account."/></p></div>
        <Link className="btn btn-outline" href="/dashboard/vitabu"><LanguageText sw="Maktaba ya bure" en="Free library"/></Link>
      </div>
      {!purchasedBooks.size ? <p className="muted"><LanguageText sw="Bado hakuna kitabu cha kulipia kilichounganishwa na akaunti hii." en="No paid books are linked to this account yet."/></p> :
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {[...purchasedBooks.values()].map(book => <article key={book.id} style={{ border: "1px solid var(--border,#e5e5e5)", borderRadius: 12, padding: 14 }}>
            <strong>{book.title}</strong><p className="muted">{book.author_name || <LanguageText sw="Mwandishi" en="Author"/>} · {String(book.format).toUpperCase()}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Link className="btn" href={"/soma/" + book.id}><LanguageText sw="Soma kitabu" en="Read book"/></Link>{book.downloadUrl && <a className="btn btn-outline" href={book.downloadUrl}><LanguageText sw="Pakua" en="Download"/></a>}</div>
          </article>)}
        </div>}
    </section>

    <section className="panel" style={{ padding: 20, marginTop: 18 }}>
      <h2 style={{ marginTop: 0 }}><LanguageText sw="Historia ya malipo" en="Payment history"/></h2>
      {!orders?.length ? <p className="muted"><LanguageText sw="Bado hakuna oda au malipo yaliyorekodiwa." en="No orders or payments have been recorded yet."/></p> :
        <div className="table-wrap"><table className="table"><thead><tr><th><LanguageText sw="Tarehe" en="Date"/></th><th><LanguageText sw="Kiasi" en="Amount"/></th><th><LanguageText sw="Njia" en="Method"/></th><th><LanguageText sw="Hali" en="Status"/></th></tr></thead><tbody>
          {orders.map(order => <tr key={order.id}><td>{new Date(order.created_at).toLocaleDateString("sw-TZ")}</td><td>{money(order.total_tzs)}</td><td>{order.payment_provider || <LanguageText sw="Haijatajwa" en="Not specified"/>}</td><td>{order.status === "paid" ? <LanguageText sw="Imelipwa" en="Paid"/> : order.status === "pending" ? <LanguageText sw="Inasubiri" en="Pending"/> : order.status === "failed" ? <LanguageText sw="Imeshindikana" en="Failed"/> : order.status === "refunded" ? <LanguageText sw="Imerejeshwa" en="Refunded"/> : <LanguageText sw="Imeghairiwa" en="Cancelled"/>}</td></tr>)}
        </tbody></table></div>}
      <h3 style={{ marginTop: 22 }}><LanguageText sw="Uthibitisho wa malipo uliotuma" en="Payment proofs submitted"/></h3>
      {!submissions?.length ? <p className="muted"><LanguageText sw="Bado hujatuma uthibitisho wa malipo." en="You have not submitted any payment proof yet."/></p> :
        <div className="table-wrap"><table className="table"><thead><tr><th><LanguageText sw="Tarehe" en="Date"/></th><th><LanguageText sw="Kiasi" en="Amount"/></th><th><LanguageText sw="Njia" en="Method"/></th><th><LanguageText sw="Namba ya muamala" en="Transaction reference"/></th><th><LanguageText sw="Hali" en="Status"/></th></tr></thead><tbody>
          {submissions.map(payment => <tr key={payment.id}><td>{new Date(payment.created_at).toLocaleDateString("sw-TZ")}</td><td>{money(payment.amount_tzs)}</td><td>{payment.payment_provider}</td><td>{payment.transaction_reference}</td><td>{payment.status === "confirmed" ? <LanguageText sw="Imethibitishwa" en="Confirmed"/> : payment.status === "rejected" ? <LanguageText sw="Imekataliwa" en="Rejected"/> : <LanguageText sw="Inasubiri uthibitisho" en="Awaiting confirmation"/>}</td></tr>)}
        </tbody></table></div>}
      {(submissions ?? []).some(payment => payment.seller_note) && <p className="muted"><LanguageText sw="Maoni ya muuzaji:" en="Seller notes:"/> {(submissions ?? []).filter(payment => payment.seller_note).map(payment => payment.seller_note).join(" · ")}</p>}
    </section>

    <section className="panel" style={{ padding: 20, marginTop: 18 }}>
      <h2 style={{ marginTop: 0 }}><LanguageText sw="Tuma malalamiko au ombi la msaada" en="Send a complaint or support request"/></h2>
      <p className="muted"><LanguageText sw="Utapewa namba ya kumbukumbu utakayotumia kufuatilia ombi lako." en="You will receive a reference number to track your request."/></p>
      <form action={createCustomerTicket} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}><LanguageText sw="Aina ya tatizo" en="Issue type"/>
          <select name="category" required defaultValue="payment">
            <option value="payment">{<LanguageText sw="Tatizo la malipo" en="Payment issue"/>}</option>
            <option value="book_access"><LanguageText sw="Kitabu hakifunguki / sijakipata" en="Book will not open / not received"/></option>
            <option value="book_quality"><LanguageText sw="Kurasa au ubora wa kitabu" en="Book pages or quality"/></option>
            <option value="account"><LanguageText sw="Tatizo la akaunti" en="Account issue"/></option>
            <option value="other"><LanguageText sw="Jambo lingine" en="Other"/></option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}><LanguageText sw="Mada ya malalamiko" en="Complaint subject"/>
          <input name="subject" required minLength={3} maxLength={120} placeholder="Mfano / Example: Nimelipa lakini kitabu hakifunguki"/>
        </label>
        <label style={{ display: "grid", gap: 6 }}><LanguageText sw="Eleza tatizo lako" en="Describe your issue"/>
          <textarea name="body" required minLength={5} maxLength={5000} rows={4} placeholder="Eleza kilichotokea / Describe what happened"/>
        </label>
        <label style={{ display: "flex", alignItems: "start", gap: 10 }}>
          <input type="checkbox" name="sms_notifications_consented" style={{ width: 20, height: 20, marginTop: 2 }}/>
          <span><LanguageText sw="Nakubali kupokea SMS za taarifa za huduma kuhusu ombi hili kwenye namba yangu ya simu. SMS hizi si matangazo." en="I agree to receive service-related SMS updates about this request on my phone number. These messages are not advertisements."/></span>
        </label>
        <button className="btn" type="submit"><LanguageText sw="Tuma malalamiko" en="Submit complaint"/></button>
      </form>
    </section>

    <section className="panel" style={{ padding: 20, marginTop: 18 }}>
      <h2 style={{ marginTop: 0 }}><LanguageText sw="Malalamiko yangu na majibu" en="My complaints and replies"/></h2>
      {!tickets?.length ? <p className="muted"><LanguageText sw="Bado hujatuma malalamiko yoyote." en="You have not submitted any complaints yet."/></p> :
        <div style={{ display: "grid", gap: 16 }}>
          {tickets.map(ticket => <article key={ticket.id} style={{ border: "1px solid var(--border,#e5e5e5)", borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><strong>{ticket.subject}</strong><p className="muted" style={{ margin: "5px 0" }}>{ticket.reference_code} · <LanguageText sw={categoryLabels[ticket.category]?.sw || ticket.category} en={categoryLabels[ticket.category]?.en || ticket.category}/></p></div>
              <span className="status"><LanguageText sw={statusLabels[ticket.status]?.sw || ticket.status} en={statusLabels[ticket.status]?.en || ticket.status}/></span>
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {(messagesByTicket.get(ticket.id) ?? []).map(message => <div key={message.id} style={{ padding: 11, borderRadius: 10, background: message.sender_id === user.id ? "var(--surface,#f0eadf)" : "var(--panel,#f7f7f7)", overflowWrap: "anywhere" }}>
                <strong style={{ fontSize: 12 }}>{message.sender_id === user.id ? <LanguageText sw="Wewe" en="You"/> : "MaarifaBooks Support"}</strong>
                <p style={{ whiteSpace: "pre-wrap", margin: "5px 0" }}>{message.body}</p>
                <small className="muted">{new Date(message.created_at).toLocaleString("sw-TZ")}</small>
              </div>)}
            </div>
            {ticket.status !== "resolved" && <form action={replyToCustomerTicket} style={{ display: "grid", gap: 8, marginTop: 12 }}>
              <input type="hidden" name="ticket_id" value={ticket.id}/>
              <label style={{ display: "grid", gap: 6 }}><LanguageText sw="Jibu au ongeza maelezo" en="Reply or add details"/>
                <textarea name="body" rows={2} required maxLength={5000} placeholder="Andika ujumbe wako / Write your message..."/>
              </label>
              <button className="btn btn-outline" type="submit"><LanguageText sw="Tuma ujumbe" en="Send message"/></button>
            </form>}
          </article>)}
        </div>}
    </section>
  </main>;
}
