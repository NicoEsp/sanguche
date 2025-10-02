import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lgscevufwnetegglgpnw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc2NldnVmd25ldGVnZ2xncG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjI5NzQsImV4cCI6MjA3NDA5ODk3NH0.LXqu7Vdp-IVvD6E-K3PIeaCgHKV-OJ69ugNhnd2zH5I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
