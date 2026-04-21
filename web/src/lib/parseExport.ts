import type { CurationSnapshot, TweetExport, TweetPost } from '@/types/export'
import { primaryCategory } from '@/lib/format'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function normalizePost(raw: unknown): TweetPost | null {
  if (!isRecord(raw)) return null
  const id = typeof raw.id === 'string' ? raw.id : ''
  const url = typeof raw.url === 'string' ? raw.url : ''
  if (!id || !url) return null

  const scoresRaw = raw.scores
  const scores: Record<string, number> = {}
  if (isRecord(scoresRaw)) {
    for (const [k, v] of Object.entries(scoresRaw)) {
      if (typeof v === 'number' && Number.isFinite(v)) scores[k] = v
    }
  }

  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === 'string')
    : []

  const reasons = Array.isArray(raw.reasons)
    ? raw.reasons.filter((t): t is string => typeof t === 'string')
    : []

  return {
    id,
    url,
    author: typeof raw.author === 'string' ? raw.author : 'Unknown',
    text: typeof raw.text === 'string' ? raw.text : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    capturedAt: typeof raw.capturedAt === 'number' ? raw.capturedAt : undefined,
    metrics: isRecord(raw.metrics)
      ? {
          replies: num(raw.metrics.replies),
          reposts: num(raw.metrics.reposts),
          likes: num(raw.metrics.likes),
          views: num(raw.metrics.views),
        }
      : undefined,
    profileHandle:
      typeof raw.profileHandle === 'string' ? raw.profileHandle : undefined,
    tags,
    scores,
    activeDecision:
      typeof raw.activeDecision === 'string' ? raw.activeDecision : undefined,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : undefined,
    reasons,
  }
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function collectCategories(posts: TweetPost[]): string[] {
  const set = new Set<string>()
  for (const p of posts) {
    for (const k of Object.keys(p.scores)) set.add(k)
    for (const t of p.tags) set.add(t)
  }
  set.add('unclassified')
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function parseTweetExportJson(text: string): CurationSnapshot {
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    throw new Error('Invalid JSON: could not parse file.')
  }

  if (!isRecord(parsed)) {
    throw new Error('Invalid export: root must be an object.')
  }

  const postsRaw = parsed.posts
  if (!Array.isArray(postsRaw)) {
    throw new Error('Invalid export: expected a "posts" array.')
  }

  const posts: TweetPost[] = []
  for (const row of postsRaw) {
    const p = normalizePost(row)
    if (p) posts.push(p)
  }

  const exp: TweetExport = {
    generatedAt:
      typeof parsed.generatedAt === 'string' ? parsed.generatedAt : undefined,
    mode: typeof parsed.mode === 'string' ? parsed.mode : undefined,
    classifier:
      typeof parsed.classifier === 'string' ? parsed.classifier : undefined,
    profileDeepScan:
      typeof parsed.profileDeepScan === 'boolean'
        ? parsed.profileDeepScan
        : undefined,
    posts,
  }

  return {
    exportMeta: {
      generatedAt: exp.generatedAt,
      mode: exp.mode,
      classifier: exp.classifier,
      postCount: posts.length,
    },
    posts,
    categories: collectCategories(posts),
    savedAt: new Date().toISOString(),
  }
}

export function postMatchesCategory(post: TweetPost, category: string): boolean {
  if (category === 'unclassified') {
    return primaryCategory(post.scores) === 'unclassified' && post.tags.length === 0
  }
  if (post.tags.includes(category)) return true
  const v = post.scores[category]
  return typeof v === 'number' && v > 0
}

export function filterPostsBySearch(
  posts: TweetPost[],
  q: string,
): TweetPost[] {
  const s = q.trim().toLowerCase()
  if (!s) return posts
  return posts.filter((p) => {
    const hay = [
      p.text,
      p.author,
      p.url,
      ...p.tags,
      ...p.reasons,
      ...Object.entries(p.scores)
        .filter(([, v]) => v > 0)
        .map(([k]) => k),
    ]
      .join('\n')
      .toLowerCase()
    return hay.includes(s)
  })
}
