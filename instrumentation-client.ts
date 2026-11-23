import posthog from "posthog-js";

// Initialize once in the browser. Keep analytics disabled when project settings
// are not configured for the current Vercel environment.
const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const sessionReplayEnabled =
  process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY === "true";

if (projectToken && posthogHost) {
  posthog.init(projectToken, {
    api_host: posthogHost,
    defaults: "2026-08-30",
    // Only Production should record sessions. Preview deployments can still
    // send pageview analytics without creating Preview session recordings.
    disable_session_recording: !sessionReplayEnabled,
    // Protect customer-entered details such as phone numbers and payment data.
    session_recording: {
      maskAllInputs: true,
    },
  });
}
