import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import { connectDB } from '../lib/db/connect';
import { User, Founder, Venture, Clip, Event, EVENT_TYPES } from '../lib/db/models';

// Founders data from MVP
const FOUNDERS = {
  maya: {
    name: 'Maya Okonkwo',
    location: 'Lisbon',
    hue: '#1F6F5C',
    bio: 'Freelance agency producer for nine years. Building the thing that used to eat her Sunday nights.',
  },
  tom: {
    name: 'Tom Reilly',
    location: 'Cork',
    hue: '#B4621A',
    bio: 'Weekday nurse, weekend builder. First time making anything.',
  },
  priya: {
    name: 'Priya Raman',
    location: 'Melbourne',
    hue: '#5A2EC4',
    bio: 'Ran a café in Brunswick for six years. Sold it in 2024.',
  },
  dane: {
    name: 'Dane Wexler',
    location: 'Denver',
    hue: '#1A5C8A',
    bio: 'Two years in a van. Was a backend engineer before that.',
  },
  elena: {
    name: 'Elena Marsh',
    location: 'Auckland',
    hue: '#9A2A55',
    bio: 'Eleven years skippering charter boats. Learning to code in the evenings.',
  },
  sam: {
    name: 'Sam Idris',
    location: 'Manchester',
    hue: '#3D5A2B',
    bio: 'Built and sold Pocket Ledger. Still posts about what came after.',
  },
  noor: {
    name: 'Noor Haddad',
    location: 'Toronto',
    hue: '#8A5A1A',
    bio: 'Closed Tallow in June. Writing up everything that went wrong.',
  },
};

// Ventures data from MVP
const VENTURES = [
  {
    slug: 'slate',
    name: 'Slate',
    pitch: 'Turns voice notes into client-ready briefs',
    founderKey: 'maya',
    rung: 'first' as const,
    brand: '#1F6F5C',
    glyph: 'wave',
    week: 27,
    streak: 9,
    clips: 6,
    followers: 1284,
    media: 'video' as const,
    problem: 'Freelance producers record client calls and then lose two hours turning them into a written brief. Every project, every time.',
    who: 'Freelance and small-studio producers who take verbal briefs and have to write them up. Roughly forty thousand of them in the UK and US.',
    why: 'I did this job for nine years. I have written about six hundred of these briefs by hand.',
    promise: { text: 'Twenty paying users by 30 September', days: 39, span: 60 },
    links: { site: 'useslate.com', siteStatus: 'live' as const, x: 'mayaokonkwo', ig: 'slate.brief', tiktok: 'slatebrief' },
    segments: {
      pitch: { body: 'Slate turns a recorded client call into a written brief in about ninety seconds. You talk, it listens, and you get the deliverables list, the dates and the scope in the format producers actually use. It is not a summariser and it is not a note app. It is the two hours between the call and the brief, deleted.' },
      spark: { body: 'I recorded forty minutes of client notes on my phone and then spent two hours typing them into a brief. It was the third time that month. I remember sitting there thinking that this is not a hard problem, it is just that nobody has bothered. So I wrote the problem down properly instead of complaining about it for a fourth time. There was no lightning bolt and I think people wait for a better reason than the one they already have.' },
      validation: { body: 'I posted the problem, not the product, in two producer Slack groups I had been in for four years. Nine people replied and two asked when it would ship. I did not treat that as demand, because replies are not money, but it was enough to justify six weeks. I also called four people who said no, and those calls were more useful than the nine yeses.' },
      audience: { body: 'I started posting a Friday update in both groups whether or not anything had happened. Some weeks the update was that nothing worked. By the time I had something to show, forty people had been reading those updates for a month and eight volunteered to test it. Building the audience cost nothing and took longer than building the product.' },
      proto: { body: 'The first version was a form, a text area and one prompt. It took a weekend. It was genuinely embarrassing and I showed it to people anyway, which is the only reason the second version was any good.' },
      build: { body: 'Whisper for transcription, one prompt for structure, and then three months of getting the output format wrong. I built a summary first. It was accurate, well written and completely useless, because producers do not want a summary, they want the deliverables list first, then dates, then everything else. Rebuilding that template three times cost me about six weeks and it was the only work that mattered.' },
      beta: { body: 'Eight people testing free, with a Loom from me every Friday. Two stopped replying, which is its own kind of feedback and worth more than the polite ones who kept saying it was great.' },
      gtm: { body: 'No Kickstarter, no Product Hunt, no launch video. I decided the entire go-to-market was the two Slack groups plus whoever those people told. That is a small strategy and I keep being told it is not enough, which is probably true, but it got me to twelve customers without spending anything.' },
      launch: { body: 'I turned the free tier off for new signups and put a nineteen dollar price on it. Billing was not wired up because I did not think anyone would click it. Someone clicked it.' },
      first: { body: 'Rachel, one of the original nine. She messaged asking how to pay and I did not have a checkout page, so I sat up in bed at eleven at night and made a payment link on my phone. Nineteen dollars. Everything before that was me deciding it was worth doing. That was someone else deciding.' },
      channel: { body: 'Twelve paying and all of them from the same two rooms. I have not found a second channel and that is the entire problem right now. I have tried cold email, a directory listing and one guest post, and none of them produced a single signup.' },
    },
  },
  {
    slug: 'kettle',
    name: 'Kettle',
    pitch: 'Recipe costing for cafés that moves with supplier prices',
    founderKey: 'priya',
    rung: 'growing' as const,
    brand: '#B4451A',
    glyph: 'cup',
    week: 44,
    streak: 14,
    clips: 9,
    followers: 2910,
    media: 'video' as const,
    problem: 'Cafés set menu prices once and never revisit them, while supplier costs move every quarter. Most owners are selling at least one item at a loss without knowing.',
    who: 'Independent cafés with one to three sites. Owner-operators, not chains.',
    why: 'I ran one for six years and got this wrong for five months straight.',
    promise: { text: 'Hire my first contractor by 15 October', days: 54, span: 75 },
    links: { site: 'kettlecosting.com', siteStatus: 'live' as const, x: 'priyaraman', ig: 'kettle.costing', yt: 'kettlecosting' },
    segments: {},
  },
  {
    slug: 'northbound',
    name: 'Northbound',
    pitch: 'Route planner that knows where you can legally sleep',
    founderKey: 'dane',
    rung: 'live' as const,
    brand: '#1A5C8A',
    glyph: 'peak',
    week: 16,
    streak: 5,
    clips: 4,
    followers: 642,
    media: 'photo' as const,
    problem: 'Every van app shows where the campgrounds are. None of them show where you will actually be left alone overnight, which is what matters.',
    who: 'Full-time and long-trip van travellers in North America and Europe.',
    why: 'I live in the van. I have been fined twice for getting this wrong.',
    promise: { text: 'One hundred trips planned by 12 September', days: 21, span: 45 },
    links: { site: 'northbound.trip', siteStatus: 'live' as const, ig: 'northbound.trip', tiktok: 'northbound.trip', yt: 'northboundvan' },
    segments: {},
  },
  {
    slug: 'fernpost',
    name: 'Fernpost',
    pitch: 'Plant care reminders that arrive as physical postcards',
    founderKey: 'tom',
    rung: 'building' as const,
    brand: '#3D6B24',
    glyph: 'leaf',
    week: 9,
    streak: 7,
    clips: 3,
    followers: 188,
    media: 'photo' as const,
    problem: 'Plant care apps send notifications that everyone swipes away. Nobody ignores something that arrives in the post.',
    who: 'People who kill houseplants and feel bad about it. Gift buyers, mostly.',
    why: 'I have killed eleven plants. This is a selfish product.',
    promise: { text: 'Post the first fifty cards by 5 September', days: 14, span: 30 },
    links: { site: 'fernpost.cards', siteStatus: 'waitlist' as const, ig: 'fernpost.cards', tiktok: 'fernpost' },
    segments: {},
  },
  {
    slug: 'halyard',
    name: 'Halyard',
    pitch: 'Crew rostering for charter boat operators',
    founderKey: 'elena',
    rung: 'idea' as const,
    brand: '#9A2A55',
    glyph: 'sail',
    week: 2,
    streak: 2,
    clips: 3,
    followers: 57,
    media: 'photo' as const,
    problem: 'Charter boat crew rostering runs on paper and group chats because every tool built for it is really a restaurant tool. Boats have tides, licences, sea time and weather cancellations.',
    who: 'Small charter operators running two to eight boats with casual crew.',
    why: 'Eleven years skippering. I made every one of those rosters by hand.',
    promise: { text: 'Talk to ten skippers by 1 September', days: 10, span: 21 },
    links: { ig: 'halyard.crew', siteStatus: 'none' as const },
    segments: {},
  },
  {
    slug: 'tallow',
    name: 'Tallow',
    pitch: 'Refillable skincare on subscription',
    founderKey: 'noor',
    rung: 'live' as const,
    status: 'closed' as const,
    brand: '#8A5A1A',
    glyph: 'drop',
    week: 71,
    streak: 0,
    clips: 11,
    followers: 934,
    media: 'video' as const,
    problem: 'Skincare packaging is thrown away after one use. Refills existed but nobody made them convenient enough to switch.',
    who: 'It turned out to be nobody, which is the point of the post-mortem.',
    why: 'I cared about the waste. I did not check whether anyone else cared enough to pay.',
    links: { site: 'tallow.co', siteStatus: 'closed' as const, x: 'noorhaddad', ig: 'tallow.refill' },
    segments: {},
  },
  {
    slug: 'pocket-ledger',
    name: 'Pocket Ledger',
    pitch: 'Receipt capture for sole traders who hate receipts',
    founderKey: 'sam',
    rung: 'alumni' as const,
    status: 'graduated' as const,
    brand: '#4A4A8A',
    glyph: 'receipt',
    week: 96,
    streak: 0,
    clips: 14,
    followers: 8830,
    media: 'video' as const,
    problem: 'Sole traders lose receipts and then lose deductions. Existing tools were built for bookkeepers, not for people doing it in a van at 9pm.',
    who: 'UK sole traders filing their own self-assessment.',
    why: 'I was one, and I was terrible at it.',
    links: { site: 'pocketledger.app', siteStatus: 'live' as const, x: 'samidris' },
    segments: {},
  },
];

async function seed() {
  console.log('🌱 Starting seed...');

  await connectDB();

  // Clear existing data
  console.log('  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Founder.deleteMany({}),
    Venture.deleteMany({}),
    Clip.deleteMany({}),
    Event.deleteMany({}),
  ]);

  // Create users and founders
  console.log('  Creating founders...');
  const founderIds: Record<string, mongoose.Types.ObjectId> = {};

  for (const [key, data] of Object.entries(FOUNDERS)) {
    const email = `${key}@example.com`;

    const user = await User.create({
      email,
      name: data.name,
      role: 'founder',
    });

    const founder = await Founder.create({
      userId: user._id,
      name: data.name,
      slug: key,
      bio: data.bio,
      location: data.location,
    });

    founderIds[key] = founder._id as mongoose.Types.ObjectId;
  }

  // Create ventures
  console.log('  Creating ventures...');
  for (const v of VENTURES) {
    const founderId = founderIds[v.founderKey];

    // Prepare promise if exists
    let promise = undefined;
    if (v.promise) {
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + v.promise.days);
      promise = {
        text: v.promise.text,
        dueAt,
        createdAt: new Date(),
      };
    }

    // Prepare segments
    const segments: Record<string, { body: string; publishedAt: Date }> = {};
    if (v.segments) {
      for (const [key, seg] of Object.entries(v.segments)) {
        if (seg.body) {
          segments[key] = {
            body: seg.body,
            publishedAt: new Date(),
          };
        }
      }
    }

    const venture = await Venture.create({
      slug: v.slug,
      founderId,
      name: v.name,
      pitch: v.pitch,
      brand: v.brand,
      glyph: v.glyph,
      rung: v.rung,
      rungEnteredAt: new Date(),
      status: v.status || 'live',
      media: {
        tier: v.media,
      },
      links: v.links || {},
      problem: v.problem,
      who: v.who,
      why: v.why,
      segments,
      promise,
      promiseHistory: [],
      counters: {
        followers: v.followers,
        clips: v.clips,
        weekNumber: v.week,
        streakWeeks: v.streak,
        lastPostedAt: new Date(),
        trendingScore: Math.floor(Math.random() * 100),
      },
      standards: {
        met: Math.floor(Math.random() * 7) + 1,
        of: 7,
        checkedAt: new Date(),
      },
      publishedAt: new Date(),
    });

    // Log the creation event
    await Event.create({
      at: new Date(),
      type: EVENT_TYPES.VENTURE_PUBLISHED,
      ventureId: venture._id,
      meta: { seeded: true },
    });
  }

  console.log('✅ Seed complete!');
  console.log(`   - ${Object.keys(FOUNDERS).length} founders created`);
  console.log(`   - ${VENTURES.length} ventures created`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
