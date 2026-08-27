import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const BYPASS_SECRET = 'vibed-test-2026';

export async function POST(request: NextRequest) {
  try {
    const { email, secret } = await request.json();

    // Verify bypass secret
    if (secret !== BYPASS_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // User exists - update their password so we can sign them in
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password: 'dev-password-123',
        email_confirm: true,
      });
      userId = existingUser.id;
    } else {
      // Create new user with password
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: 'dev-password-123',
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 });
      }
      userId = newUser.user.id;
    }

    // Generate a magic link that auto-signs them in
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData) {
      return NextResponse.json({ error: linkError?.message || 'Failed to generate link' }, { status: 500 });
    }

    // Return the hashed token for client-side verification
    const url = new URL(linkData.properties?.action_link || '');
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');

    return NextResponse.json({
      success: true,
      userId,
      token,
      type,
      redirectUrl: `/api/auth/callback?token_hash=${token}&type=${type}&next=/dashboard`
    });
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
