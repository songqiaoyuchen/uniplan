// src/services/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_DEFAULT_KEY");
}

export const supabaseServer = createClient(url, serviceKey);
