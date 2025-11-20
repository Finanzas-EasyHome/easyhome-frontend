import { createClient } from '@supabase/supabase-js'

// Variables de entorno llamadas desde .env.development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY


export const supabase = createClient(supabaseUrl, supabaseKey)
