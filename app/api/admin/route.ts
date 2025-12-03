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
    const { email, firstName, lastName, permissions = ['read', 'write'] } = await request.json()
    
    // Log the incoming request for debugging
    console.log('Admin creation request received:', { email, firstName, lastName, permissions });
    
    // Validate email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      console.log('Email validation failed for:', email);
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }
    
    // Check if user already exists in profiles table
    console.log('Checking if user already exists:', email);
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    
    console.log('Profile check result:', { existingProfile, profileError });
    
    if (profileError) {
      console.log('Profile check error:', profileError);
      return NextResponse.json(
        { error: `Error checking existing profile: ${profileError.message}` },
        { status: 400 }
      )
    }
    
    // If profile already exists, return appropriate error
    if (existingProfile) {
      console.log('User already exists:', email);
      return NextResponse.json(
        { error: 'A user with this email address has already been registered' },
        { status: 400 }
      )
    }
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    
    console.log('Attempting to create user with temporary password:', email);
    
    // Create user directly with temporary password
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true
    })
    
    console.log('Create user result:', { data, error: createError });
    
    if (createError) {
      console.log('Create user error:', createError);
      
      // If it's an email configuration error, fall back to manual creation
      if (createError.message.includes('email') || createError.message.includes('SMTP') || createError.message.includes('provider')) {
        console.log('Email provider not configured, falling back to manual user creation');
        
        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        
        // Create user manually without email invitation
        const { data: userData, error: createUserError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true
        });
        
        if (createUserError) {
          console.log('Manual user creation error:', createUserError);
          return NextResponse.json(
            { error: `Failed to create user: ${createUserError.message}` },
            { status: 400 }
          );
        }
        
        if (userData.user) {
          // Store profile data
          const profileData = {
            id: userData.user.id,
            name: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
            first_name: firstName || '',
            last_name: lastName || '',
            email: email,
            role: 'admin',
            permissions: JSON.stringify(permissions),
          };
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([profileData]);
            
          if (insertError) {
            console.log('Profile insert error:', insertError);
            try {
              await supabase.auth.admin.deleteUser(userData.user.id);
            } catch (deleteError) {
              console.error('Error deleting user after profile insert failure:', deleteError);
            }
            return NextResponse.json(
              { error: `Failed to store user role in database: ${insertError.message}` },
              { status: 400 }
            );
          }
          
          // Return success with manual password sharing instructions
          const message = 'Admin successfully created. IMPORTANT: Email services are not configured, so no invitation email was sent.';
          return NextResponse.json({
            success: true,
            message,
            tempPassword,
            emailSent: false
          });
        }
      }
      
      // Handle specific error cases
      if (createError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'A user with this email address has already been registered' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }
    
    if (data.user) {
      console.log('User created successfully, inserting profile data:', data.user.id);
      
      // Store additional profile information in database
      const profileData = {
        id: data.user.id,
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
        .insert([profileData])
      
      if (insertError) {
        console.log('Profile insert error:', insertError);
        // If we fail to insert into profiles, we should delete the auth user to avoid inconsistency
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (deleteError) {
          console.error('Error deleting user after profile insert failure:', deleteError);
        }
        return NextResponse.json(
          { error: `Failed to store user role in database: ${insertError.message}` },
          { status: 400 }
        )
      }
      
      // Prepare success message
      const message = 'Admin successfully created. Use the temporary password below to log in.';
      
      // Return success with temporary password
      return NextResponse.json({
        success: true,
        message,
        tempPassword,
        emailSent: false
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Unexpected error in admin creation:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}