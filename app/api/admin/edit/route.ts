import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(request: Request) {
  console.log('Admin API PUT route (edit) called');

  try {
    const { id, firstName, lastName, permissions, password } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // Update password if provided
    if (password) {
      console.log('Updating password for user:', id);
      const { error: passwordError } = await supabase.auth.admin.updateUserById(id, {
        password: password,
      });

      if (passwordError) {
        console.error('Password update error:', passwordError);
        return NextResponse.json(
          { error: `Failed to update password: ${passwordError.message}` },
          { status: 400 }
        );
      }
      console.log('Password updated successfully');
    }

    // Update profile information in the database
    const profileData: { first_name?: string; last_name?: string; permissions?: string } = {};
    if (firstName !== undefined) profileData.first_name = firstName;
    if (lastName !== undefined) profileData.last_name = lastName;
    if (permissions !== undefined) profileData.permissions = JSON.stringify(permissions);

    console.log('Profile data to update:', profileData);

    const { error: updateError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: `Failed to update admin profile: ${updateError.message}` },
        { status: 400 }
      );
    }

    let message = 'Admin account updated successfully.';
    if (password) {
      message += ` New password: ${password}`;
    }

    return NextResponse.json({ 
      success: true, 
      message,
      tempPassword: password || undefined
    });
  } catch (error) {
    console.error('Unexpected error in admin update:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

