import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mrztjgqgkvlhdyrcpjif.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yenRqZ3Fna3ZsaGR5cmNwamlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNzM0NzEsImV4cCI6MjA1OTc0OTQ3MX0.0dPqrHT8x6gF0adfvVm8G5miHNG1mJ1Bjy0E3BJEO70";

export  const supabase = createClient(supabaseUrl, supabaseAnonKey);


