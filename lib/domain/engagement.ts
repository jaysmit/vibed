// Engagement score calculation - can be used on server or client

export interface EngagementItem {
  key: string;
  label: string;
  description: string;
  points: number;
  earned: number;
  maxPoints: number;
  action?: string;
  actionPath?: string;
}

export interface EngagementData {
  segmentsWithContent: number;
  totalSegments: number;
  clipsCount: number;
  hasPromise: boolean;
  promisesKept: number;
  followersCount: number;
  hasWebsite: boolean;
  hasPoster: boolean;
  teamSize: number;
}

export function calculateEngagementItems(
  ventureSlug: string,
  data: EngagementData
): { items: EngagementItem[]; totalScore: number; maxScore: number } {
  const items: EngagementItem[] = [
    // High priority: Link to your website - drives traffic and credibility
    {
      key: 'website',
      label: 'Link your website',
      description: data.hasWebsite
        ? 'Website linked - visitors can find you'
        : 'Drive traffic to your product and build credibility',
      points: 15,
      earned: data.hasWebsite ? 15 : 0,
      maxPoints: 15,
      action: data.hasWebsite ? undefined : 'Add link',
      actionPath: `/v/${ventureSlug}/edit?tab=settings`,
    },
    {
      key: 'segments',
      label: 'Tell your story',
      description: `Write about your journey (${data.segmentsWithContent}/${data.totalSegments} segments)`,
      points: 5,
      earned: Math.min(data.segmentsWithContent * 5, 40),
      maxPoints: 40,
      action: 'Write',
      actionPath: `/v/${ventureSlug}/edit?tab=journey`,
    },
    {
      key: 'clips',
      label: 'Add video clips',
      description: data.clipsCount > 0
        ? `${data.clipsCount} clips recorded`
        : 'Record short videos to bring your story to life',
      points: 10,
      earned: Math.min(data.clipsCount * 10, 30),
      maxPoints: 30,
      action: data.clipsCount < 3 ? 'Record' : undefined,
      actionPath: `/v/${ventureSlug}/edit?tab=clips`,
    },
    {
      key: 'promise',
      label: 'Set a goal',
      description: data.hasPromise
        ? 'You have an active goal'
        : 'Public goals keep you accountable',
      points: 10,
      earned: data.hasPromise ? 10 : 0,
      maxPoints: 10,
      action: data.hasPromise ? undefined : 'Set goal',
      actionPath: `/v/${ventureSlug}/edit?tab=promise`,
    },
    {
      key: 'promises-kept',
      label: 'Keep promises',
      description: `${data.promisesKept} promises kept`,
      points: 5,
      earned: Math.min(data.promisesKept * 5, 15),
      maxPoints: 15,
    },
    {
      key: 'poster',
      label: 'Add cover image',
      description: data.hasPoster
        ? 'Cover image set'
        : 'Make your venture stand out',
      points: 5,
      earned: data.hasPoster ? 5 : 0,
      maxPoints: 5,
      action: data.hasPoster ? undefined : 'Add',
      actionPath: `/v/${ventureSlug}/edit?tab=settings`,
    },
  ];

  const totalScore = items.reduce((sum, item) => sum + item.earned, 0);
  const maxScore = items.reduce((sum, item) => sum + item.maxPoints, 0);

  return { items, totalScore, maxScore };
}
