import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabasePublishableKey) throw new Error("Supabase haijaunganishwa. Weka EXPO_PUBLIC_SUPABASE_URL na EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY kwenye mobile/.env.");
  if (!client) client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}), autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
  });
  return client;
}

if (Platform.OS !== "web") AppState.addEventListener("change", (state) => {
  if (!client) return;
  if (state === "active") client.auth.startAutoRefresh();
  else client.auth.stopAutoRefresh();
});