import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { addTeamMember, getTeamMembers, removeTeamMember, updateMemberRole } from '@/lib/services/team';
import { z } from 'zod';
import { TEAM_ROLES } from '@/lib/supabase/types';

const AddTeamMemberSchema = z.object({
  founderId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  role: z.enum(TEAM_ROLES),
});

const UpdateRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(TEAM_ROLES),
});

const RemoveMemberSchema = z.object({
  memberId: z.string().uuid(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  const { id: ventureId } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const members = await getTeamMembers(ventureId);
    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  const { id: ventureId } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = AddTeamMemberSchema.parse(body);

    // Get founder ID for current user
    const supabase = await createAdminClient();
    const { data: founder } = await supabase
      .from('founders')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!founder) {
      return NextResponse.json({ error: 'Founder profile not found' }, { status: 400 });
    }

    // Validate that either founderId or firstName is provided
    if (!data.founderId && !data.firstName) {
      return NextResponse.json({ error: 'Either founderId or firstName is required' }, { status: 400 });
    }

    const result = await addTeamMember({
      ventureId,
      founderId: data.founderId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      invitedBy: founder.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Add team member error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  const { id: ventureId } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = UpdateRoleSchema.parse(body);

    // Get founder ID for current user
    const supabase = await createAdminClient();
    const { data: founder } = await supabase
      .from('founders')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!founder) {
      return NextResponse.json({ error: 'Founder profile not found' }, { status: 400 });
    }

    const result = await updateMemberRole(ventureId, data.memberId, data.role, founder.id);

    if (!result.success) {
      return NextResponse.json({ error: 'Not authorized or member not found' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Update member role error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  const { id: ventureId } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = RemoveMemberSchema.parse(body);

    // Get founder ID for current user
    const supabase = await createAdminClient();
    const { data: founder } = await supabase
      .from('founders')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!founder) {
      return NextResponse.json({ error: 'Founder profile not found' }, { status: 400 });
    }

    const result = await removeTeamMember(ventureId, data.memberId, founder.id);

    if (!result.success) {
      return NextResponse.json({ error: 'Not authorized or member not found' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Remove team member error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
