import posthog from "posthog-js";

// Next.js 15.3+ client instrumentation entry point.
// Keep analytics disabled in environments where no project token is configured.
const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (projectToken) {
  posthog.init(projectToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-08-30",
  });
}
