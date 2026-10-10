import { PROGRAMMING_LANGUAGES } from './curriculumData';
import { ContentFeedItem, ProgrammingLanguageId } from './types';

const SUBREDDIT_MAP: Record<ProgrammingLanguageId, string> = {
  python: 'learnpython',
  javascript: 'learnjavascript',
  typescript: 'typescript',
  rust: 'rust',
  go: 'golang',
};

/**
 * Fetches live articles, Reddit community discussions, and official documentation references
 * after the user has completed onboarding and is online (Part 13 & Part 6 Rule 10).
 */
export async function fetchLivingContentPipeline(
  languageId: ProgrammingLanguageId,
  customQuery?: string
): Promise<ContentFeedItem[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return [];
  }

  const nowIso = new Date().toISOString();
  const items: ContentFeedItem[] = [];
  const langMeta = PROGRAMMING_LANGUAGES.find((l) => l.id === languageId) || PROGRAMMING_LANGUAGES[0];

  // 1. Fetch from Dev.to public API (real articles tagged with the language)
  try {
    const tag = languageId === 'go' ? 'go' : languageId;
    const res = await fetch(`https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&top=30&per_page=4`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const art of data.slice(0, 4)) {
          items.push({
            id: `devto-${art.id}`,
            source: 'dev_to',
            sourceLabel: `Dev.to · ${art.user?.name || 'Community'}`,
            sourceUrl: art.url || 'https://dev.to',
            languageId,
            title: String(art.title || 'Community Tutorial'),
            summary: String(
              art.description ||
                'Practical community walkthrough and code examples for modern development.'
            ),
            upvotes: Number(art.public_reactions_count || 0),
            publishedAt: String(art.published_at || nowIso),
            fetchedAt: nowIso,
            relevanceScore: 92,
          });
        }
      }
    }
  } catch {
    // Graceful network fallback
  }

  // 2. Fetch from Reddit Public JSON API (Part 13.3 Reddit Research)
  try {
    const subreddit = SUBREDDIT_MAP[languageId];
    const redditUrl = customQuery
      ? `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(
          customQuery
        )}&restrict_sr=1&sort=top&t=year&limit=4`
      : `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=4`;

    const res = await fetch(redditUrl, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const children = json?.data?.children;
      if (Array.isArray(children)) {
        for (const child of children.slice(0, 4)) {
          const post = child?.data;
          if (!post || post.over_18) continue;
          const rawText = String(post.selftext || '').replace(/\s+/g, ' ').trim();
          const summary =
            rawText.length > 180
              ? rawText.slice(0, 177) + '...'
              : rawText || `High-engagement community thread in r/${subreddit} (${post.num_comments || 0} comments).`;
          items.push({
            id: `reddit-${post.id}`,
            source: 'reddit',
            sourceLabel: `r/${subreddit}`,
            sourceUrl: `https://www.reddit.com${post.permalink || `/r/${subreddit}`}`,
            languageId,
            title: String(post.title || 'Community Discussion'),
            summary,
            upvotes: Number(post.ups || 0),
            publishedAt: post.created_utc
              ? new Date(post.created_utc * 1000).toISOString()
              : nowIso,
            fetchedAt: nowIso,
            relevanceScore: 95,
          });
        }
      }
    }
  } catch {
    // Reddit CORS or rate-limit fallback
  }

  // 3. Official Documentation live reference entry for the active language
  items.push({
    id: `docs-${languageId}-${Date.now()}`,
    source: 'official_docs',
    sourceLabel: `${langMeta.name} Official Documentation`,
    sourceUrl: langMeta.docsUrl,
    languageId,
    title: `${langMeta.name} Standard Library & Language Reference`,
    summary: `Authoritative specification, standard library modules, and idiomatic usage patterns for ${langMeta.name}${
      customQuery ? ` (Topic: ${customQuery})` : ''
    }.`,
    publishedAt: nowIso,
    fetchedAt: nowIso,
    relevanceScore: 98,
  });

  // 4. Hacker News Firebase API live top item
  try {
    const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (hnRes.ok) {
      const ids: number[] = await hnRes.json();
      if (Array.isArray(ids) && ids.length > 0) {
        const storyRes = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${ids[0]}.json`
        );
        if (storyRes.ok) {
          const story = await storyRes.json();
          if (story && story.title) {
            items.push({
              id: `hn-${story.id}`,
              source: 'hacker_news',
              sourceLabel: 'Hacker News Front Page',
              sourceUrl: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
              languageId: 'all',
              title: String(story.title),
              summary: `Trending engineering discussion on Hacker News (${story.score || 0} points, ${
                story.descendants || 0
              } comments).`,
              upvotes: Number(story.score || 0),
              publishedAt: story.time ? new Date(story.time * 1000).toISOString() : nowIso,
              fetchedAt: nowIso,
              relevanceScore: 88,
            });
          }
        }
      }
    }
  } catch {
    // Ignore if blocked
  }

  return items;
}

/**
 * Merges newly fetched items into local LRU cache bounded by maxItems (Part 13.5)
 */
export function mergeIntoBoundedCache(
  existing: ContentFeedItem[],
  incoming: ContentFeedItem[],
  maxItems = 30
): ContentFeedItem[] {
  const map = new Map<string, ContentFeedItem>();
  for (const item of [...incoming, ...existing]) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values())
    .sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime())
    .slice(0, maxItems);
}
