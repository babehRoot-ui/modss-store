import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase = null;
let supabaseAdmin = null;

if (supabaseUrl && anonKey) {
  supabase = createClient(supabaseUrl, anonKey);
}

if (supabaseUrl && serviceKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceKey);
}

export { supabase, supabaseAdmin };
