import { emailLayout } from './layout';

export interface DigestVenture {
  name: string;
  slug: string;
  pitch: string;
  rung: string;
  rungChanged?: boolean;
  promiseKept?: boolean;
  promiseMissed?: boolean;
  newClips?: number;
}

export interface WeeklyDigestData {
  recipientName: string;
  weekNumber: number;
  followedVentures: DigestVenture[];
  trendingVentures: DigestVenture[];
  promiseUpdates: { venture: DigestVenture; kept: boolean }[];
}

function getRungLabel(rung: string): string {
  const labels: Record<string, string> = {
    idea: 'Idea',
    building: 'Building',
    live: 'Live',
    first: 'First Dollar',
    growing: 'Growing',
    alumni: 'Alumni',
  };
  return labels[rung] || rung;
}

function renderVentureCard(v: DigestVenture): string {
  const tags: string[] = [];
  if (v.rungChanged) tags.push(`<span class="tag tag-go">Advanced to ${getRungLabel(v.rung)}</span>`);
  if (v.promiseKept) tags.push('<span class="tag tag-go">Promise kept</span>');
  if (v.promiseMissed) tags.push('<span class="tag tag-warn">Promise missed</span>');
  if (v.newClips) tags.push(`<span class="tag tag-heat">${v.newClips} new clip${v.newClips > 1 ? 's' : ''}</span>`);

  return `
    <div class="venture-card">
      <div class="venture-name">${v.name}</div>
      <div class="venture-pitch">${v.pitch}</div>
      ${tags.length > 0 ? `<div style="margin-top: 8px;">${tags.join(' ')}</div>` : ''}
      <a href="https://vibed.app/v/${v.slug}" style="display:inline-block;margin-top:10px;font-size:13px;color:#017A4C;font-weight:600;text-decoration:none;">View updates →</a>
    </div>
  `;
}

export function weeklyDigestEmail(data: WeeklyDigestData): { html: string; text: string; subject: string } {
  const { recipientName, weekNumber, followedVentures, trendingVentures, promiseUpdates } = data;

  const hasFollowed = followedVentures.length > 0;
  const hasTrending = trendingVentures.length > 0;
  const hasPromises = promiseUpdates.length > 0;

  let content = `
    <div class="card">
      <h1 style="font-size: 22px;">Week ${weekNumber} Digest</h1>
      <p>Hey ${recipientName}, here's what happened this week with the founders you follow.</p>
    </div>
  `;

  // Followed ventures updates
  if (hasFollowed) {
    content += `
      <div class="card">
        <h2 style="font-size: 18px; margin-bottom: 16px;">From ventures you follow</h2>
        ${followedVentures.map(renderVentureCard).join('')}
      </div>
    `;
  }

  // Promise updates
  if (hasPromises) {
    content += `
      <div class="card">
        <h2 style="font-size: 18px; margin-bottom: 16px;">Promise updates</h2>
        ${promiseUpdates.map(({ venture, kept }) => `
          <div class="venture-card">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span class="tag ${kept ? 'tag-go' : 'tag-warn'}">${kept ? 'Kept' : 'Missed'}</span>
              <span class="venture-name" style="margin:0;">${venture.name}</span>
            </div>
            <a href="https://vibed.app/v/${venture.slug}" style="font-size:13px;color:#017A4C;font-weight:600;text-decoration:none;">See their journey →</a>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Trending ventures
  if (hasTrending) {
    content += `
      <div class="card">
        <h2 style="font-size: 18px; margin-bottom: 16px;">Trending this week</h2>
        ${trendingVentures.map(renderVentureCard).join('')}
      </div>
    `;
  }

  // CTA
  content += `
    <div class="card" style="text-align: center;">
      <p style="margin-bottom: 16px;">Discover more founders building in public.</p>
      <a href="https://vibed.app/discover" class="btn">Explore ventures</a>
    </div>
  `;

  const html = emailLayout(content, `Week ${weekNumber}: Updates from ${followedVentures.length} ventures you follow`);

  // Plain text version
  const text = `
Week ${weekNumber} Digest

Hey ${recipientName}, here's what happened this week.

${hasFollowed ? `FROM VENTURES YOU FOLLOW:\n${followedVentures.map(v => `- ${v.name}: ${v.pitch}\n  https://vibed.app/v/${v.slug}`).join('\n')}\n\n` : ''}
${hasPromises ? `PROMISE UPDATES:\n${promiseUpdates.map(({ venture, kept }) => `- ${venture.name}: Promise ${kept ? 'kept' : 'missed'}`).join('\n')}\n\n` : ''}
${hasTrending ? `TRENDING THIS WEEK:\n${trendingVentures.map(v => `- ${v.name}: ${v.pitch}\n  https://vibed.app/v/${v.slug}`).join('\n')}\n\n` : ''}

Explore more: https://vibed.app/discover

---
Vibed — follow founders from week one
Manage preferences: https://vibed.app/settings
  `.trim();

  return {
    html,
    text,
    subject: `Week ${weekNumber}: ${followedVentures.length > 0 ? `${followedVentures.length} venture${followedVentures.length > 1 ? 's' : ''} updated` : 'Your weekly digest'}`,
  };
}
