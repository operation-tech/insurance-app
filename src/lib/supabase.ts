import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ycfccvrkbwvyzdkojeag.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZmNjdnJrYnd2eXpka29qZWFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0Nzk2NTcsImV4cCI6MjA2ODA1NTY1N30.eY8Qc7pl2PuUcn7pHV82MS0hWc0rWdvgLnfGPUkyPSc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
