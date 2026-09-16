import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local."
  );
}

// Single shared client. The pilot has no authentication, so the read-only anon
// key is safe to use from both Server and Client Components. Never instantiate
// createClient() anywhere else in the app.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
