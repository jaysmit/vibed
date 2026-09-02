import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { acceptInvitation, declineInvitation } from '@/lib/services/team';

// GET - Get invitation details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const supabase = await createAdminClient();

  // Get invitation details
  const { data: member, error } = await supabase
    .from('venture_members')
    .select(`
      id,
      first_name,
      last_name,
      email,
      role,
      status,
      created_at,
      ventures(id, name, slug, brand, glyph),
      inviter:invited_by(name)
    `)
    .eq('invitation_token', token)
    .single();

  if (error || !member) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  if (member.status !== 'pending') {
    return NextResponse.json({
      error: 'Invitation already used',
      status: member.status,
    }, { status: 400 });
  }

  return NextResponse.json({
    invitation: {
      id: member.id,
      name: [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Team Member',
      email: member.email,
      role: member.role,
      venture: member.ventures,
      invitedBy: (member.inviter as { name: string } | { name: string }[] | null)
        ? (Array.isArray(member.inviter) ? member.inviter[0]?.name : (member.inviter as { name: string })?.name)
        : null,
      createdAt: member.created_at,
    },
  });
}

// POST - Accept invitation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const userId = await getCurrentUserId();
  const { token } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get founder ID for current user
  const supabase = await createAdminClient();
  const { data: founder } = await supabase
    .from('founders')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!founder) {
    return NextResponse.json({ error: 'Create your profile first' }, { status: 400 });
  }

  try {
    const result = await acceptInvitation(token, founder.id);

    if (!result.success) {
      return NextResponse.json({ error: 'Invitation not found or already used' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ventureSlug: result.ventureSlug,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Decline invitation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const result = await declineInvitation(token);

    if (!result.success) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Decline invitation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
