import { sendSupportMessage } from "@/app/mawasiliano/actions";
import { useLanguage } from "@/components/language-provider";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function SupportChat({
  sellerId,
  currentUserId,
  messages,
  adminMode = false,
}: {
  sellerId: string;
  currentUserId: string;
  messages: Message[];
  adminMode?: boolean;
}) {
  return <section className="panel" style={{ padding: 18, marginTop: 18 }}>
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0 }}>{en ? "Conversation" : "Mazungumzo"}</h2>
        <p className="muted">{en ? "These messages are visible only to Admin and the relevant seller." : "Ujumbe huu unaonekana kwa Admin na muuzaji husika pekee."}</p>
      </div>
      <div aria-live="polite" style={{ display: "grid", gap: 10, maxHeight: 440, overflowY: "auto" }}>
        {messages.length === 0 && <p className="muted">{en ? "No messages yet. Write a message to start the conversation." : "Bado hakuna ujumbe. Andika ujumbe kuanza mazungumzo."}</p>}
        {messages.map(message => {
          const mine = message.sender_id === currentUserId;
          return <article key={message.id} style={{
            justifySelf: mine ? "end" : "start",
            maxWidth: "min(88%, 560px)",
            padding: "11px 14px",
            borderRadius: 14,
            background: mine ? "var(--surface, #f0eadf)" : "var(--panel, #f7f7f7)",
            border: "1px solid var(--border, #e5e5e5)",
            overflowWrap: "anywhere"
          }}>
            <strong style={{ fontSize: 12 }}>{mine ? (en ? "You" : "Wewe") : adminMode ? (en ? "Seller" : "Muuzaji") : "Admin"}</strong>
            <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>{message.body}</p>
            <small className="muted">{new Date(message.created_at).toLocaleString("sw-TZ")}</small>
          </article>;
        })}
      </div>
      <form action={sendSupportMessage} style={{ display: "grid", gap: 10 }}>
        <input type="hidden" name="seller_id" value={sellerId}/>
        <label htmlFor="support-body">{en ? "Write a message" : "Andika ujumbe"}</label>
        <textarea id="support-body" name="body" required maxLength={5000} rows={4}
          placeholder={en ? "Write your question, request or issue details..." : "Andika swali, ombi au maelezo ya tatizo..."} />
        <button className="btn" type="submit">{en ? "Send message" : "Tuma ujumbe"}</button>
      </form>
    </div>
  </section>;
}
