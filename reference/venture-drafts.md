# Venture Drafts for Vibed

Use these to create ventures via the /start flow on Vibed.

---

## GAMEHUB

**Name:** GameHub

**One-liner:** Scan. Play. Win.

**Pitch:** Real-time multiplayer game rooms where friends compete in trivia, puzzles, and party games. Join with a QR code, pick a theme, and play instantly — no downloads required.

**Problem:** Getting a group to play a game together means everyone downloading an app, creating accounts, and figuring out how to connect. By the time you're set up, the moment has passed.

**Who it's for:** Party hosts, team leads running icebreakers, families at gatherings, anyone who wants to start playing in seconds not minutes.

**Why we're building this:** Games should bring people together, not create tech support situations. The best game nights happen when technology disappears and fun begins immediately.

**Industry:** Entertainment

**Stage:** Live

**Brand Color:** #00D9FF (cyan/tron blue)

**Glyph:** (game controller emoji)

**Live URL:** https://gamehub-production-2088.up.railway.app

---

### Segments

**The Spark (spark)**
I wanted a way to play games with friends without everyone needing to download an app or create accounts. The friction of "everyone install this" kills the vibe. What if joining a game was as simple as scanning a QR code?

**The Idea / Elevator Pitch (pitch)**
GameHub is multiplayer game rooms in your browser. One person creates a room, others scan a QR code to join. Pick from themes like Tron, Kids-friendly, or Spooky. Answer questions, earn coins, compete on the leaderboard. No signups, no downloads — just play.

**Validation (validation)**
Tested with friends at a dinner party. Created a room, passed my phone around for people to scan. Within 30 seconds everyone was in and playing. The "no app install" factor was the hook — people who normally wouldn't bother with games were suddenly competing.

**Building the Prototype (proto)**
Built the first version with Socket.io for real-time sync and a simple question/answer format. The hardest part was handling disconnects gracefully — people's phones lock, WiFi drops. Added reconnection logic so you don't lose your score.

**Building It (build)**
Stack: Node.js + Socket.io backend on Railway (needs persistent connections), vanilla frontend with multiple CSS themes. Each theme completely transforms the experience — the Tron theme has glowing borders and cyber effects, the Kids theme is bright and bouncy.

**Launch (launch)**
Deployed to Railway for the WebSocket support. Vercel wouldn't work because of the persistent connection requirement. First public room had 8 players — the celebration animations when someone wins made it feel like a real game show.

**Go To Market (gtm)**
Perfect for house parties, team meetings, and family gatherings. The QR code mechanic means the host controls the experience but anyone can join instantly. Planning to add more game modes beyond trivia.

---

## INNER-VERSE

**Name:** inner-verse

**One-liner:** Your truth, reflected back.

**Pitch:** AI-guided self-reflection that transforms your own words into insight. Answer a powerful question, explore deeper, and discover what you already know — seen from a new perspective.

**Problem:** Self-help advice feels generic because it's someone else's answers to your questions. Journaling helps, but you end up reading the same thoughts in the same patterns.

**Who it's for:** People seeking clarity — at career crossroads, processing relationships, working through creative blocks, or simply wanting to understand themselves better.

**Why we're building this:** The best insights don't come from outside — they come from hearing your own thoughts reflected back from new angles. AI can be a mirror, not just an advisor.

**Industry:** Health & Wellness

**Stage:** Live

**Brand Color:** #8B5CF6 (purple)

**Glyph:** (sparkles emoji)

**Live URL:** https://inner-verse.vercel.app

---

### Segments

**The Spark (spark)**
Most self-help feels like someone else's answers to your questions. I wondered: what if AI could help you find clarity not by giving advice, but by reflecting your own words back — transformed and reframed?

**The Idea / Elevator Pitch (pitch)**
Inner-verse asks you one powerful question. You write freely. Then AI takes your words and reflects them back from angles you hadn't considered. No generic advice — just your truth, seen differently. "What if the answers you're searching for are already within you?"

**Validation (validation)**
Shared an early version with a few friends going through career uncertainty. One said: "I didn't expect to feel so seen by my own words." That reaction — being moved by their own reflection — proved the concept worked better than any external advice could.

**Building the Prototype (proto)**
Three steps: Reflect (answer a question), Explore (go deeper), Discover (receive insight). The magic is in the prompt engineering — getting AI to genuinely transform rather than just summarise. Each response should feel like talking to a wise friend who really listened.

**Building It (build)**
Next.js with Anthropic's Claude API for the reflection engine. Dark/light theme toggle. Minimal UI — the words should be the focus, not the interface. No accounts required to start; friction kills introspection.

**Launch (launch)**
Deployed to Vercel. Kept it simple: land on the page, start reflecting immediately. The testimonial "I didn't expect to feel so seen by my own words" became the social proof.

**The Hard Parts (trouble)**
Getting the AI tone right took iteration. Early versions felt too therapist-y or too generic. The breakthrough was framing the AI as a mirror, not a counsellor — it reflects and reframes, never prescribes.

**What's Next (next)**
Exploring journal mode for recurring reflections. Maybe themed prompts for specific life moments (career crossroads, relationship clarity, creative blocks). The core insight: people don't need more advice — they need help hearing themselves.

---

## SCREENSHOTS NEEDED

For each venture, capture:
1. Landing page (desktop)
2. Landing page (mobile)
3. Key feature/interaction screen
4. Dark mode version (if available)

Recommended tools:
- Browser DevTools (responsive mode + screenshot)
- GoFullPage browser extension
- screenshotmachine.com (free tier)
