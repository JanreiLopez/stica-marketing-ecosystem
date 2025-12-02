import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// POST /api/admin - Create a new admin user
export async function POST(request: Request) {
  try {
    const { email, permissions = ['read', 'write'] } = await request.json()
    
    // Validate email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    
    // Create user in Supabase Auth (requires service role key in production)
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })
    
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }
    
    if (data.user) {
      // Store role and permissions in database
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            name: email.split('@')[0],
            email: email,
            role: 'admin',
            permissions: JSON.stringify(permissions),
          }
        ])
      
      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to store user role in database' },
          { status: 400 }
        )
      }
      
      // Return success with temporary password
      return NextResponse.json({
        success: true,
        message: 'Admin successfully created',
        tempPassword
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}