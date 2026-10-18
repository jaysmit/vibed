'use client';

import { useState, useEffect, useCallback } from 'react';
import { TEAM_ROLE_LABELS, type TeamRole } from '@/lib/supabase/types';
import { Avatar } from './Avatar';

interface TeamMember {
  id: string;
  founder_id: string | null;
  founder?: {
    id: string;
    name: string;
    slug: string;
    avatar_key: string | null;
  };
  email: string | null;
  name: string | null;
  role: TeamRole;
  status: 'active' | 'invited' | 'pending';
  invitation_token?: string;
}

interface FounderResult {
  id: string;
  name: string;
  slug: string;
  avatar_key: string | null;
}

interface TeamEditorProps {
  ventureId: string;
  className?: string;
}

export function TeamEditor({ ventureId, className = '' }: TeamEditorProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add member UI state
  const [mode, setMode] = useState<'idle' | 'search' | 'new'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FounderResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'team_member' as TeamRole,
  });

  // Invitation URL to display
  const [showInviteUrl, setShowInviteUrl] = useState<{ name: string; url: string } | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/ventures/${ventureId}/team`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      console.error('Failed to fetch team');
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Search existing founders
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const excludeIds = members
        .filter((m) => m.founder_id)
        .map((m) => m.founder_id);
      const res = await fetch(
        `/api/founders/search?q=${encodeURIComponent(query)}&exclude=${excludeIds.join(',')}`
      );
      const data = await res.json();
      setSearchResults(data.founders || []);
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Add existing founder to team
  const handleAddExisting = async (founder: FounderResult, role: TeamRole) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ founderId: founder.id, role }),
      });

      if (res.ok) {
        await fetchTeam();
        setMode('idle');
        setSearchQuery('');
        setSearchResults([]);
        setSuccess('Team member added');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add team member');
      }
    } catch {
      setError('Failed to add team member');
    }
    setSaving(false);
  };

  // Add new person to team
  const handleAddNew = async () => {
    if (!newMember.firstName.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newMember.firstName.trim(),
          lastName: newMember.lastName.trim(),
          email: newMember.email.trim() || undefined,
          role: newMember.role,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchTeam();
        setMode('idle');
        setNewMember({ firstName: '', lastName: '', email: '', role: 'team_member' });
        setSuccess('Team member added');
        setTimeout(() => setSuccess(null), 3000);

        // Show invitation URL if one was created
        if (data.invitationUrl) {
          setShowInviteUrl({
            name: `${newMember.firstName} ${newMember.lastName}`.trim(),
            url: data.invitationUrl,
          });
        }
      } else {
        setError(data.error || 'Failed to add team member');
      }
    } catch {
      setError('Failed to add team member');
    }
    setSaving(false);
  };

  // Update member role
  const handleRoleChange = async (memberId: string, role: TeamRole) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/team`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role }),
      });

      if (res.ok) {
        setMembers(members.map(m => m.id === memberId ? { ...m, role } : m));
        setSuccess('Role updated');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update role');
      }
    } catch {
      setError('Failed to update role');
    }
    setSaving(false);
  };

  // Remove member
  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this team member?')) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/team`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      if (res.ok) {
        setMembers(members.filter(m => m.id !== memberId));
        setSuccess('Team member removed');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to remove team member');
      }
    } catch {
      setError('Failed to remove team member');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className={`${className} p-4 text-center text-ink-3`}>
        Loading team...
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Success/Error messages */}
      {success && (
        <div className="mb-4 p-3 bg-go-tint text-go-deep text-[13px] font-medium rounded-lg flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-dead-tint text-dead text-[13px] font-medium rounded-lg">
          {error}
        </div>
      )}

      {/* Invitation URL modal */}
      {showInviteUrl && (
        <div className="mb-4 p-4 bg-go-tint border border-go/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-[14px] text-go-deep">Invitation link for {showInviteUrl.name}</p>
            <button
              onClick={() => setShowInviteUrl(null)}
              className="text-ink-3 hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={showInviteUrl.url}
              className="flex-1 px-3 py-2 bg-page border border-rule rounded-lg text-[13px] text-ink-2"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(showInviteUrl.url);
                setSuccess('Link copied!');
                setTimeout(() => setSuccess(null), 2000);
              }}
              className="px-4 py-2 bg-go-deep text-white rounded-lg text-[13px] font-medium hover:bg-go transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-[11px] text-go-deep/70 mt-2">
            Share this link with them to join your venture.
          </p>
        </div>
      )}

      {/* Current team members */}
      {members.length > 0 && (
        <div className="space-y-2 mb-4">
          {members.map((member) => {
            const displayName = member.founder?.name || member.name || 'Unknown';
            const isInvited = member.status === 'invited' || member.status === 'pending';

            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  isInvited ? 'bg-warn-tint border border-warn/20' : 'bg-soft'
                }`}
              >
                <Avatar
                  name={displayName}
                  imageUrl={member.founder?.avatar_key ? `https://hhhhqgmmnhmxuzavdcqt.supabase.co/storage/v1/object/public/avatars/${member.founder.avatar_key}` : undefined}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] truncate flex items-center gap-2">
                    {displayName}
                    {isInvited && (
                      <span className="text-[10px] bg-warn text-white px-1.5 py-0.5 rounded font-medium">
                        Pending
                      </span>
                    )}
                  </div>
                  {member.email && (
                    <div className="text-[12px] text-ink-3 truncate">{member.email}</div>
                  )}
                </div>
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as TeamRole)}
                  disabled={saving}
                  className="text-[13px] bg-page border border-rule rounded-lg px-2 py-1.5 disabled:opacity-50"
                >
                  <option value="founder">{TEAM_ROLE_LABELS.founder}</option>
                  <option value="partner">{TEAM_ROLE_LABELS.partner}</option>
                  <option value="team_member">{TEAM_ROLE_LABELS.team_member}</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemove(member.id)}
                  disabled={saving}
                  className="p-1.5 text-ink-3 hover:text-dead transition-colors disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {members.length === 0 && mode === 'idle' && (
        <p className="text-[13px] text-ink-3 mb-4">
          No team members yet. Add your co-founders or team to show visitors who&apos;s building this.
        </p>
      )}

      {/* Add member UI */}
      {mode === 'idle' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('search')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-rule rounded-xl text-[13px] font-medium hover:bg-soft transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Find existing user
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-rule rounded-xl text-[13px] font-medium hover:bg-soft transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <path d="M20 8v6M23 11h-6" />
            </svg>
            Add new person
          </button>
        </div>
      )}

      {/* Search existing users */}
      {mode === 'search' && (
        <div className="space-y-3 p-4 border border-rule rounded-xl">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name..."
              autoFocus
              className="flex-1 px-4 py-2.5 rounded-lg border border-rule bg-page text-[14px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => {
                setMode('idle');
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="p-2 text-ink-3 hover:text-ink"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isSearching && (
            <div className="text-center py-4 text-ink-3 text-[13px]">Searching...</div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((founder) => (
                <div
                  key={founder.id}
                  className="flex items-center gap-3 p-3 bg-soft rounded-lg"
                >
                  <Avatar name={founder.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px] truncate">{founder.name}</div>
                    <div className="text-[11px] text-ink-3">@{founder.slug}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddExisting(founder, 'founder')}
                      disabled={saving}
                      className="text-[11px] px-2.5 py-1 bg-ink text-white rounded-full hover:bg-go-deep transition-colors disabled:opacity-50"
                    >
                      Add as Founder
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddExisting(founder, 'team_member')}
                      disabled={saving}
                      className="text-[11px] px-2.5 py-1 border border-rule rounded-full hover:bg-page transition-colors disabled:opacity-50"
                    >
                      Add as Team
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-4">
              <p className="text-ink-3 text-[13px] mb-2">No users found</p>
              <button
                type="button"
                onClick={() => setMode('new')}
                className="text-[13px] text-go-deep hover:underline"
              >
                Add them as a new person instead
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add new person form */}
      {mode === 'new' && (
        <div className="space-y-4 p-4 border border-rule rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[14px]">Add new team member</h4>
            <button
              type="button"
              onClick={() => {
                setMode('idle');
                setNewMember({ firstName: '', lastName: '', email: '', role: 'team_member' });
              }}
              className="text-ink-3 hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium mb-1">First name *</label>
              <input
                type="text"
                value={newMember.firstName}
                onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                placeholder="Maya"
                className="w-full px-3 py-2 rounded-lg border border-rule bg-page text-[14px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1">Last name</label>
              <input
                type="text"
                value={newMember.lastName}
                onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                placeholder="Okonkwo"
                className="w-full px-3 py-2 rounded-lg border border-rule bg-page text-[14px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1">Email (optional)</label>
            <input
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              placeholder="maya@example.com"
              className="w-full px-3 py-2 rounded-lg border border-rule bg-page text-[14px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
            />
            <p className="text-[11px] text-ink-3 mt-1">
              If no email, you&apos;ll get an invitation link to share manually.
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1">Role</label>
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value as TeamRole })}
              className="w-full px-3 py-2 rounded-lg border border-rule bg-page text-[14px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
            >
              <option value="founder">{TEAM_ROLE_LABELS.founder}</option>
              <option value="partner">{TEAM_ROLE_LABELS.partner}</option>
              <option value="team_member">{TEAM_ROLE_LABELS.team_member}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddNew}
            disabled={!newMember.firstName.trim() || saving}
            className="w-full py-2.5 bg-ink text-white font-semibold rounded-full hover:bg-go-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[14px]"
          >
            {saving ? 'Adding...' : 'Add to team'}
          </button>
        </div>
      )}
    </div>
  );
}
