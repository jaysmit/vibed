#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function update() {
  const today = new Date().toISOString().split('T')[0];

  const updates = {
    name: 'Once Upon a You',
    pitch: 'AI-powered picture books where your child is the hero — printed and delivered to your door.',
    country: 'AU',
    categories: ['consumer', 'ai'],
    rung: 'idea',
    status: 'live',
    published_at: new Date().toISOString(),
    problem: `Every child deserves to be the hero of their own story.

Generic picture books are lovely, but they're someone else's adventure. Your child reads about Max or Sophie or whoever — never themselves. Their face lights up at stories, but they're always on the outside looking in.

**Once Upon a You** changes that.

Upload a photo of your child (or their siblings, friends, even grandparents). Our AI transforms them into beautiful storybook characters — in watercolour, classic fable style, or enchanted glow. Choose a world (enchanted forest, pirate seas, space odyssey), and we generate a fully illustrated picture book with YOUR child as the star.

Printed on premium paper. Hardcover. Delivered to your door.

The magic isn't the AI — it's the look on their face when they see themselves saving the kingdom.`,

    segments: {
      pitch: {
        body: `**The Problem**

Children's picture books are wonderful — but generic. Every story features someone else's child on an adventure. Your kid is always the reader, never the hero.

Personalised books exist, but they're crude. Basic name insertion. Clipart characters. Nothing that captures who your child actually is.

**The Solution**

Once Upon a You uses AI to transform real photos into stunning storybook illustrations. Upload a photo, choose an art style (watercolour, classic fable, enchanted glow), pick a world (enchanted forest, pirate adventure, space odyssey), and we generate a fully illustrated hardcover book with your child as the main character.

Not a name plastered on a template. A real illustrated character that looks like them, in their own adventure, printed on premium paper and delivered to your door.

**Why Now**

AI image generation has crossed the quality threshold. We can now create illustrations that look hand-painted, not generated. The technology finally matches the vision.`,
        happenedAt: today,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPlanned: false
      },

      spark: {
        body: `It started with a bedtime story.

My niece asked why she couldn't be in the book. Not "a character like her" — actually her. In the pictures. Having the adventure.

I tried the personalised book services that exist. They were disappointing. Name insertion into generic templates. Cartoon avatars that looked nothing like her. It felt lazy.

Then I started playing with AI image generation. I fed it a photo and asked for "a watercolour illustration of this child as a fairy tale princess." The result was stunning. It actually looked like her — but as a storybook character.

That was the moment. If I could generate one illustration, I could generate a whole book. If I could make one child the hero, I could make any child the hero.

Every parent wants their child to feel special. Every child wants to be the hero. The technology to make that happen finally exists.`,
        happenedAt: today,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPlanned: false
      },

      validation: {
        body: `**Testing the Concept**

Before building anything, I created sample books manually — generating illustrations with AI, laying them out in InDesign, printing through a local printer. Gave them to five families.

The reactions were unanimous. Kids wanted to read "their book" over and over. Parents got emotional seeing their child illustrated so beautifully. One grandmother cried.

**Pre-launch Strategy**

We're building a shortlist before launch. The website captures:
- Parent name and email
- Child's name and age
- Preferred art styles
- Whether they want launch updates

This tells us:
1. Is there real demand? (Sign-up numbers)
2. Which art styles are most popular? (Style selection data)
3. What age ranges are we serving? (Age distribution)

**What Success Looks Like**

500 shortlist sign-ups before we invest in scaling the generation pipeline. Each sign-up is a potential first customer — warm leads who've already imagined their child as the hero.`,
        happenedAt: today,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPlanned: false
      }
    },

  };

  // First fetch existing venture to preserve links (especially poster)
  const { data: existing } = await supabase
    .from('ventures')
    .select('links')
    .eq('slug', 'storyme')
    .single();

  // Merge links to preserve poster and other existing fields
  updates.links = {
    ...existing?.links,
    site: 'https://storyme.vercel.app',
    siteStatus: 'live'
  };

  const { data, error } = await supabase
    .from('ventures')
    .update(updates)
    .eq('slug', 'storyme')
    .select('slug, name, status');

  if (error) console.log('Error:', error);
  else console.log('Updated and published:', data);
}

update();
