import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqzrluugifzgzdmjdifs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxenJsdXVnaWZ6Z3pkbWpkaWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODYzNTUsImV4cCI6MjA5MTQ2MjM1NX0._TsEZwyzljHLE5awZTKPHix7akvl-vZXiHXY5fcoBDY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-client-info': 'academy-app' }
  }
})