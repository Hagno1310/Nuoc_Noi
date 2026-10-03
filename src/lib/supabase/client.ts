import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RpcClient } from "@/lib/api";

let client: SupabaseClient | undefined;

export function getBrowserSupabase(): SupabaseClient {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}

export function getRpcClient(): RpcClient {
  return getBrowserSupabase() as unknown as RpcClient;
}
