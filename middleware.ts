import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isValidEmail(email: string): boolean {
  // Basic regex for email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  const [localPart] = email.split('@');

  // Prevent local part from starting or ending with a hyphen or dot
  if (localPart.startsWith('-') || localPart.endsWith('-') || localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  return true;
}

// Helper function to fetch admin data with retry logic
async function fetchAdminDataWithRetry(supabase: any, userId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Admin data fetch attempt ${attempt}/${maxRetries} for user ${userId}`)

      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (!adminError) {
        console.log(`Admin data fetch successful on attempt ${attempt}`)
        return { data: adminData, error: null }
      }

      // If user not found, don't retry
      if (adminError.code === 'PGRST116') {
        console.log('User not found in profiles table')
        return { data: null, error: adminError }
      }

      // For other errors, retry if attempts remain
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
        console.log(`Admin data fetch failed (attempt ${attempt}), retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      console.log(`Admin data fetch failed after ${maxRetries} attempts`)
      return { data: null, error: adminError }

    } catch (error) {
      console.error(`Admin data fetch error on attempt ${attempt}:`, error)

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000
        console.log(`Retrying admin data fetch in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      return { data: null, error }
    }
  }

  return { data: null, error: new Error('Max retries exceeded') }
}

export async function middleware(req: NextRequest) {
  console.log("Middleware triggered for path:", req.nextUrl.pathname)
  
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          console.log("Getting cookie:", name)
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          console.log("Setting cookie:", name, value)
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          console.log("Removing cookie:", name)
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  console.log("Session status:", user ? "Authenticated" : "Not authenticated")
  if (user) {
    console.log("Session user ID:", user.id)
    console.log("Session user email:", user.email)
  }

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    console.log("Protecting admin route")
    if (!user) {
      console.log("No session, redirecting to login")
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
    
    // Check if user has admin role with retry logic
    const { data: adminData, error: adminError } = await fetchAdminDataWithRetry(supabase, user.id)

    console.log("Admin data:", adminData, "Error:", adminError)

    // If there's an error fetching admin data after retries, redirect to login
    if (adminError) {
      console.log("Admin data fetch error after retries, redirecting to login")
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
    
    if (adminData?.role !== 'admin' && adminData?.role !== 'superadmin') {
      console.log("Unauthorized role, redirecting to unauthorized")
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/unauthorized'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Protect superadmin routes
  if (req.nextUrl.pathname.startsWith('/superadmin')) {
    console.log("Protecting superadmin route")
    if (!user) {
      console.log("No session, redirecting to login")
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
    
    // Add email validation for superadmin routes
    if (!isValidEmail(user.email)) {
      console.log("Invalid superadmin email format, redirecting to unauthorized")
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/unauthorized' // Redirect to unauthorized page for invalid email format
      return NextResponse.redirect(redirectUrl)
    }
    
    console.log("Checking superadmin permissions...")
    // For superadmin, check if email is superadmin@stica.edu (simple check)
    if (user.email === 'superadmin@stica.edu') {
      console.log("Superadmin email verified, granting access")
      console.log("Allowing access to route")
      return res
    }
    
    // Otherwise check the profiles table with retry logic
    const { data: adminData, error: adminError } = await fetchAdminDataWithRetry(supabase, user.id)

    console.log("Superadmin data:", adminData, "Error:", adminError)

    // If there's an error fetching admin data after retries, redirect to login
    if (adminError) {
      console.log("Admin data fetch error after retries, redirecting to login")
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
    
    // Only superadmins can access superadmin routes
    if (adminData?.role !== 'superadmin') {
      console.log("Not superadmin, redirecting to unauthorized")
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/unauthorized'
      return NextResponse.redirect(redirectUrl)
    }
    
    console.log("Superadmin access granted")
  }

  console.log("Allowing access to route")
  return res
}

export const config = {
  matcher: [
    // Match admin and superadmin routes, but exclude API routes
    '/admin/:path*',
    '/superadmin/:path*',
  ],
}