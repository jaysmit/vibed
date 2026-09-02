import { emailLayout } from './layout';

export interface FounderNudgeData {
  founderName: string;
  ventureName: string;
  ventureSlug: string;
  daysSinceUpdate: number;
  followers: number;
  suggestedAction: 'segment' | 'clip' | 'promise';
  currentRung: string;
  nextSegment?: string;
}

function getSuggestedActionContent(data: FounderNudgeData): { title: string; description: string; cta: string } {
  switch (data.suggestedAction) {
    case 'clip':
      return {
        title: 'Record a quick update',
        description: 'Your followers would love to hear what you\'ve been working on. A 30-second video goes a long way.',
        cta: 'Record a clip',
      };
    case 'promise':
      return {
        title: 'Make a public promise',
        description: 'Set a deadline for yourself. Founders who make promises get 3x more engagement.',
        cta: 'Make a promise',
      };
    case 'segment':
    default:
      return {
        title: data.nextSegment ? `Write about: ${data.nextSegment}` : 'Continue your story',
        description: 'Your journey has more chapters. Document what\'s happening right now.',
        cta: 'Update your venture',
      };
  }
}

export function founderNudgeEmail(data: FounderNudgeData): { html: string; text: string; subject: string } {
  const { founderName, ventureName, ventureSlug, daysSinceUpdate, followers } = data;
  const action = getSuggestedActionContent(data);

  const content = `
    <div class="card">
      <h1 style="font-size: 22px; margin-bottom: 8px;">Hey ${founderName}</h1>
      <p style="font-size: 15px;">
        It's been ${daysSinceUpdate} days since you last updated <strong>${ventureName}</strong>.
        ${followers > 0 ? `Your ${followers} follower${followers > 1 ? 's are' : ' is'} waiting to hear from you.` : 'Start building your audience by sharing your progress.'}
      </p>
    </div>

    <div class="card" style="background: #F8F8F6;">
      <h2 style="font-size: 18px; margin-bottom: 8px;">${action.title}</h2>
      <p>${action.description}</p>
      <a href="https://vibed.app/v/${ventureSlug}/edit" class="btn" style="margin-top: 8px;">${action.cta}</a>
    </div>

    <div class="card">
      <h3 style="font-size: 16px; margin-bottom: 12px;">Why update regularly?</h3>
      <ul style="margin: 0; padding-left: 20px; color: #565656;">
        <li style="margin-bottom: 8px;">Followers get notified and engage with your progress</li>
        <li style="margin-bottom: 8px;">Your venture ranks higher in Discover</li>
        <li style="margin-bottom: 8px;">You build a documented history of your journey</li>
        <li>It keeps you accountable to your goals</li>
      </ul>
    </div>

    <div style="text-align: center; padding: 20px 0;">
      <p style="font-size: 13px; color: #8A8A8A;">
        Building something great takes time. We're here to help you share the journey.
      </p>
    </div>
  `;

  const html = emailLayout(content, `${ventureName} hasn't been updated in ${daysSinceUpdate} days`);

  const text = `
Hey ${founderName},

It's been ${daysSinceUpdate} days since you last updated ${ventureName}.
${followers > 0 ? `Your ${followers} follower${followers > 1 ? 's are' : ' is'} waiting to hear from you.` : ''}

${action.title}
${action.description}

Update your venture: https://vibed.app/v/${ventureSlug}/edit

Why update regularly?
- Followers get notified and engage with your progress
- Your venture ranks higher in Discover
- You build a documented history of your journey
- It keeps you accountable to your goals

---
Vibed — follow founders from week one
Manage preferences: https://vibed.app/settings
  `.trim();

  return {
    html,
    text,
    subject: `${ventureName} misses you`,
  };
}
