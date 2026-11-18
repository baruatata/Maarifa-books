import { createHmac } from "node:crypto";

function normalizeTanzanianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("255")) return digits;
  if (digits.startsWith("0")) return "255" + digits.slice(1);
  return digits;
}

export async function sendEhubSms(phone: string | null | undefined, message: string) {
  const apiKey = process.env.EHUB_API_KEY;
  const apiSecret = process.env.EHUB_API_SECRET;
  const senderId = process.env.EHUB_SENDER_ID; // eHub expects the approved sender UUID, not its display name.

  if (!apiKey || !apiSecret || !senderId || !phone) {
    return { sent: false, reason: "not_configured" as const };
  }

  const to = normalizeTanzanianPhone(phone);
  if (!/^255\d{9}$/.test(to)) {
    return { sent: false, reason: "invalid_phone" as const };
  }

  const path = "/api/v1/sms/send";
  const body = JSON.stringify({ to, message: message.slice(0, 300), sender_id: senderId });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = [timestamp, "POST", path, body].join("\n");
  const signature = createHmac("sha256", apiSecret).update(payload).digest("hex");

  try {
    const response = await fetch("https://sms.ehub.co.tz" + path, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "X-Timestamp": timestamp,
        "X-Signature": signature,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    return { sent: response.ok && result?.success === true, reason: response.ok ? "provider_response" as const : "provider_error" as const };
  } catch {
    return { sent: false, reason: "network_error" as const };
  }
}
