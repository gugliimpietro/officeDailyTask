import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://fotwxdjbjpxsllfudkip.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvdHd4ZGpianB4c2xsZnVka2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzA4MzEsImV4cCI6MjA4MjA0NjgzMX0.2zOvNV6-fm3z4jeM_tSyob4EbRp9Uj3CwWU0jB8wnys";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
