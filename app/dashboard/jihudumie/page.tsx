import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { createCustomerTicket, replyToCustomerTicket, updateCustomerProfile } from "./actions";

const categoryLabels: Record<string, string> = {
  payment: "Tatizo la malipo",
  book_access: "Kitabu hakifunguki / sijakipata",
  book_quality: "Kurasa au ubora wa kitabu",
  account: "Akaunti yangu",
  other: "Jambo lingine",
};
const statusLabels: Record<string, string> = {
  received: "Limepokelewa",
  in_progress: "Linafanyiwa kazi",
  resolved: "Limetatuliwa",
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
    const { data: signed } = book.file_path
      ? await supabase.storage.from("book-files").createSignedUrl(book.file_path, 600, { download: true })
      : { data: null };
    purchasedBooks.set(book.id, { ...book, downloadUrl: signed?.signedUrl ?? null });
  }
  const money = (amount: number) => "TSh " + new Intl.NumberFormat("sw-TZ").format(amount);

  return <main className="page" style={{ maxWidth: 1120 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div><p className="eyebrow">HUDUMA ZA MTEJA</p><h1>Jihudumie</h1><p className="muted">Karibu, {profile?.full_name || user.email}. Simamia akaunti na huduma zako hapa.</p></div>
      <form action={signOut}><button className="btn btn-outline" type="submit">Toka kwenye akaunti</button></form>
    </div>

    {params.error && <p className="message" role="alert">{params.error}</p>}
    {params.saved === "profile" && <p className="notice">Taarifa za akaunti zimehifadhiwa.</p>}
    {params.created && <p className="notice">Malalamiko yako yamepokelewa. Namba ya kumbukumbu: <strong>{params.created}</strong></p>}
    {params.replied && <p className="notice">Ujumbe wako umetumwa.</p>}

    <section className="panel" style={{ padding: 20, marginTop: 20 }}>
      <h2 style={{ marginTop: 0 }}>Akaunti yangu</h2>
      <form action={updateCustomerProfile} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>Jina kamili
          <input name="full_name" defaultValue={profile?.full_name ?? ""} required minLength={2} maxLength={120}/>
        </label>
        <label style={{ display: "grid", gap: 6 }}>Namba ya simu (kwa taarifa za SMS)
          <input name="phone" type="tel" defaultValue={profile?.phone ?? ""} placeholder="07XXXXXXXX au 2557XXXXXXXX" maxLength={24}/>
        </label>
        <label style={{ display: "grid", gap: 6 }}>Barua pepe
          <input value={user.email ?? ""} readOnly aria-label="Barua pepe ya akaunti"/>
        </label>
        <div style={{ display: "flex", alignItems: "end" }}><button className="btn" type="submit">Hifadhi taarifa</button></div>
      </form>
      <p className="muted" style={{ marginBottom: 0 }}>Kubadilisha nenosiri, tumia sehemu ya <Link href="/dashboard/usalama">Usalama wa akaunti</Link>.</p>
    </section>

    <section className="panel" style={{ padding: 20, marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div><h2 style={{ margin: 0 }}>Vitabu vyangu</h2><p className="muted">Vitabu ulivyonunua au ulivyofunguliwa kwa akaunti yako.</p></div>
        <Link className="btn btn-outline" href="/dashboard/vitabu">Maktaba ya bure</Link>
      </div>
      {!purchasedBooks.size ? <p className="muted">Bado hakuna kitabu cha kulipia kilichounganishwa na akaunti hii.</p> :
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {[...purchasedBooks.values()].map(book => <article key={book.id} style={{ border: "1px solid var(--border,#e5e5e5)", borderRadius: 12, padding: 14 }}>
            <strong>{book.title}</strong><p className="muted">{book.author_name || "Mwandishi"} · {String(book.format).toUpperCase()}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Link className="btn" href={"/soma/" + book.id}>Soma kitabu</Link>{book.downloadUrl && <a className="btn btn-outline" href={book.downloadUrl}>Pakua</a>}</div>
          </article>)}
        </div>}
    </section>

    <section className="panel" style={{ padding: 20, marginTop: 18 }}>
      <h2 style={{ marginTop: 0 }}>Historia ya malipo</h2>
      {!orders?.length ? <p className="muted">Bado hakuna oda au malipo yaliyorekodiwa.</p> :
        <div className="table-wrap"><table className="table"><thead><tr><th>Tarehe</th><th>Kiasi</th><th>Njia</th><th>Hali</th></tr></thead><tbody>
          {orders.map(order => <tr key={order.id}><td>{new Date(order.created_at).toLocaleDateString("sw-TZ")}</td><td>{money(order.total_tzs)}</td><td>{order.payment_provider || "Haijatajwa"}</td><td>{order.status === "paid" ? "Imelipwa" : order.status === "pending" ? "Inasubiri" : order.status === "failed" ? "Imeshindikana" : order.status === "refunded" ? "Imerejeshwa" : "Imeghairiwa"}</td></tr>)}
        </tbody></table></div>}
      <h3 style={{ marginTop: 22 }}>Uthibitisho wa malipo uliotuma</h3>
      {!submissions?.length ? <p className="muted">Bado hujatuma uthibitisho wa malipo.</p> :
        <div className="table-wrap"><table className="table"><thead><tr><th>Tarehe</th><th>Kiasi</th><th>Njia</th><th>Namba ya muamala</th><th>Hali</th></tr></thead><tbody>
          {submissions.map(payment => <tr key={payment.id}><td>{new Date(payment.created_at).toLocaleDateString("sw-TZ")}</td><td>{money(payment.amount_tzs)}</td><td>{payment.payment_provider}</td><td>{payment.transaction_reference}</td><td>{payment.status === "confirmed" ? "Imethibitishwa" : payment.status === "rejected" ? "Imekataliwa" : "Inasubiri uthibitisho"}</td></tr>)}
        </tbody></table></div>}
      {(submissions ?? []).some(payment => payment.seller_note) && <p className="muted">Maoni ya muuzaji: {(submissions ?? []).filter(payment => payment.seller_note).map(payment => payment.seller_note).join(" · ")}</p>}
    </section>

    <section className="panel" style={{ padding: 20, marginTop: 18 }}>
      <h2 style={{ marginTop: 0 }}>Tuma malalamiko au ombi la msaada</h2>
      <p className="muted">Utapewa namba ya kumbukumbu utakayotumia kufuatilia ombi lako.</p>
      <form action={createCustomerTicket} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>Aina ya tatizo
          <select name="category" required defaultValue="payment">
            <option value="payment">Tatizo la malipo</option>
            <option value="book_access">Kitabu hakifunguki / sijakipata</option>
            <option value="book_quality">Kurasa au ubora wa kitabu</option>
            <option value="account">Tatizo la akaunti</option>
            <option value="other">Jambo lingine</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>Mada ya malalamiko
          <input name="subject" required minLength={3} maxLength={120} placeholder="Mfano: Nimelipa lakini kitabu hakifunguki"/>
        </label>
        <label style={{ display: "grid", gap: 6 }}>Eleza tatizo lako
          <textarea name="body" required minLength={5} maxLength={5000} rows={4} placeholder="Eleza kilichotokea na tarehe ya tukio kama inahusika."/>
        </label>
        <label style={{ display: "flex", alignItems: "start", gap: 10 }}>
          <input type="checkbox" name="sms_notifications_consented" style={{ width: 20, height: 20, marginTop: 2 }}/>
          <span>Nakubali kupokea SMS za taarifa za huduma kuhusu ombi hili kwenye namba yangu ya simu. SMS hizi si matangazo.</span>
        </label>
        <button className="btn" type="submit">Tuma malalamiko</button>
      </form>
    </section>

    <section className="panel" style={{ padding: 20, marginTop: 18 }}>
      <h2 style={{ marginTop: 0 }}>Malalamiko yangu na majibu</h2>
      {!tickets?.length ? <p className="muted">Bado hujatuma malalamiko yoyote.</p> :
        <div style={{ display: "grid", gap: 16 }}>
          {tickets.map(ticket => <article key={ticket.id} style={{ border: "1px solid var(--border,#e5e5e5)", borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><strong>{ticket.subject}</strong><p className="muted" style={{ margin: "5px 0" }}>{ticket.reference_code} · {categoryLabels[ticket.category] || ticket.category}</p></div>
              <span className="status">{statusLabels[ticket.status] || ticket.status}</span>
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {(messagesByTicket.get(ticket.id) ?? []).map(message => <div key={message.id} style={{ padding: 11, borderRadius: 10, background: message.sender_id === user.id ? "var(--surface,#f0eadf)" : "var(--panel,#f7f7f7)", overflowWrap: "anywhere" }}>
                <strong style={{ fontSize: 12 }}>{message.sender_id === user.id ? "Wewe" : "Timu ya MaarifaBooks"}</strong>
                <p style={{ whiteSpace: "pre-wrap", margin: "5px 0" }}>{message.body}</p>
                <small className="muted">{new Date(message.created_at).toLocaleString("sw-TZ")}</small>
              </div>)}
            </div>
            {ticket.status !== "resolved" && <form action={replyToCustomerTicket} style={{ display: "grid", gap: 8, marginTop: 12 }}>
              <input type="hidden" name="ticket_id" value={ticket.id}/>
              <label style={{ display: "grid", gap: 6 }}>Jibu au ongeza maelezo
                <textarea name="body" rows={2} required maxLength={5000} placeholder="Andika ujumbe wako..."/>
              </label>
              <button className="btn btn-outline" type="submit">Tuma ujumbe</button>
            </form>}
          </article>)}
        </div>}
    </section>
  </main>;
}
