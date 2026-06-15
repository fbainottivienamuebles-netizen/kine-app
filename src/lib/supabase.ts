import { createClient } from "@supabase/supabase-js";

function env(key: string) {
  return (process.env[key] ?? "").replace(/^﻿/, "").trim();
}

export function createServiceClient() {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_KEY"), {
    auth: { persistSession: false },
  });
}
