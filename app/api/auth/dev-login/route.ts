import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/db/models';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';

// Bypass email login for testing
// Works in dev mode OR with secret key in production

const BYPASS_SECRET = process.env.AUTH_BYPASS_SECRET || 'vibed-test-2026';

export async function POST(req: NextRequest) {
  const { email, secret } = await req.json();

  // In production, require secret key
  if (process.env.NODE_ENV === 'production' && secret !== BYPASS_SECRET) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  try {
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    await connectDB();

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        emailVerified: new Date(),
      });
    }

    // Create JWT token
    const isSecure = process.env.NODE_ENV === 'production';
    const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';

    const token = await encode({
      token: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      secret: process.env.AUTH_SECRET!,
      salt: cookieName,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Set JWT cookie
    const cookieStore = await cookies();

    cookieStore.set(cookieName, token, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isSecure,
    });

    return NextResponse.json({ success: true, email: user.email });
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
