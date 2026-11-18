import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCustomerTicket } from "./actions";

const categoryLabels: Record<string, string> = {
  payment: "Tatizo la malipo",
  book_access: "Kitabu hakifunguki / sijakipata",
  book_quality: "Kurasa au ubora wa kitabu",
  account: "Tatizo la akaunti",
  other: "Jambo lingine",
};
const statusLabels: Record<string, string> = {
  received: "Limepokelewa",
  in_progress: "Linafanyiwa kazi",
  resolved: "Limetatuliwa",
};

export default async function AdminCustomerTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingia");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  const { data: tickets, error } = await supabase.from("support_tickets")
    .select("id,user_id,reference_code,category,subject,status,sms_notifications_consented,created_at,updated_at")
    .order("created_at", { ascending: false });
  const userIds = [...new Set((tickets ?? []).map(ticket => ticket.user_id))];
  const [{ data: profiles }, { data: messages }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id,full_name,email,phone").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null; phone: string | null }[] }),
    (tickets ?? []).length
      ? supabase.from("support_ticket_messages").select("id,ticket_id,sender_id,body,created_at")
          .in("ticket_id", (tickets ?? []).map(ticket => ticket.id)).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; ticket_id: string; sender_id: string; body: string; created_at: string }[] }),
  ]);
  const profileMap = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  const messagesByTicket = new Map<string, typeof messages>();
  for (const message of messages ?? []) {
    const current = messagesByTicket.get(message.ticket_id) ?? [];
    current.push(message);
    messagesByTicket.set(message.ticket_id, current);
  }

  return <main className="page" style={{ maxWidth: 1120 }}>
    <Link href="/admin" className="muted">← Rudi kwenye Admin</Link>
    <p className="eyebrow">HUDUMA KWA WATEJA</p>
    <h1>Malalamiko ya wateja</h1>
    <p className="muted">Pitia maombi, jibu wateja na sasisha hali ya kila ombi. Namba za kumbukumbu ni za kipekee.</p>
    {params.error && <p className="message" role="alert">{params.error}</p>}
    {params.saved && <p className="notice">Mabadiliko yamehifadhiwa.</p>}
    {error && <p className="message">Imeshindikana kupakia malalamiko.</p>}
    {!tickets?.length && !error && <section className="panel" style={{ padding: 20 }}>Bado hakuna malalamiko kutoka kwa wateja.</section>}
    <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
      {(tickets ?? []).map(ticket => {
        const customer = profileMap.get(ticket.user_id);
        return <section className="panel" key={ticket.id} style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div><p className="eyebrow" style={{ marginBottom: 5 }}>{ticket.reference_code}</p>
              <h2 style={{ margin: 0 }}>{ticket.subject}</h2>
              <p className="muted">{categoryLabels[ticket.category] || ticket.category} · {new Date(ticket.created_at).toLocaleString("sw-TZ")}</p>
              <p style={{ marginBottom: 0 }}><strong>{customer?.full_name || "Mteja"}</strong> · {customer?.email || "Email haipo"} · {customer?.phone || "Simu haijawekwa"}</p>
            </div>
            <span className="status">{statusLabels[ticket.status] || ticket.status}</span>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>Ruhusa ya SMS: {ticket.sms_notifications_consented ? "Mteja amekubali taarifa za SMS" : "Hakuna ruhusa ya SMS"}</p>
          <div style={{ display: "grid", gap: 10, margin: "14px 0" }}>
            {(messagesByTicket.get(ticket.id) ?? []).map(message => <div key={message.id} style={{ padding: 11, borderRadius: 10, background: message.sender_id === ticket.user_id ? "var(--surface,#f0eadf)" : "var(--panel,#f7f7f7)", overflowWrap: "anywhere" }}>
              <strong style={{ fontSize: 12 }}>{message.sender_id === ticket.user_id ? "Mteja" : "Admin / Timu"}</strong>
              <p style={{ whiteSpace: "pre-wrap", margin: "5px 0" }}>{message.body}</p>
              <small className="muted">{new Date(message.created_at).toLocaleString("sw-TZ")}</small>
            </div>)}
          </div>
          <form action={updateCustomerTicket} style={{ display: "grid", gap: 10, borderTop: "1px solid var(--border,#e5e5e5)", paddingTop: 14 }}>
            <input type="hidden" name="ticket_id" value={ticket.id}/>
            <label style={{ display: "grid", gap: 6 }}>Hali ya ombi
              <select name="status" defaultValue={ticket.status}>
                <option value="received">Limepokelewa</option>
                <option value="in_progress">Linafanyiwa kazi</option>
                <option value="resolved">Limetatuliwa</option>
              </select>
            </label>
            {ticket.status !== "resolved" && <label style={{ display: "grid", gap: 6 }}>Jibu kwa mteja
              <textarea name="body" rows={3} maxLength={5000} placeholder="Andika jibu au maelekezo kwa mteja..."/>
            </label>}
            <button className="btn" type="submit">Hifadhi hali / Tuma jibu</button>
          </form>
        </section>;
      })}
    </div>
  </main>;
}
