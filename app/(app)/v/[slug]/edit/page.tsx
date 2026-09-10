'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SEGMENT_KEYS, RUNGS } from '@/lib/domain/rungs';
import type { SegmentKey, Rung } from '@/lib/domain/rungs';
import { QUESTIONS } from '@/lib/domain/questions';
import { CountrySelector, ProgressRingCompact } from '@/components/ui';
import { VideoPlayer } from '@/components/ui/VideoPlayerLazy';
import { VideoUploader } from '@/components/ui/VideoUploader';
import { calculateCompletion, REQUIREMENT_LABELS, REQUIREMENT_ACTIONS, type PublishingRequirements } from '@/lib/domain/standards';
import { INDUSTRIES, INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';

const SEGMENT_LABELS: Record<string, string> = {
  pitch: 'Elevator Pitch',
  spark: 'The Spark',
  validation: 'Validation',
  audience: 'Building Audience',
  proto: 'First Prototype',
  build: 'The Build',
  beta: 'Beta Testing',
  gtm: 'Go-to-Market',
  launch: 'Launch',
  first: 'First Dollar',
  channel: 'Finding Channels',
  trouble: 'Trouble',
  money: 'Money',
  team: 'Team',
  scale: 'Scale',
  next: 'What Next',
};

const SEGMENT_PROMPTS: Record<string, string> = {
  pitch: 'You have 30 seconds with an investor. What\'s the problem, your solution, and why now? Include traction if you have it.',
  spark: 'The moment that made you say "I have to build this." The frustration, the gap you saw, the personal pain that started it all.',
  validation: 'How did you prove people actually want this? Customer interviews, landing page signups, LOIs, waitlists, pre-sales - what evidence do you have?',
  audience: 'Who are your first 100 users and how are you reaching them? Community building, content, ads, partnerships?',
  proto: 'What did v0.1 look like? The embarrassing first version. Screenshots welcome. What did you learn from putting it in front of people?',
  build: 'The technical and product journey. Stack decisions, pivots, features that worked, features you killed. The real story of building.',
  beta: 'Early users and their unfiltered feedback. The praise that kept you going. The criticism that made you better. Specific quotes help.',
  gtm: 'Your go-to-market strategy. Launch channels, pricing decisions, positioning. Or if you\'re still figuring it out, what you\'re testing.',
  launch: 'The launch story. Where you launched, what happened, the numbers. First day, first week. The high and the reality check after.',
  first: 'Your first paying customer. How you found them, what convinced them, what they paid. The moment it became a real business.',
  channel: 'What acquisition channels are working? CAC, conversion rates, what you\'ve tried. The path to repeatable growth.',
  trouble: 'The setbacks, failures, and near-death moments. What went wrong and what you learned. Founders respect honesty here.',
  money: 'Revenue, costs, runway, fundraising. The financial reality. What you\'ve raised, what you\'re raising, or why you\'re bootstrapping.',
  team: 'Solo or team? Co-founders, first hires, advisors. How you found them, equity splits, what you\'re looking for next.',
  scale: 'Growing beyond early traction. Systems, processes, hiring, expanding markets. The challenges of scaling.',
  next: 'The roadmap. What you\'re building next, where you\'re heading, the vision. What would make this a massive success?',
};

// Segment phases for the sidebar
const SEGMENT_PHASES = {
  idea: {
    label: 'Idea Stage',
    description: 'The foundation of your venture',
    segments: ['pitch', 'spark', 'validation'],
  },
  building: {
    label: 'Building',
    description: 'From idea to product',
    segments: ['proto', 'build', 'beta'],
  },
  launch: {
    label: 'Launch',
    description: 'Going to market',
    segments: ['gtm', 'launch', 'first'],
  },
  growth: {
    label: 'Growth',
    description: 'Finding traction',
    segments: ['audience', 'channel', 'scale'],
  },
  reality: {
    label: 'The Real Stuff',
    description: 'The unglamorous truth',
    segments: ['trouble', 'money', 'team', 'next'],
  },
};

// Required segments for publishing
const REQUIRED_SEGMENTS = ['pitch', 'spark'];

// Plan prompts - what to write if you haven't done this yet
const PLAN_PROMPTS: Record<string, string> = {
  pitch: 'Draft your elevator pitch. Even if it\'s rough, writing it down helps clarify your thinking.',
  spark: 'What problem are you trying to solve? Why does it matter to you personally?',
  validation: 'How will you validate this idea? Who will you talk to? What signals will convince you people want this?',
  audience: 'Who is your ideal first customer? Where do they hang out? How will you reach them?',
  proto: 'What will your MVP look like? What\'s the simplest version you could build to test the idea?',
  build: 'What tech stack are you considering? What are the key features for v1?',
  beta: 'How will you find beta testers? What feedback are you hoping to get?',
  gtm: 'What\'s your launch plan? Where will you announce? What\'s your pricing strategy?',
  launch: 'When do you plan to launch? What does success look like on day one?',
  first: 'How will you get your first paying customer? What will you charge?',
  channel: 'What acquisition channels will you try? Paid ads, content, partnerships, word of mouth?',
  trouble: 'What keeps you up at night? What could go wrong? Planning for trouble helps you avoid it.',
  money: 'What\'s your runway? Will you bootstrap or raise? What are your costs?',
  team: 'Will you build this solo or with others? What skills do you need to hire for?',
  scale: 'What will break first when you grow? What systems do you need to build?',
  next: 'Where is this heading? What\'s the big vision? What milestones are you aiming for?',
};

interface Clip {
  _id: string;
  questionSlug: string;
  title: string;
  playbackId: string;
  durationSec: number;
  transcriptStatus: 'pending' | 'ready' | 'failed';
  publishedAt?: string;
  createdAt: string;
}

interface Venture {
  _id: string;
  slug: string;
  name: string;
  pitch: string;
  brand: string;
  glyph: string;
  rung: Rung;
  country?: string;
  categories?: Industry[];
  problem?: string;
  who?: string;
  why?: string;
  segments: Record<string, { body: string; happenedAt?: string | null; isPlanned?: boolean }>;
  links: {
    site?: string;
    siteStatus?: string;
    ig?: string;
    x?: string;
    yt?: string;
    tiktok?: string;
    linkedin?: string;
    poster?: string;
  };
}

export default function EditVenturePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const segmentParam = searchParams.get('segment') as SegmentKey | null;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [venture, setVenture] = useState<Venture | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basics' | 'journey'>('basics');
  const [focusField, setFocusField] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<SegmentKey>(segmentParam || 'pitch');

  // Form state
  const [name, setName] = useState('');
  const [pitch, setPitch] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [categories, setCategories] = useState<Industry[]>([]);
  const [poster, setPoster] = useState<string | null>(null);
  const [problem, setProblem] = useState('');
  const [who, setWho] = useState('');
  const [why, setWhy] = useState('');
  const [rung, setRung] = useState<Rung>('idea');
  const [segmentBody, setSegmentBody] = useState('');
  const [segmentHappenedAt, setSegmentHappenedAt] = useState('');
  const [site, setSite] = useState('');
  const [ig, setIg] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [x, setX] = useState('');
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterStatus, setPosterStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [justSavedSegment, setJustSavedSegment] = useState<string | null>(null);
  const [segmentIsCompleted, setSegmentIsCompleted] = useState(true); // true = happened, false = planning

  // Track if basics form has unsaved changes
  const hasBasicsChanges = venture && (
    name !== venture.name ||
    pitch !== venture.pitch ||
    country !== (venture.country || null) ||
    JSON.stringify(categories) !== JSON.stringify(venture.categories || []) ||
    problem !== (venture.problem || '') ||
    who !== (venture.who || '') ||
    why !== (venture.why || '') ||
    rung !== venture.rung ||
    site !== (venture.links?.site || '') ||
    ig !== (venture.links?.ig || '') ||
    linkedin !== (venture.links?.linkedin || '') ||
    tiktok !== (venture.links?.tiktok || '') ||
    x !== (venture.links?.x || '')
  );

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      if (!user) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (segmentParam && SEGMENT_KEYS.includes(segmentParam as SegmentKey)) {
      setActiveTab('journey');
      setActiveSegment(segmentParam as SegmentKey);
    }
    // Check for field focus from URL
    const field = searchParams.get('field');
    if (field) {
      setFocusField(field);
      // Clear focus after a delay
      setTimeout(() => setFocusField(null), 3000);
    }
  }, [segmentParam, searchParams]);

  useEffect(() => {
    async function loadVenture() {
      try {
        // Fetch all user's ventures
        const res = await fetch('/api/ventures');
        const data = await res.json();

        // Find the venture matching the slug from the URL
        const matchingVenture = data.ventures?.find(
          (v: Venture) => v.slug === slug
        );

        if (matchingVenture) {
          setVenture(matchingVenture);
          setName(matchingVenture.name);
          setPitch(matchingVenture.pitch);
          setCountry(matchingVenture.country || null);
          setCategories(matchingVenture.categories || []);
          setPoster(matchingVenture.links?.poster || null);
          setProblem(matchingVenture.problem || '');
          setWho(matchingVenture.who || '');
          setWhy(matchingVenture.why || '');
          setRung(matchingVenture.rung);
          setSite(matchingVenture.links?.site || '');
          setIg(matchingVenture.links?.ig || '');
          setLinkedin(matchingVenture.links?.linkedin || '');
          setTiktok(matchingVenture.links?.tiktok || '');
          setX(matchingVenture.links?.x || '');
        } else {
          // User doesn't own this venture or it doesn't exist
          router.push('/dashboard');
        }
      } catch {
        console.error('Failed to load venture');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated === true && slug) {
      loadVenture();
    }
  }, [isAuthenticated, router, slug]);

  useEffect(() => {
    // Pitch and Spark don't have planning option - always "completed" mode
    const isRequiredSegment = activeSegment === 'pitch' || activeSegment === 'spark';

    if (venture?.segments?.[activeSegment]) {
      const segment = venture.segments[activeSegment];
      setSegmentBody(segment.body || '');
      // Default to today if no date set
      setSegmentHappenedAt(segment.happenedAt || new Date().toISOString().split('T')[0]);
      // Check if this is marked as a plan (isPlanned flag)
      // Required segments are always "completed" mode
      setSegmentIsCompleted(isRequiredSegment ? true : segment.isPlanned !== true);
    } else {
      setSegmentBody('');
      setSegmentHappenedAt(new Date().toISOString().split('T')[0]);
      // Default to planning mode for optional segments, completed for required
      setSegmentIsCompleted(isRequiredSegment ? true : false);
    }
  }, [activeSegment, venture]);

  const fetchClips = useCallback(async () => {
    if (!venture?._id) return;
    try {
      const res = await fetch(`/api/ventures/${venture._id}/clips`);
      if (res.ok) {
        const data = await res.json();
        setClips(data.clips || []);
      }
    } catch {
      console.error('Failed to load clips');
    }
  }, [venture?._id]);

  useEffect(() => {
    if (activeTab === 'journey' && venture?._id) {
      fetchClips();
    }
  }, [activeTab, venture?._id, fetchClips]);

  const handleSaveBasics = async () => {
    if (!venture) return;
    setSaving(true);
    setSaveSuccess(null);

    try {
      // Helper to normalize URLs - ensure they have https:// prefix
      const normalizeUrl = (url: string | undefined): string | undefined => {
        if (!url || url.trim() === '') return undefined;
        const trimmed = url.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return trimmed;
        }
        return `https://${trimmed}`;
      };

      const updateData: Record<string, unknown> = { name, pitch, country, categories, problem, who, why, rung };

      // Always update links to include social links (with normalized URLs)
      updateData.links = {
        ...venture.links,
        poster,
        site: normalizeUrl(site),
        ig: normalizeUrl(ig),
        linkedin: normalizeUrl(linkedin),
        tiktok: normalizeUrl(tiktok),
        x: normalizeUrl(x),
      };

      const res = await fetch(`/api/ventures/${venture._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        setVenture({
          ...venture,
          name,
          pitch,
          country: country || undefined,
          categories,
          problem,
          who,
          why,
          rung,
          links: {
            ...venture.links,
            poster: poster || undefined,
            site: site || undefined,
            ig: ig || undefined,
            linkedin: linkedin || undefined,
            tiktok: tiktok || undefined,
            x: x || undefined,
          }
        });
        setSaveSuccess('Changes saved');
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    } catch {
      console.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

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

  // Handle poster image upload - auto-saves immediately
  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !venture) return;

    // Check file size (max 5MB original)
    if (file.size > 5 * 1024 * 1024) {
      setPosterStatus({ type: 'error', message: 'Image must be under 5MB' });
      setTimeout(() => setPosterStatus(null), 5000);
      return;
    }

    setUploadingPoster(true);
    setPosterStatus(null);

    try {
      // Compress image to max 1200px wide, 0.8 quality
      const compressedImage = await compressImage(file, 1200, 0.8);

      // Auto-save to API
      const res = await fetch(`/api/ventures/${venture._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: { ...venture.links, poster: compressedImage }
        }),
      });

      if (res.ok) {
        setPoster(compressedImage);
        setVenture({
          ...venture,
          links: { ...venture.links, poster: compressedImage }
        });
        setPosterStatus({ type: 'success', message: 'Cover image saved' });
        setTimeout(() => setPosterStatus(null), 3000);
      } else {
        setPosterStatus({ type: 'error', message: 'Failed to save image. Try a smaller file.' });
        setTimeout(() => setPosterStatus(null), 5000);
      }
    } catch {
      setPosterStatus({ type: 'error', message: 'Failed to process image' });
      setTimeout(() => setPosterStatus(null), 5000);
    } finally {
      setUploadingPoster(false);
    }
  };

  // Handle poster removal
  const handleRemovePoster = async () => {
    if (!venture) return;

    setUploadingPoster(true);
    setPosterStatus(null);

    try {
      const res = await fetch(`/api/ventures/${venture._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: { ...venture.links, poster: null }
        }),
      });

      if (res.ok) {
        setPoster(null);
        setVenture({
          ...venture,
          links: { ...venture.links, poster: undefined }
        });
        setPosterStatus({ type: 'success', message: 'Cover image removed' });
        setTimeout(() => setPosterStatus(null), 3000);
      } else {
        setPosterStatus({ type: 'error', message: 'Failed to remove image' });
      }
    } catch {
      setPosterStatus({ type: 'error', message: 'Failed to remove image' });
    } finally {
      setUploadingPoster(false);
    }
  };

  // Calculate completion based on current form state
  const getCompletion = useCallback(() => {
    if (!venture) return null;

    // Build a venture-like object with current form state
    const currentState = {
      name,
      pitch,
      segments: venture.segments,
      links: { ...venture.links, poster: poster || undefined },
    };

    return calculateCompletion(currentState);
  }, [venture, name, pitch, poster]);

  const completion = getCompletion();

  // Handle clicking on a checklist item - scroll to and highlight field
  const handleChecklistItemClick = (key: keyof PublishingRequirements) => {
    setShowChecklist(false);

    const field = REQUIREMENT_ACTIONS[key].field;

    // For journey items, switch to journey tab and select segment
    if (key === 'hasElevatorPitch') {
      setActiveTab('journey');
      setActiveSegment('pitch');
      return;
    }
    if (key === 'hasSparkStory') {
      setActiveTab('journey');
      setActiveSegment('spark');
      return;
    }

    // For basics items, switch to basics tab and highlight field
    setActiveTab('basics');

    // Map requirement key to field id
    const fieldIdMap: Record<string, string> = {
      poster: 'field-poster',
      name: 'field-name',
      pitch: 'field-pitch',
    };

    const fieldId = fieldIdMap[field];
    if (fieldId) {
      // Set focus field for highlighting
      setFocusField(field);
      setTimeout(() => setFocusField(null), 3000);

      // Scroll to field
      setTimeout(() => {
        const element = document.getElementById(fieldId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleSaveSegment = async () => {
    if (!venture) return;
    setSaving(true);
    setSaveSuccess(null);

    try {
      const segmentData = {
        body: segmentBody,
        happenedAt: segmentIsCompleted ? segmentHappenedAt : null,
        isPlanned: !segmentIsCompleted,
      };

      const res = await fetch(`/api/ventures/${venture._id}/segments/${activeSegment}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segmentData),
      });

      if (res.ok) {
        setVenture({
          ...venture,
          segments: {
            ...venture.segments,
            [activeSegment]: segmentData,
          },
        });
        setSaveSuccess('Segment saved');
        // Flash the segment in sidebar
        setJustSavedSegment(activeSegment);
        setTimeout(() => {
          setSaveSuccess(null);
          setJustSavedSegment(null);
        }, 3000);
      }
    } catch {
      console.error('Failed to save segment');
    } finally {
      setSaving(false);
    }
  };

  if (loading || isAuthenticated === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-ink-2">Loading...</div>
      </main>
    );
  }

  if (!venture) {
    return null;
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="bg-page border-b border-rule px-6 py-4">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/v/${slug}`} className="text-ink-2 hover:text-ink">
              ← Back to venture
            </Link>
            <span className="text-rule-2">|</span>
            <h1 className="font-semibold">{venture.name}</h1>
          </div>
          <Link
            href={`/v/${venture.slug}`}
            className="text-[13px] text-ink-2 hover:text-ink"
          >
            Preview
          </Link>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 py-8">
        {/* Tabs with Progress Ring */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1 bg-soft rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('basics')}
              className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
                activeTab === 'basics'
                  ? 'bg-page shadow-sm text-ink'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              Basics
            </button>
            <button
              onClick={() => setActiveTab('journey')}
              className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
                activeTab === 'journey'
                  ? 'bg-page shadow-sm text-ink'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              Your Journey
            </button>
          </div>

          {/* Progress Ring - floating right */}
          {completion && (
            <button
              onClick={() => setShowChecklist(true)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <ProgressRingCompact percentage={completion.percentage} />
              <span className="text-[13px] font-medium text-ink-2">
                {completion.percentage}% complete
              </span>
            </button>
          )}
        </div>

        {/* Save success toast */}
        {saveSuccess && (
          <div className="fixed top-20 right-6 z-50 bg-go text-[#00301E] px-4 py-2 rounded-lg shadow-lg text-[14px] font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {saveSuccess}
          </div>
        )}

        {activeTab === 'basics' && (
          <div className="bg-page border border-rule rounded-xl p-6 max-w-[600px]">
            <h2 className="text-[20px] font-bold mb-6">Basic info</h2>

            <div className="space-y-5">
              {/* Cover Image */}
              <div id="field-poster" className={`p-3 -m-3 rounded-xl transition-colors ${focusField === 'poster' ? 'bg-go-tint ring-2 ring-go' : ''}`}>
                <label className="block text-[13px] font-medium mb-2">
                  Cover image
                  <span className="text-ink-3 font-normal ml-2">Required</span>
                </label>
                <p className="text-[12px] text-ink-3 mb-3">
                  This appears at the top of your venture page and in cards across the site.
                </p>
                {poster ? (
                  <div className="relative">
                    <img
                      src={poster}
                      alt="Cover"
                      className="w-full h-40 object-cover rounded-xl border border-rule"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      disabled={uploadingPoster}
                      className="absolute top-2 right-2 p-1.5 bg-dead text-white rounded-full hover:bg-dead/90 disabled:opacity-50"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className={`block w-full py-8 border-2 border-dashed border-rule rounded-xl text-center transition-colors ${uploadingPoster ? '' : 'hover:border-ink/30 cursor-pointer'}`}>
                    {uploadingPoster ? (
                      <div className="flex items-center justify-center gap-2 text-ink-2">
                        <div className="w-5 h-5 border-2 border-go border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </div>
                    ) : (
                      <>
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="mx-auto mb-2 text-ink-3"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="text-[13px] text-ink-2">Click to upload cover image</span>
                        <span className="block text-[11px] text-ink-3 mt-1">Max 2MB, recommended 1200x600px</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      disabled={uploadingPoster}
                      className="hidden"
                    />
                  </label>
                )}
                {/* Status message */}
                {posterStatus && (
                  <div className={`mt-3 flex items-center gap-2 text-[13px] ${
                    posterStatus.type === 'success' ? 'text-go-deep' : 'text-dead'
                  }`}>
                    {posterStatus.type === 'success' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    )}
                    {posterStatus.message}
                  </div>
                )}
              </div>

              <div id="field-name" className={`p-3 -m-3 rounded-xl transition-colors ${focusField === 'name' ? 'bg-go-tint ring-2 ring-go' : ''}`}>
                <label className="block text-[13px] font-medium mb-2">
                  Venture name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus={focusField === 'name'}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
              </div>

              <div id="field-pitch" className={`p-3 -m-3 rounded-xl transition-colors ${focusField === 'pitch' ? 'bg-go-tint ring-2 ring-go' : ''}`}>
                <label className="block text-[13px] font-medium mb-2">
                  One-line pitch
                </label>
                <input
                  type="text"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  autoFocus={focusField === 'pitch'}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
              </div>

              <div id="field-country" className={`p-3 -m-3 rounded-xl transition-colors ${focusField === 'country' ? 'bg-go-tint ring-2 ring-go' : ''}`}>
                <label className="block text-[13px] font-medium mb-2">
                  Where are you based?
                </label>
                <CountrySelector
                  value={country}
                  onChange={setCountry}
                  placeholder="Select a country"
                />
              </div>

              <div id="field-industry" className={`p-3 -m-3 rounded-xl transition-colors ${focusField === 'industry' ? 'bg-go-tint ring-2 ring-go' : ''}`}>
                <label className="block text-[13px] font-medium mb-2">
                  Industry / Categories
                  <span className="text-ink-3 font-normal ml-1">(select up to 3)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.filter(i => i !== 'other').map((industry) => {
                    const isSelected = categories.includes(industry);
                    const isDisabled = !isSelected && categories.length >= 3;
                    return (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setCategories(categories.filter(c => c !== industry));
                          } else if (categories.length < 3) {
                            setCategories([...categories, industry]);
                          }
                        }}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                          isSelected
                            ? 'bg-heat text-white'
                            : isDisabled
                            ? 'bg-rule text-ink-3 cursor-not-allowed'
                            : 'bg-soft text-ink hover:bg-rule'
                        }`}
                      >
                        {INDUSTRY_LABELS[industry]}
                      </button>
                    );
                  })}
                </div>
                {categories.length === 0 && (
                  <p className="text-[11px] text-ink-3 mt-2">
                    Select at least one industry to help visitors find your venture
                  </p>
                )}
              </div>

              <div id="field-category" className={`p-3 -m-3 rounded-xl transition-colors ${focusField === 'category' ? 'bg-go-tint ring-2 ring-go' : ''}`}>
                <label className="block text-[13px] font-medium mb-2">
                  Current stage
                </label>
                <select
                  value={rung}
                  onChange={(e) => setRung(e.target.value as Rung)}
                  autoFocus={focusField === 'category'}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                >
                  {RUNGS.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div id="field-problem" className={`p-3 -m-3 rounded-xl transition-colors ${focusField === 'problem' ? 'bg-go-tint ring-2 ring-go' : ''}`}>
                <label className="block text-[13px] font-medium mb-2">
                  The problem you&apos;re solving
                </label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  autoFocus={focusField === 'problem'}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none"
                />
              </div>

              <div id="field-who" className={`p-3 -m-3 rounded-xl transition-colors ${focusField === 'who' ? 'bg-go-tint ring-2 ring-go' : ''}`}>
                <label className="block text-[13px] font-medium mb-2">
                  Who it&apos;s for
                </label>
                <textarea
                  value={who}
                  onChange={(e) => setWho(e.target.value)}
                  autoFocus={focusField === 'who'}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none"
                />
              </div>

              <div id="field-why" className={`p-3 -m-3 rounded-xl transition-colors ${focusField === 'why' ? 'bg-go-tint ring-2 ring-go' : ''}`}>
                <label className="block text-[13px] font-medium mb-2">
                  Why you&apos;re building this
                </label>
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  autoFocus={focusField === 'why'}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none"
                />
              </div>

              {/* Social Links */}
              <div className="pt-4 mt-4 border-t border-rule">
                <h3 className="text-[15px] font-semibold mb-4">Links &amp; Social</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      placeholder="https://yourapp.com"
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={ig}
                      onChange={(e) => setIg(e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      TikTok
                    </label>
                    <input
                      type="url"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="https://tiktok.com/@yourhandle"
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      X / Twitter
                    </label>
                    <input
                      type="url"
                      value={x}
                      onChange={(e) => setX(e.target.value)}
                      placeholder="https://x.com/yourhandle"
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveBasics}
              disabled={saving || !hasBasicsChanges}
              className={`mt-6 font-semibold px-6 py-2.5 rounded-full text-[14px] transition-colors ${
                hasBasicsChanges
                  ? 'bg-ink text-white hover:bg-[#2a2a2a]'
                  : 'bg-rule text-ink-3 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}

        {activeTab === 'journey' && (
          <div className="flex gap-6">
            {/* Segment list */}
            <div className="w-[240px] shrink-0">
              <div className="bg-page border border-rule rounded-xl p-3 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {Object.entries(SEGMENT_PHASES).map(([phaseKey, phase]) => (
                  <div key={phaseKey} className={phaseKey !== 'required' ? 'pt-3 mt-2 border-t border-rule' : ''}>
                    {/* Phase header */}
                    <div className={`px-3 py-1.5 ${phaseKey === 'required' ? 'bg-go-tint rounded-lg mb-1' : ''}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        phaseKey === 'required' ? 'text-go-deep' : 'text-ink-3'
                      }`}>
                        {phaseKey === 'required' && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                        )}
                        {phase.label}
                      </div>
                      <div className="text-[10px] text-ink-3 mt-0.5">{phase.description}</div>
                    </div>

                    {/* Segments in this phase */}
                    {phase.segments.map((key) => {
                      const segmentKey = key as SegmentKey;
                      const segment = venture.segments?.[segmentKey];
                      const hasContent = segment?.body;
                      const isPlanned = segment?.isPlanned === true;
                      const question = QUESTIONS.find((q) => q.seg === segmentKey);
                      const hasClip = question && clips.some((c) => c.questionSlug === question.slug);
                      const isRequired = REQUIRED_SEGMENTS.includes(key);
                      const wasJustSaved = justSavedSegment === segmentKey;

                      return (
                        <button
                          key={key}
                          onClick={() => setActiveSegment(segmentKey)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2 ${
                            wasJustSaved
                              ? 'bg-go text-white animate-pulse ring-2 ring-go ring-offset-2'
                              : activeSegment === segmentKey
                              ? 'bg-ink text-white'
                              : hasContent && !isPlanned
                              ? 'text-go-deep hover:bg-go-tint'
                              : hasContent && isPlanned
                              ? 'text-heat hover:bg-heat-tint'
                              : 'text-ink-2 hover:bg-soft'
                          }`}
                        >
                          <span className="flex-1 flex items-center gap-1.5">
                            {SEGMENT_LABELS[segmentKey]}
                            {isRequired && !hasContent && (
                              <span className="text-[9px] bg-go-tint text-go-deep px-1 py-0.5 rounded font-medium">
                                Required
                              </span>
                            )}
                          </span>
                          {hasContent && activeSegment !== segmentKey && !isPlanned && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-go">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                          {hasContent && activeSegment !== segmentKey && isPlanned && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-heat">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          )}
                          {hasClip && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={activeSegment === segmentKey ? 'text-white' : 'text-heat'}>
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Segment editor with video */}
            <div className="flex-1 space-y-6">
              {/* Written segment */}
              <div className="bg-page border border-rule rounded-xl p-6">
                <h2 className="text-[20px] font-bold mb-2">
                  {SEGMENT_LABELS[activeSegment]}
                </h2>

                {/* Toggle: Has this happened or planning? - Only show for optional segments */}
                {activeSegment !== 'pitch' && activeSegment !== 'spark' && (
                  <div className="mb-4 p-4 bg-soft rounded-xl border border-rule">
                    <p className="text-[13px] font-medium text-ink mb-3">Has this stage been completed?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSegmentIsCompleted(true)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-[13px] font-medium transition-all ${
                          segmentIsCompleted
                            ? 'bg-go text-white'
                            : 'bg-page border border-rule text-ink-2 hover:border-ink-3'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          Yes, this happened
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSegmentIsCompleted(false)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-[13px] font-medium transition-all ${
                          !segmentIsCompleted
                            ? 'bg-heat text-white'
                            : 'bg-page border border-rule text-ink-2 hover:border-ink-3'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          Not yet — planning
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Show different prompt based on status */}
                <p className="text-ink-2 text-[14px] mb-4">
                  {segmentIsCompleted ? SEGMENT_PROMPTS[activeSegment] : PLAN_PROMPTS[activeSegment]}
                </p>

                {/* Date picker - only show if completed */}
                {segmentIsCompleted && (
                  <div className="mb-4 p-3 bg-go-tint/50 rounded-lg border border-go/20">
                    <label className="block text-[12px] font-semibold text-go-deep mb-1.5">
                      When did this happen?
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="date"
                        value={segmentHappenedAt}
                        onChange={(e) => setSegmentHappenedAt(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="px-3 py-2 rounded-lg border border-rule bg-page text-[14px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setSegmentHappenedAt(new Date().toISOString().split('T')[0])}
                        className="text-[12px] text-go-deep hover:underline"
                      >
                        Set to today
                      </button>
                    </div>
                  </div>
                )}

                {/* Planning encouragement */}
                {!segmentIsCompleted && (
                  <div className="mb-4 p-3 bg-heat-tint rounded-lg border border-heat/20">
                    <p className="text-[12px] text-heat font-medium flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      Share your plan — the community can help you succeed
                    </p>
                  </div>
                )}

                <textarea
                  value={segmentBody}
                  onChange={(e) => setSegmentBody(e.target.value)}
                  rows={8}
                  placeholder={segmentIsCompleted ? "Write your story here..." : "Share your plan, strategy, or questions for the community..."}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none"
                />

                <div className="flex items-center justify-between mt-4">
                  <span className="text-[12px] text-ink-3">
                    {segmentBody.length} characters
                  </span>
                  <div className="flex items-center gap-3">
                    {saveSuccess && activeTab === 'journey' && (
                      <span className="text-[13px] text-go-deep font-medium flex items-center gap-1.5 animate-pulse">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        {saveSuccess}
                      </span>
                    )}
                    <button
                      onClick={handleSaveSegment}
                      disabled={saving}
                      className="bg-go text-[#00301E] font-semibold px-6 py-2.5 rounded-full text-[14px] hover:bg-[#04B76B] disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save segment'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Video clip for this segment */}
              {(() => {
                const question = QUESTIONS.find((q) => q.seg === activeSegment);
                if (!question) return null;

                const existingClip = clips.find((c) => c.questionSlug === question.slug);

                return (
                  <div className="bg-page border border-rule rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-heat">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <h3 className="text-[16px] font-bold">Video Clip</h3>
                      <span className="text-[11px] bg-heat-tint text-heat px-2 py-0.5 rounded-full font-medium">Optional</span>
                    </div>
                    <p className="text-ink-2 text-[14px] mb-4">
                      <span className="font-medium text-ink">&ldquo;{question.q}&rdquo;</span>
                      <br />
                      <span className="text-[13px]">Record a short video (under 60 seconds) to bring this story to life.</span>
                    </p>

                    {existingClip ? (
                      <div className="space-y-4">
                        <VideoPlayer
                          playbackId={existingClip.playbackId}
                          title={existingClip.title}
                        />
                        <div className="flex items-center justify-between">
                          <div className="text-[13px] text-ink-2">
                            {Math.floor(existingClip.durationSec / 60)}:{String(existingClip.durationSec % 60).padStart(2, '0')} ·
                            {existingClip.transcriptStatus === 'ready' && ' Transcript ready'}
                            {existingClip.transcriptStatus === 'pending' && ' Transcribing...'}
                            {existingClip.transcriptStatus === 'failed' && ' Transcript failed'}
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={async () => {
                                if (!confirm('Delete this video?')) return;
                                try {
                                  const res = await fetch(`/api/clips/${existingClip._id}`, {
                                    method: 'DELETE',
                                  });
                                  if (res.ok) {
                                    fetchClips();
                                  }
                                } catch {
                                  console.error('Failed to delete');
                                }
                              }}
                              className="text-[13px] text-dead hover:text-[#8a2a1f]"
                            >
                              Delete
                            </button>
                            {existingClip.publishedAt ? (
                              <span className="text-[13px] text-go-deep">Published</span>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/clips/${existingClip._id}/publish`, {
                                      method: 'POST',
                                    });
                                    if (res.ok) {
                                      fetchClips();
                                    }
                                  } catch {
                                    console.error('Failed to publish');
                                  }
                                }}
                                className="text-[13px] text-go-deep hover:text-go font-medium"
                              >
                                Publish
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <VideoUploader
                        questionSlug={question.slug}
                        onUploadComplete={() => {
                          setTimeout(() => fetchClips(), 3000);
                        }}
                      />
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Completion Checklist Modal */}
      {showChecklist && completion && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4" onClick={() => setShowChecklist(false)}>
          <div
            className="bg-page rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-rule">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold">Complete Your Venture</h2>
                <button
                  onClick={() => setShowChecklist(false)}
                  className="text-ink-3 hover:text-ink p-1"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-[14px] text-ink-2 mt-2">
                {completion.isComplete
                  ? 'Your venture is ready to publish!'
                  : `${completion.percentage}% complete — finish these items to go live.`}
              </p>
            </div>

            {/* Requirements */}
            <div className="p-6 space-y-3">
              {/* Basics Section */}
              <h3 className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-3">
                Basics
              </h3>
              {(['hasName', 'hasPitch', 'hasCoverImage'] as const).map((key) => {
                const met = completion.requirements[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleChecklistItemClick(key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                      met ? 'bg-go-tint' : 'bg-soft hover:bg-rule'
                    }`}
                  >
                    {met ? (
                      <div className="w-6 h-6 rounded-full bg-go flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-ink-3 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[14px] font-medium ${met ? 'text-go-deep' : 'text-ink'}`}>
                        {REQUIREMENT_LABELS[key]}
                      </div>
                      {!met && (
                        <div className="text-[12px] text-ink-3 truncate">
                          {REQUIREMENT_ACTIONS[key].action}
                        </div>
                      )}
                    </div>
                    {!met && (
                      <span className="text-[12px] font-semibold text-go-deep flex-shrink-0">
                        Add →
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Journey Section */}
              <div className="pt-4 mt-4 border-t border-rule">
                <h3 className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-3">
                  Your Journey
                </h3>
                {(['hasElevatorPitch', 'hasSparkStory'] as const).map((key) => {
                  const met = completion.requirements[key];
                  return (
                    <button
                      key={key}
                      onClick={() => handleChecklistItemClick(key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors mb-2 ${
                        met ? 'bg-go-tint' : 'bg-soft hover:bg-rule'
                      }`}
                    >
                      {met ? (
                        <div className="w-6 h-6 rounded-full bg-go flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-ink-3 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`text-[14px] font-medium ${met ? 'text-go-deep' : 'text-ink'}`}>
                          {REQUIREMENT_LABELS[key]}
                        </div>
                        {!met && (
                          <div className="text-[12px] text-ink-3 truncate">
                            {REQUIREMENT_ACTIONS[key].action}
                          </div>
                        )}
                      </div>
                      {!met && (
                        <span className="text-[12px] font-semibold text-go-deep flex-shrink-0">
                          Add →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Optional: Pitch Video */}
              <div className="pt-4 mt-4 border-t border-rule">
                <h3 className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-3">
                  Recommended
                </h3>

                <button
                  onClick={() => {
                    setShowChecklist(false);
                    setActiveTab('journey');
                    setActiveSegment('pitch');
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    completion.requirements.hasPitchVideo ? 'bg-heat-tint' : 'bg-soft hover:bg-rule'
                  }`}
                >
                  {completion.requirements.hasPitchVideo ? (
                    <div className="w-6 h-6 rounded-full bg-heat flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-ink-3 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[14px] font-medium ${completion.requirements.hasPitchVideo ? 'text-heat' : 'text-ink'}`}>
                        Pitch video
                      </span>
                      <span className="text-[10px] bg-heat-tint text-heat px-1.5 py-0.5 rounded font-medium">
                        Optional
                      </span>
                    </div>
                    {!completion.requirements.hasPitchVideo && (
                      <div className="text-[12px] text-ink-3">
                        30-60 seconds brings your story to life
                      </div>
                    )}
                  </div>
                  {!completion.requirements.hasPitchVideo && (
                    <span className="text-[12px] font-semibold text-heat flex-shrink-0">
                      Record →
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-rule bg-soft/50">
              <button
                onClick={() => setShowChecklist(false)}
                className="w-full py-3 px-6 border border-rule rounded-full text-[14px] font-semibold hover:bg-soft transition-colors"
              >
                Continue editing
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
