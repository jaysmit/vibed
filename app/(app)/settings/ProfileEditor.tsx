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
    instagram?: string;
    tiktok?: string;
    avatar?: string;
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
  const [instagram, setInstagram] = useState(initialLinks.instagram || '');
  const [tiktok, setTiktok] = useState(initialLinks.tiktok || '');
  const [avatar, setAvatar] = useState(initialLinks.avatar || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');

  // Compress image using canvas
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale down if wider than maxWidth
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setUploadingAvatar(true);
    setError('');

    try {
      // Compress to 400px for avatar
      const compressedImage = await compressImage(file, 400, 0.85);

      const res = await fetch('/api/founder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: {
            linkedin: linkedin.trim(),
            twitter: twitter.trim(),
            website: website.trim(),
            instagram: instagram.trim(),
            tiktok: tiktok.trim(),
            avatar: compressedImage,
          },
        }),
      });

      if (res.ok) {
        setAvatar(compressedImage);
        router.refresh();
      } else {
        setError('Failed to upload avatar');
      }
    } catch {
      setError('Failed to process image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle avatar removal
  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setError('');

    try {
      const res = await fetch('/api/founder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: {
            linkedin: linkedin.trim(),
            twitter: twitter.trim(),
            website: website.trim(),
            instagram: instagram.trim(),
            tiktok: tiktok.trim(),
            avatar: null,
          },
        }),
      });

      if (res.ok) {
        setAvatar('');
        router.refresh();
      } else {
        setError('Failed to remove avatar');
      }
    } catch {
      setError('Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

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
            instagram: instagram.trim(),
            tiktok: tiktok.trim(),
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
    setInstagram(initialLinks.instagram || '');
    setTiktok(initialLinks.tiktok || '');
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

        {/* Avatar section - Instagram style */}
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-rule">
          <div className="relative">
            {/* Gradient ring wrapper */}
            <div className="p-[3px] bg-gradient-to-tr from-go via-heat to-go-deep rounded-full">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-[120px] h-[120px] rounded-full object-cover border-[3px] border-page"
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-soft flex items-center justify-center text-4xl font-bold text-ink-3 border-[3px] border-page">
                  {initialName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute bottom-1 right-1 w-9 h-9 bg-go rounded-full flex items-center justify-center cursor-pointer hover:bg-[#04B76B] transition-colors shadow-lg border-2 border-page">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
              {uploadingAvatar ? (
                <div className="w-4 h-4 border-2 border-[#00301E] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00301E" strokeWidth="2.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </label>
          </div>
          <div>
            <p className="text-[15px] font-semibold">Profile Photo</p>
            <p className="text-[13px] text-ink-3 mt-1">Click the camera to upload a new photo</p>
          </div>
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
                <span className="text-ink-3">Website</span>
                <span className="font-medium truncate max-w-[200px]">{initialLinks.website || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">LinkedIn</span>
                <span className="font-medium truncate max-w-[200px]">{initialLinks.linkedin || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">Twitter/X</span>
                <span className="font-medium truncate max-w-[200px]">{initialLinks.twitter || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">Instagram</span>
                <span className="font-medium truncate max-w-[200px]">{initialLinks.instagram || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">TikTok</span>
                <span className="font-medium truncate max-w-[200px]">{initialLinks.tiktok || '—'}</span>
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
        {/* Avatar upload - Instagram style */}
        <div className="flex items-center gap-6 pb-6 border-b border-rule">
          <div className="relative flex-shrink-0">
            {/* Gradient ring wrapper */}
            <div className="p-[3px] bg-gradient-to-tr from-go via-heat to-go-deep rounded-full">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-[100px] h-[100px] rounded-full object-cover border-[3px] border-page"
                />
              ) : (
                <div className="w-[100px] h-[100px] rounded-full bg-soft flex items-center justify-center text-3xl font-bold text-ink-3 border-[3px] border-page">
                  {name.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold mb-2">Profile Photo</p>
            <div className="flex gap-2">
              <label className="px-4 py-2 bg-go text-[13px] font-semibold text-[#00301E] rounded-lg cursor-pointer hover:bg-[#04B76B] transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
                {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
              </label>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 text-[13px] font-medium text-dead hover:bg-dead-tint rounded-lg transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

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
              <label className="block text-[12px] text-ink-3 mb-1">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-2.5 rounded-lg border border-rule bg-page text-[14px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
              />
            </div>
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
              <label className="block text-[12px] text-ink-3 mb-1">Instagram</label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className="w-full px-4 py-2.5 rounded-lg border border-rule bg-page text-[14px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[12px] text-ink-3 mb-1">TikTok</label>
              <input
                type="url"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="https://tiktok.com/@yourhandle"
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
