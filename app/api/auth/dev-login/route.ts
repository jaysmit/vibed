import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/db/models';
import { cookies } from 'next/headers';
import crypto from 'crypto';

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

    // Create session token
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Import mongodb client directly for session creation
    const clientPromise = (await import('@/lib/auth/mongodb-adapter')).default;
    const client = await clientPromise;
    const db = client.db();

    // Create session in database
    await db.collection('sessions').insertOne({
      sessionToken,
      userId: user._id,
      expires,
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('authjs.session-token', sessionToken, {
      expires,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true, email: user.email });
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
