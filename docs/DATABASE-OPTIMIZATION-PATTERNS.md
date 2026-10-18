# Database Optimization Patterns for Vibed

## Problem: Slow Landing Page Sections

**Observation:** "Trending Ventures" loads instantly, while other sections (The Idea, Building It, etc.) take noticeably longer.

**Root Cause:** Data fetching strategy difference.

| Section | Initial Data | Load Time |
|---------|-------------|-----------|
| Trending Ventures | 4 ventures fetched server-side (SSR) | Instant |
| Other sections | Empty array `[]`, then client-side API call | Slow (requires hydration + API round-trip) |

## The Fast Pattern (Use This!)

The "Trending Ventures" section uses this pattern:

```typescript
// 1. Server-side service function with caching
async function _getTrendingVentures(limit: number = 8): Promise<VentureWithFounder[]> {
  const supabase = createCachedAdminClient(); // ← Cookieless for cache compatibility

  const { data } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .order('counters->followers', { ascending: false })
    .limit(limit);

  return data.map(v => mapVenture(v, v.founders));
}

// 2. Wrap with unstable_cache for ISR
export const getTrendingVentures = unstable_cache(
  _getTrendingVentures,
  ['trending-ventures'],      // Cache key
  { revalidate: 60, tags: ['ventures'] }  // 60-second ISR
);

// 3. Call in server component, pass to client component
export default async function HomePage() {
  const trendingVentures = await getTrendingVentures(4);

  return (
    <InfiniteScrollSection
      initialVentures={trendingVentures.map(transformVenture)}  // ← Data baked into HTML
      pillar="trending"
    />
  );
}
```

## The Slow Pattern (Avoid This!)

The other sections were using this anti-pattern:

```typescript
// ❌ BAD: Empty initial data forces client-side fetch
<InfiniteScrollSection
  initialVentures={[]}  // ← Empty! Must wait for API call
  pillar="the_idea"
/>
```

**What happens:**
1. Page HTML loads with empty section
2. React hydrates
3. IntersectionObserver triggers
4. Client-side `fetch('/api/ventures/feed?pillar=the_idea')`
5. Data arrives, section re-renders

Total delay: ~200-500ms minimum, often more.

## Key Optimization Rules

### 1. Always Fetch Initial Data Server-Side

Create a cached service function for each data source:

```typescript
// lib/services/ventures-public.ts
export const getVenturesByPillar = unstable_cache(
  _getVenturesByPillar,
  ['ventures-by-pillar'],
  { revalidate: 60, tags: ['ventures'] }
);
```

### 2. Use `createCachedAdminClient()` for Cached Functions

Functions wrapped with `unstable_cache()` **cannot** call `cookies()` or `headers()`.
Use the cookieless admin client:

```typescript
// ✅ GOOD: Cookieless client for cached functions
const supabase = createCachedAdminClient();

// ❌ BAD: Will throw error inside unstable_cache
const supabase = await createAdminClient(); // Uses cookies internally
```

### 3. Limit Initial Fetch to Avoid Duplicates

The infinite scroll deduplicates by slug. If you fetch 8 items server-side but only show 4,
infinite scroll might show duplicates. Fetch exactly what you display:

```typescript
// Show 4 cards initially → fetch 4
const ventures = await getTrendingVentures(4);
```

### 4. Single Query for Multiple Sections (BEST)

When you need data for multiple sections, fetch once and categorize in JS:

```typescript
// ✅ BEST: Single database query for all landing page sections
export const getLandingPageVentures = unstable_cache(
  async () => {
    const { data } = await supabase
      .from('ventures')
      .select('...')
      .limit(50); // Enough for all sections

    // Categorize in JS (fast, no network overhead)
    return {
      trending: sortByFollowers(data).slice(0, 4),
      recent: data.slice(0, 4),
      the_idea: filterBySegments(data, 'the_idea').slice(0, 4),
      // etc.
    };
  },
  ['landing-page'],
  { revalidate: 60 }
);

// Then in page:
const data = await getLandingPageVentures();
```

**Why single query is faster:**
- 1 DB connection vs 6 connections
- 1 cold start vs potential 6 cold starts
- Network latency paid once, not 6x
- Categorization in JS is ~1ms

**❌ AVOID: Multiple parallel queries**
```typescript
// Looks fast but causes cold start overhead
const [a, b, c, d, e, f] = await Promise.all([
  getA(), getB(), getC(), getD(), getE(), getF()
]);
// Each query = separate DB connection = slow on cold start
```
```

### 5. Segment Filtering for Pillar Sections

Pillar sections filter ventures by which segments have content:

```typescript
const PILLAR_SEGMENTS = {
  the_idea: ['pitch', 'spark', 'validation'],
  building_it: ['proto', 'build', 'beta', 'audience'],
  getting_customers: ['gtm', 'launch', 'firstuser', 'channel', 'first', 'retention'],
  hard_parts: ['trouble', 'money', 'team', 'pivot', 'shutdown'],
};
```

Filter in the service function, not the component:

```typescript
const ventures = allVentures.filter(v => {
  const segments = v.segments as Record<string, { body?: string }>;
  return pillarSegments.some(key => segments[key]?.body?.trim());
});
```

## Caching Strategy Summary

| Layer | TTL | Invalidation |
|-------|-----|--------------|
| `unstable_cache()` | 60 seconds | Time-based + `revalidateTag('ventures')` |
| ISR (`export const revalidate`) | 60 seconds | On next request after TTL |
| Supabase | Real-time | Always fresh |

## Performance Impact

Before fix:
- Trending Ventures: ~50ms (SSR)
- Other sections: ~300-500ms (client fetch)

After fix:
- All sections: ~50-100ms (parallel SSR)

---

**Last Updated:** 2026-10-18
