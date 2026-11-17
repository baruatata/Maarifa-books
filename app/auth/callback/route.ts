import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safePath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/dashboard";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safePath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  const errorUrl = new URL("/ingia", url.origin);
  errorUrl.searchParams.set(
    "error",
    "Kiungo cha uthibitisho kimeisha muda au si sahihi. Tafadhali jaribu kujisajili tena au omba kiungo kipya."
  );
  return NextResponse.redirect(errorUrl);
}
