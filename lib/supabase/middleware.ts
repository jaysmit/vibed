import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Protected routes that require authentication
const PROTECTED_PATHS = ['/dashboard', '/start', '/following', '/settings', '/profile'];

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if this is a protected path BEFORE creating Supabase client
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
    || pathname.endsWith('/edit');

  // For public paths, skip auth check entirely - just pass through
  if (!isProtectedPath) {
    return NextResponse.next({ request });
  }

  // Only create Supabase client for protected paths
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check session - local JWT validation
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
