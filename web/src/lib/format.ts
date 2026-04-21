export function formatCategoryLabel(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function primaryCategory(scores: Record<string, number>): string {
  let best = ''
  let bestVal = 0
  for (const [k, v] of Object.entries(scores)) {
    if (typeof v === 'number' && v > bestVal) {
      bestVal = v
      best = k
    }
  }
  if (bestVal <= 0 || !best) return 'unclassified'
  return best
}

export function tweetPermalink(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname === 'twitter.com' || u.hostname === 'www.twitter.com') {
      u.hostname = 'x.com'
    }
    return u.toString()
  } catch {
    return url
  }
}
