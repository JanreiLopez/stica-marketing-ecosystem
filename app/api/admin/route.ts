import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

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
    
    // Generate temporary password (for manual sharing if email fails)
    const tempPassword = Math.random().toString(36).slice(-8)
    
    console.log('Attempting to invite user by email:', email);
    
    // Invite user by email (this will create the user and send invitation email)
    const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
      data: {
        first_name: firstName || '',
        last_name: lastName || '',
        role: 'admin',
        permissions: permissions
      }
    })
    
    console.log('Invite user result:', { data, inviteError });
    
    if (inviteError) {
      console.log('Invite user error:', inviteError);
      
      // If it's an email configuration error, fall back to manual creation
      if (inviteError.message.includes('email') || inviteError.message.includes('SMTP') || inviteError.message.includes('provider')) {
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
      if (inviteError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'A user with this email address has already been registered' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: inviteError.message },
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
      
      // Send custom email with temporary password
      let emailSent = false;
      
      // Check if SMTP configuration is available
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          // Create transporter using environment variables
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
          
          // Verify transporter configuration
          await transporter.verify();
          
          // Send email with temporary password
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'STICA Marketing Ecosystem - Admin Account Created',
            text: `Welcome to the STICA Marketing Ecosystem Admin Portal!

Your admin account has been created. You can log in using the following credentials:

Email: ${email}
Temporary Password: ${tempPassword}

Please visit ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login to log in.

After logging in, please change your password immediately for security reasons.

Best regards,
The STICA Team`,
            html: `<h2>Welcome to the STICA Marketing Ecosystem Admin Portal!</h2>
<p>Your admin account has been created. You can log in using the following credentials:</p>
<ul>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Temporary Password:</strong> ${tempPassword}</li>
</ul>
<p>Please <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login">click here</a> to log in.</p>
<p><strong>After logging in, please change your password immediately for security reasons.</strong></p>
<br>
<p>Best regards,<br>The STICA Team</p>`
          });
          
          emailSent = true;
          console.log('Custom email sent successfully to:', email);
        } catch (emailError) {
          console.error('Error sending custom email:', emailError);
          // Continue with the process even if email fails
        }
      } else {
        console.log('SMTP configuration not found. Skipping email sending.');
        // Still return success but indicate that email wasn't sent
        const message = 'Admin successfully created. SMTP configuration not found - please configure email settings to enable automatic email sending. Share the temporary password below manually.';
        return NextResponse.json({
          success: true,
          message,
          tempPassword,
          emailSent: false
        });
      }
      
      // Prepare success message
      const message = emailSent 
        ? 'Admin successfully created. A welcome email with login credentials has been sent.'
        : 'Admin successfully created. However, we couldn\'t send the welcome email. Please share the temporary password below manually.';
      
      // Return success with temporary password
      return NextResponse.json({
        success: true,
        message,
        tempPassword,
        emailSent
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