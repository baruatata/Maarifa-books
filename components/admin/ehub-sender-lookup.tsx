"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LookupResult = {
  found?: boolean;
  sender?: { id?: string; sender_name?: string; status?: string; type?: string } | null;
  message?: string;
};

export default function EhubSenderLookup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Tafadhali ingia tena kwenye akaunti ya admin.");

      const { data, error: functionError } = await supabase.functions.invoke("ehub-sender-lookup", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {},
      });
      if (functionError) throw new Error(functionError.message || "Imeshindikana kuwasiliana na huduma ya eHUB.");
      const payload = data as LookupResult;
      if (!payload?.found || !payload.sender?.id) {
        setResult(payload ?? { found: false, message: "Sender ID Youflix haijapatikana." });
      } else {
        setResult(payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hitilafu isiyotarajiwa imetokea.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="ehub-sender-lookup">
    <button type="button" className="btn" onClick={lookup} disabled={loading}>
      {loading ? "Inatafuta..." : "Tafuta UUID ya Youflix"}
    </button>
    {error && <p className="message" role="alert">{error}</p>}
    {result && (result.found && result.sender?.id ? <div className="ehub-sender-result" role="status">
      <strong>{result.sender.sender_name || "Youflix"} · {result.sender.status || "Hali haijulikani"}</strong>
      <code>{result.sender.id}</code>
      <button type="button" className="btn btn-outline" onClick={() => navigator.clipboard?.writeText(result.sender?.id || "")}>Nakili UUID</button>
    </div> : <p className="muted" role="status">{result.message || "Sender ID Youflix haijapatikana kwenye orodha ya eHUB."}</p>)}
  </div>;
}
