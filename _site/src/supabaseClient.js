import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPA_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPA_PUBLISHABLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 