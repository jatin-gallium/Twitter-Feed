import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCuration } from '@/context/useCuration'
import { formatCategoryLabel, primaryCategory } from '@/lib/format'

export function AnalyticsPage() {
  const { snapshot } = useCuration()

  const stats = useMemo(() => {
    if (!snapshot) return null
    const posts = snapshot.posts
    let views = 0
    let likes = 0
    for (const p of posts) {
      views += p.metrics?.views ?? 0
      likes += p.metrics?.likes ?? 0
    }
    const primaryDist = new Map<string, number>()
    for (const p of posts) {
      const k = primaryCategory(p.scores)
      primaryDist.set(k, (primaryDist.get(k) ?? 0) + 1)
    }
    const topPrimary = [...primaryDist.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    const tagCounts = new Map<string, number>()
    for (const p of posts) {
      for (const t of p.tags) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
      }
    }
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)

    return { views, likes, topPrimary, topTags, postCount: posts.length }
  }, [snapshot])

  if (!snapshot || !stats) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">
          Analytics need data
        </h2>
        <p className="text-on-surface-variant max-w-md mb-6">
          Upload an export to unlock distribution charts and semantic clusters
          derived from your harvest.
        </p>
        <Link
          to="/upload"
          className="gradient-btn text-on-primary-fixed font-medium text-sm px-6 py-3 rounded-full"
        >
          Upload JSON
        </Link>
      </main>
    )
  }

  const maxPrimary = Math.max(...stats.topPrimary.map(([, n]) => n), 1)

  return (
    <main className="flex-1 md:ml-0 p-6 md:p-12 max-w-[1600px] mx-auto w-full pb-24">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">
            Insight architecture
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg">
            Aggregates from your loaded JSON (client-side only).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl p-8 shadow-[0_12px_40px_rgba(5,52,92,0.06)] flex flex-col justify-between min-h-[280px] relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-2 text-on-primary/90 text-sm font-headline font-semibold uppercase tracking-widest">
            <span className="material-symbols-outlined">visibility</span>
            <span>Total views (summed)</span>
          </div>
          <div className="relative z-10 mt-8">
            <div className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter mb-2">
              {formatBig(stats.views)}
            </div>
            <p className="text-on-primary/85 text-sm max-w-lg leading-relaxed">
              Summed from <strong>{stats.postCount.toLocaleString()}</strong>{' '}
              posts where view counts exist in the export. Useful as a coarse
              volume signal, not as audited analytics.
            </p>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface-container-low rounded-xl p-8 flex flex-col min-h-[280px]">
          <div className="flex items-center gap-2 mb-6 text-on-surface-variant text-sm font-headline font-semibold uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">favorite</span>
            <span>Total likes (summed)</span>
          </div>
          <div className="font-headline text-4xl font-bold text-on-surface mb-2">
            {formatBig(stats.likes)}
          </div>
          <p className="text-sm text-on-surface-variant">
            Same caveat: export snapshot, not live X analytics.
          </p>
        </div>

        <div className="md:col-span-12 bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_40px_rgba(5,52,92,0.06)]">
          <div className="flex items-center gap-2 mb-8 text-on-surface-variant text-sm font-headline font-semibold uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">leaderboard</span>
            <span>Primary category by post (argmax scores)</span>
          </div>
          <div className="space-y-4">
            {stats.topPrimary.map(([k, n]) => (
              <div key={k}>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-on-surface">
                    {formatCategoryLabel(k)}
                  </span>
                  <span className="text-primary font-bold">
                    {n.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(n / maxPrimary) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-6 bg-surface-container-low rounded-xl pt-8 pb-6 px-8 min-h-[240px]">
          <div className="flex items-center gap-2 mb-6 text-on-surface-variant text-sm font-headline font-semibold uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">tag</span>
            <span>Explicit tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.length === 0 ? (
              <span className="text-sm text-on-surface-variant">
                No tag arrays populated in this export.
              </span>
            ) : (
              stats.topTags.map(([t, n]) => (
                <span
                  key={t}
                  className="bg-surface-container-lowest text-on-surface px-3 py-2 rounded-full text-sm font-medium shadow-sm border border-outline-variant/20"
                >
                  {formatCategoryLabel(t)}{' '}
                  <span className="text-primary text-xs ml-1">{n}</span>
                </span>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-6 flex items-center justify-center bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm">
          <div className="text-center">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
              Continue curating
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 max-w-sm mx-auto">
              Jump back to the explorer to scroll embeds and refine with search.
            </p>
            <Link
              to="/explorer"
              className="inline-flex bg-gradient-to-br from-primary to-primary-container text-on-primary font-medium text-sm px-8 py-3 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              Open Feed Explorer
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function formatBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}
