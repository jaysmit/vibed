'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileEditorProps {
  founderId: string;
  initialName: string;
  initialHeadline: string;
  initialBio: string;
  initialLocation: string;
  initialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export function ProfileEditor({
  founderId,
  initialName,
  initialHeadline,
  initialBio,
  initialLocation,
  initialLinks,
}: ProfileEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(initialName);
  const [headline, setHeadline] = useState(initialHeadline);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const [linkedin, setLinkedin] = useState(initialLinks.linkedin || '');
  const [twitter, setTwitter] = useState(initialLinks.twitter || '');
  const [website, setWebsite] = useState(initialLinks.website || '');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const res = await fetch('/api/founder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          headline: headline.trim(),
          bio: bio.trim(),
          location: location.trim(),
          links: {
            linkedin: linkedin.trim(),
            twitter: twitter.trim(),
            website: website.trim(),
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setError('Failed to save changes');
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    setName(initialName);
    setHeadline(initialHeadline);
    setBio(initialBio);
    setLocation(initialLocation);
    setLinkedin(initialLinks.linkedin || '');
    setTwitter(initialLinks.twitter || '');
    setWebsite(initialLinks.website || '');
    setError('');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="bg-page border border-rule rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold">Edit Profile</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-[13px] text-go-deep hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="space-y-3 text-[14px]">
          <div className="flex justify-between">
            <span className="text-ink-3">Name</span>
            <span className="font-medium">{initialName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-3">Headline</span>
            <span className="font-medium max-w-[300px] text-right">{initialHeadline || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-3">Location</span>
            <span className="font-medium">{initialLocation || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-3">Bio</span>
            <span className="font-medium max-w-[300px] text-right line-clamp-2">{initialBio || '—'}</span>
          </div>
          <div className="pt-2 border-t border-rule">
            <span className="text-ink-3 block mb-2">Social Links</span>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-3">LinkedIn</span>
                <span className="font-medium truncate max-w-[200px]">{initialLinks.linkedin || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">Twitter/X</span>
                <span className="font-medium truncate max-w-[200px]">{initialLinks.twitter || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">Website</span>
                <span className="font-medium truncate max-w-[200px]">{initialLinks.website || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-page border border-go rounded-xl p-6">
      <h3 className="text-[16px] font-bold mb-4">Edit Profile</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium mb-2">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium mb-2">Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Serial Entrepreneur | Founder at Slate"
            className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
          />
          <p className="text-[12px] text-ink-3 mt-1">A short tagline that appears under your name</p>
        </div>

        <div>
          <label className="block text-[13px] font-medium mb-2">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Melbourne, Australia"
            className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a bit about yourself..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none"
          />
        </div>

        <div className="pt-2 border-t border-rule">
          <label className="block text-[13px] font-medium mb-3">Social Links</label>

          <div className="space-y-3">
            <div>
              <label className="block text-[12px] text-ink-3 mb-1">LinkedIn</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-2.5 rounded-lg border border-rule bg-page text-[14px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[12px] text-ink-3 mb-1">Twitter/X</label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://x.com/yourhandle"
                className="w-full px-4 py-2.5 rounded-lg border border-rule bg-page text-[14px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[12px] text-ink-3 mb-1">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-2.5 rounded-lg border border-rule bg-page text-[14px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-dead text-[13px]">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 py-3 px-6 border border-rule rounded-full text-[14px] font-semibold hover:bg-soft transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 px-6 bg-go text-[#00301E] rounded-full text-[14px] font-semibold hover:bg-[#04B76B] transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
