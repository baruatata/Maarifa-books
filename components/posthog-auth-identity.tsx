"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

export function PostHogAuthIdentity() {
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        posthog.identify(session.user.id);
        if (event === "SIGNED_IN") posthog.capture("user_logged_in", { method: "supabase_auth" });
      } else if (event === "SIGNED_OUT") {
        posthog.reset();
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) posthog.identify(data.session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
