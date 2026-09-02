import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createVenture, getVenturesByFounderUserId } from '@/lib/services/ventures';
import { addTeamMember, createMasterMember } from '@/lib/services/team';
import { z } from 'zod';
import { INDUSTRIES, TEAM_ROLES } from '@/lib/supabase/types';

// Team member schema for new venture creation
const TeamMemberSchema = z.object({
  type: z.enum(['existing', 'new']),
  founderId: z.string().uuid().optional(),
  founderName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(TEAM_ROLES),
});

const CreateVentureSchema = z.object({
  name: z.string().min(1).max(100),
  country: z.string().max(10).nullable().optional(),
  categories: z.array(z.enum(INDUSTRIES)).max(3).optional(),
  teamMembers: z.array(TeamMemberSchema).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = CreateVentureSchema.parse(body);

    const result = await createVenture({
      userId,
      name: data.name,
      country: data.country || null,
      categories: data.categories || [],
    });

    // Try to create master member (may fail if table doesn't exist yet)
    const invitationUrls: { name: string; url: string }[] = [];

    try {
      await createMasterMember(result.ventureId, result.founderId);

      // Add team members and collect invitation URLs
      if (data.teamMembers && data.teamMembers.length > 0) {
        for (const member of data.teamMembers) {
          try {
            const { invitationUrl } = await addTeamMember({
              ventureId: result.ventureId,
              founderId: member.founderId,
              email: member.email,
              firstName: member.firstName,
              lastName: member.lastName,
              role: member.role,
              invitedBy: result.founderId,
            });

            if (invitationUrl) {
              const name = member.founderName ||
                [member.firstName, member.lastName].filter(Boolean).join(' ') ||
                member.email ||
                'Team Member';
              invitationUrls.push({ name, url: invitationUrl });
            }
          } catch (err) {
            console.error('Failed to add team member:', err);
          }
        }
      }
    } catch (err) {
      // venture_members table may not exist yet - continue without team features
      console.error('Team features not available:', err);
    }

    return NextResponse.json({
      ...result,
      invitationUrls,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Create venture error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ventures = await getVenturesByFounderUserId(userId);

  return NextResponse.json({ ventures });
}
