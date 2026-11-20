import { PostHog } from "posthog-node";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: EventProperties = {},
) {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!token || !host || !distinctId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST are required; analytics events will be missed.");
    }
    return;
  }

  const client = new PostHog(token, { host, flushAt: 1, flushInterval: 0 });
  try {
    client.capture({ distinctId, event, properties });
    await client.shutdown();
  } catch (error) {
    console.warn("PostHog event capture failed:", error instanceof Error ? error.message : "Unknown error");
    try { await client.shutdown(); } catch { /* Analytics must never interrupt app actions. */ }
  }
}
