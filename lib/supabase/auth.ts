import { createClient } from './server';

/**
 * Get the current authenticated user from Supabase
 * Returns null if not authenticated
 * NOTE: This makes a network request to validate the token - use for protected routes
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's ID
 * Returns null if not authenticated
 * NOTE: This makes a network request - use getCurrentUserIdFast for public pages
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/**
 * Fast user ID check using local JWT validation only (no network request)
 * Use this for public pages where you just need to personalize UI
 * DO NOT use this for security-critical operations
 */
export async function getCurrentUserIdFast(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
