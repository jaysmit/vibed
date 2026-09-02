'use client';

import { useState } from 'react';
import { TEAM_ROLE_LABELS, type TeamRole } from '@/lib/supabase/types';
import { Avatar } from './Avatar';

interface FounderResult {
  id: string;
  name: string;
  slug: string;
  avatar_key: string | null;
}

interface TeamMember {
  type: 'existing' | 'new';
  founderId?: string;
  founderName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: TeamRole;
  invitationUrl?: string;
}

interface TeamMemberAddProps {
  members: TeamMember[];
  onMembersChange: (members: TeamMember[]) => void;
  className?: string;
}

export function TeamMemberAdd({
  members,
  onMembersChange,
  className = '',
}: TeamMemberAddProps) {
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

  // Search existing founders
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const excludeIds = members.filter((m) => m.founderId).map((m) => m.founderId);
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
  const handleAddExisting = (founder: FounderResult, role: TeamRole) => {
    const newMembers: TeamMember[] = [
      ...members,
      {
        type: 'existing',
        founderId: founder.id,
        founderName: founder.name,
        role,
      },
    ];
    onMembersChange(newMembers);
    setMode('idle');
    setSearchQuery('');
    setSearchResults([]);
  };

  // Add new person to team
  const handleAddNew = () => {
    if (!newMember.firstName.trim()) return;

    const newMembers: TeamMember[] = [
      ...members,
      {
        type: 'new',
        firstName: newMember.firstName.trim(),
        lastName: newMember.lastName.trim(),
        email: newMember.email.trim() || undefined,
        role: newMember.role,
      },
    ];
    onMembersChange(newMembers);
    setMode('idle');
    setNewMember({ firstName: '', lastName: '', email: '', role: 'team_member' });
  };

  // Remove member
  const handleRemove = (index: number) => {
    const newMembers = members.filter((_, i) => i !== index);
    onMembersChange(newMembers);
  };

  // Update member role
  const handleRoleChange = (index: number, role: TeamRole) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], role };
    onMembersChange(newMembers);
  };

  return (
    <div className={className}>
      {/* Current team members */}
      {members.length > 0 && (
        <div className="space-y-3 mb-6">
          {members.map((member, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-soft rounded-xl"
            >
              <Avatar
                name={member.founderName || `${member.firstName} ${member.lastName}`}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[15px] truncate">
                  {member.founderName || `${member.firstName} ${member.lastName}`}
                </div>
                {member.email && (
                  <div className="text-[12px] text-ink-3 truncate">{member.email}</div>
                )}
                {member.type === 'new' && !member.email && (
                  <div className="text-[12px] text-warn">No email - will need invitation link</div>
                )}
              </div>
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(index, e.target.value as TeamRole)}
                className="text-[13px] bg-page border border-rule rounded-lg px-2 py-1"
              >
                <option value="founder">{TEAM_ROLE_LABELS.founder}</option>
                <option value="partner">{TEAM_ROLE_LABELS.partner}</option>
                <option value="team_member">{TEAM_ROLE_LABELS.team_member}</option>
              </select>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1 text-ink-3 hover:text-dead transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add member UI */}
      {mode === 'idle' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('search')}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-rule rounded-xl text-[14px] font-medium hover:bg-soft transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Find existing user
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-rule rounded-xl text-[14px] font-medium hover:bg-soft transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name..."
              autoFocus
              className="flex-1 px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => {
                setMode('idle');
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="p-3 text-ink-3 hover:text-ink"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isSearching && (
            <div className="text-center py-4 text-ink-3">Searching...</div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((founder) => (
                <div
                  key={founder.id}
                  className="flex items-center gap-3 p-3 bg-soft rounded-xl"
                >
                  <Avatar name={founder.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] truncate">{founder.name}</div>
                    <div className="text-[12px] text-ink-3">@{founder.slug}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddExisting(founder, 'founder')}
                      className="text-[12px] px-3 py-1 bg-ink text-white rounded-full hover:bg-go-deep transition-colors"
                    >
                      Add as Founder
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddExisting(founder, 'team_member')}
                      className="text-[12px] px-3 py-1 border border-rule rounded-full hover:bg-page transition-colors"
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
              <p className="text-ink-3 mb-2">No users found</p>
              <button
                type="button"
                onClick={() => setMode('new')}
                className="text-[14px] text-go-deep hover:underline"
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
            <h4 className="font-semibold text-[15px]">Add new team member</h4>
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
            disabled={!newMember.firstName.trim()}
            className="w-full py-2 bg-ink text-white font-semibold rounded-full hover:bg-go-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to team
          </button>
        </div>
      )}
    </div>
  );
}
