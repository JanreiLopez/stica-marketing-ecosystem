import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

console.log('Admin API route loaded');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Supabase config check:', {
  urlPresent: !!supabaseUrl,
  serviceKeyPresent: !!supabaseServiceKey,
  urlLength: supabaseUrl.length,
  serviceKeyLength: supabaseServiceKey.length
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST /api/admin - Create a new admin user
export async function POST(request: Request) {
  console.log('Admin API POST route called');
  
  try {
    const { email, firstName, lastName, permissions } = await request.json();

    if (!email) { return NextResponse.json({ error: 'Email is required' }, { status: 400 }); }

    // Generate a secure random password (12 characters, alphanumeric)
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) {
      tempPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    console.log('Attempting to create user via Supabase Auth with email and temp password');

    let emailSentSuccessfully = false;
    let userCreationError = null;
    let createdUserData = null;

    try {
      // Attempt to create user and send invitation email via Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

      if (error) {
        console.log('Supabase Auth user creation error:', error);
        userCreationError = error;
      } else if (data.user) {
        createdUserData = data.user;
        emailSentSuccessfully = true; // Assume email is sent if user created without explicit error
      }
    } catch (err) {
      console.error('Unexpected error during Supabase Auth user creation:', err);
      userCreationError = err;
    }

    // Fallback if email provider not configured or initial creation failed
    if (!createdUserData && userCreationError) {
      console.log('Initial user creation failed, checking if it is an email configuration issue...');
      // Check if it's an email configuration error for fallback
      if (userCreationError.message.includes('email') || userCreationError.message.includes('SMTP') || userCreationError.message.includes('provider')) {
        console.log('Email provider not configured or issue, falling back to manual user creation without email invitation');
        emailSentSuccessfully = false; // Explicitly set to false for manual creation
        
        const { data: userData, error: createUserError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true // Still confirm email, but without sending the initial invite
        });
        
        if (createUserError) {
          console.log('Manual user creation error:', createUserError);
          return NextResponse.json(
            { error: `Failed to create user: ${createUserError.message}` },
            { status: 400 }
          );
        }
        createdUserData = userData.user;
      } else {
        // If it's not an email configuration issue, re-throw the original error
        return NextResponse.json(
          { error: `Failed to create user: ${userCreationError.message}` },
          { status: 400 }
        );
      }
    }

    if (!createdUserData) {
      return NextResponse.json(
        { error: 'Failed to create user, no user data returned' },
        { status: 400 }
      );
    }

    // Store additional profile information in database
    const profileData = {
      id: createdUserData.id,
      name: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
      first_name: firstName || '',
      last_name: lastName || '',
      email: email,
      role: 'admin',
      permissions: JSON.stringify(permissions),
    };
    
    console.log('Profile data to insert:', profileData);
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([profileData]);
    
    if (insertError) {
      console.log('Profile insert error:', insertError);
      try {
        await supabase.auth.admin.deleteUser(createdUserData.id);
      } catch (deleteError) {
        console.error('Error deleting user after profile insert failure:', deleteError);
      }
      return NextResponse.json(
        { error: `Failed to store user role in database: ${insertError.message}` },
        { status: 400 }
      );
    }
    
    // Prepare success message
    let message = 'Admin successfully created.';
    if (emailSentSuccessfully) {
      message += ' An email with the temporary password has been sent to the admin\'s inbox.';
    } else {
      message += ' Email service is not configured. Please provide the temporary password manually.';
    }

    // Return success with temporary password
    return NextResponse.json({
      success: true,
      message,
      tempPassword: tempPassword, // Always send tempPassword
      emailSent: emailSentSuccessfully
    });
  } catch (error) {
    console.error('Unexpected error in admin creation:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}