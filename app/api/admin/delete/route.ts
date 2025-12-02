import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// DELETE /api/admin/delete - Delete an admin user completely
export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()
    
    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // First delete the profile from the profiles table
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (deleteProfileError) {
      return NextResponse.json(
        { error: `Failed to delete profile: ${deleteProfileError.message}` },
        { status: 400 }
      )
    }
    
    // Then delete the user from Supabase Auth (requires service role key)
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)
    
    if (deleteUserError) {
      return NextResponse.json(
        { error: `Failed to delete user from auth: ${deleteUserError.message}` },
        { status: 400 }
      )
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Admin successfully deleted'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}