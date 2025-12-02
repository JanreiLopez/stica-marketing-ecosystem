"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  )
} else {
  // eslint-disable-next-line no-console
  console.log("Supabase URL loaded:", supabaseUrl.substring(0, 30) + "...")
  // eslint-disable-next-line no-console
  console.log("Supabase Key loaded:", supabaseAnonKey.substring(0, 20) + "..." + supabaseAnonKey.substring(supabaseAnonKey.length - 10))
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "")

