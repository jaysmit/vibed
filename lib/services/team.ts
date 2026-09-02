import { createAdminClient } from '@/lib/supabase/server';
import type { TeamRole, TeamStatus, VentureMember } from '@/lib/supabase/types';
import { randomBytes } from 'crypto';

// Generate a secure invitation token
function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

export interface AddTeamMemberInput {
  ventureId: string;
  founderId?: string;  // If existing user
  email?: string;      // If new person
  firstName?: string;
  lastName?: string;
  role: TeamRole;
  invitedBy: string;   // Founder ID of inviter
}

export interface TeamMemberWithDetails extends VentureMember {
  founder?: {
    id: string;
    name: string;
    slug: string;
    avatar_key: string | null;
  } | null;
}

// Add a team member (either existing user or new invite)
export async function addTeamMember(input: AddTeamMemberInput): Promise<{ member: VentureMember; invitationUrl: string | null }> {
  const supabase = await createAdminClient();

  const invitationToken = generateInvitationToken();

  const { data: member, error } = await supabase
    .from('venture_members')
    .insert({
      venture_id: input.ventureId,
      founder_id: input.founderId || null,
      email: input.email || null,
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      role: input.role,
      status: 'pending',
      is_master: false,
      invited_by: input.invitedBy,
      invitation_token: invitationToken,
    })
    .select()
    .single();

  if (error || !member) {
    throw new Error(`Failed to add team member: ${error?.message}`);
  }

  // Generate invitation URL (mock for now - no actual email sent)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const invitationUrl = `${baseUrl}/invite/${invitationToken}`;

  return { member, invitationUrl };
}

// Create the master team member (venture creator)
export async function createMasterMember(ventureId: string, founderId: string): Promise<VentureMember> {
  const supabase = await createAdminClient();

  const { data: member, error } = await supabase
    .from('venture_members')
    .insert({
      venture_id: ventureId,
      founder_id: founderId,
      role: 'founder',
      status: 'accepted',
      is_master: true,
      accepted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !member) {
    throw new Error(`Failed to create master member: ${error?.message}`);
  }

  return member;
}

// Get team members for a venture
export async function getTeamMembers(ventureId: string): Promise<TeamMemberWithDetails[]> {
  const supabase = await createAdminClient();

  const { data: members, error } = await supabase
    .from('venture_members')
    .select(`
      *,
      founder:founders(id, name, slug, avatar_key)
    `)
    .eq('venture_id', ventureId)
    .neq('status', 'removed')
    .order('is_master', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get team members: ${error.message}`);
  }

  return (members || []) as TeamMemberWithDetails[];
}

// Accept an invitation
export async function acceptInvitation(token: string, founderId: string): Promise<{ success: boolean; ventureSlug?: string }> {
  const supabase = await createAdminClient();

  // Find the invitation
  const { data: member, error: findError } = await supabase
    .from('venture_members')
    .select('*, ventures(slug)')
    .eq('invitation_token', token)
    .eq('status', 'pending')
    .single();

  if (findError || !member) {
    return { success: false };
  }

  // Update the member with the founder_id and accept
  const { error: updateError } = await supabase
    .from('venture_members')
    .update({
      founder_id: founderId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      invitation_token: null, // Clear token after use
    })
    .eq('id', member.id);

  if (updateError) {
    throw new Error(`Failed to accept invitation: ${updateError.message}`);
  }

  const venture = member.ventures as { slug: string } | null;
  return { success: true, ventureSlug: venture?.slug };
}

// Decline an invitation
export async function declineInvitation(token: string): Promise<{ success: boolean }> {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('venture_members')
    .update({
      status: 'declined',
      invitation_token: null,
    })
    .eq('invitation_token', token)
    .eq('status', 'pending');

  if (error) {
    return { success: false };
  }

  return { success: true };
}

// Remove a team member (only master can do this)
export async function removeTeamMember(
  ventureId: string,
  memberId: string,
  requesterId: string
): Promise<{ success: boolean }> {
  const supabase = await createAdminClient();

  // Verify requester is master
  const { data: requesterMember } = await supabase
    .from('venture_members')
    .select('is_master')
    .eq('venture_id', ventureId)
    .eq('founder_id', requesterId)
    .single();

  if (!requesterMember?.is_master) {
    return { success: false };
  }

  // Can't remove yourself as master
  const { data: targetMember } = await supabase
    .from('venture_members')
    .select('is_master')
    .eq('id', memberId)
    .single();

  if (targetMember?.is_master) {
    return { success: false };
  }

  // Mark as removed
  const { error } = await supabase
    .from('venture_members')
    .update({ status: 'removed' })
    .eq('id', memberId)
    .eq('venture_id', ventureId);

  if (error) {
    return { success: false };
  }

  return { success: true };
}

// Update team member role
export async function updateMemberRole(
  ventureId: string,
  memberId: string,
  newRole: TeamRole,
  requesterId: string
): Promise<{ success: boolean }> {
  const supabase = await createAdminClient();

  // Verify requester is master
  const { data: requesterMember } = await supabase
    .from('venture_members')
    .select('is_master')
    .eq('venture_id', ventureId)
    .eq('founder_id', requesterId)
    .single();

  if (!requesterMember?.is_master) {
    return { success: false };
  }

  const { error } = await supabase
    .from('venture_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('venture_id', ventureId);

  if (error) {
    return { success: false };
  }

  return { success: true };
}

// Check if user is master of a venture
export async function isVentureMaster(ventureId: string, founderId: string): Promise<boolean> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('venture_members')
    .select('is_master')
    .eq('venture_id', ventureId)
    .eq('founder_id', founderId)
    .single();

  return data?.is_master === true;
}

// Search founders for team invitation
export async function searchFounders(query: string, excludeIds: string[] = []): Promise<Array<{
  id: string;
  name: string;
  slug: string;
  avatar_key: string | null;
}>> {
  const supabase = await createAdminClient();

  const { data: founders, error } = await supabase
    .from('founders')
    .select('id, name, slug, avatar_key')
    .ilike('name', `%${query}%`)
    .limit(10);

  if (error || !founders) {
    return [];
  }

  // Filter out excluded IDs
  return founders.filter((f) => !excludeIds.includes(f.id));
}
