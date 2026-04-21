import { Link } from 'react-router-dom'
import { useCuration } from '@/context/useCuration'
import { formatCategoryLabel } from '@/lib/format'

export function DashboardPage() {
  const { snapshot, lastSourceName } = useCuration()

  const postCount = snapshot?.exportMeta.postCount ?? 0
  const catCount = snapshot?.categories.length ?? 0

  const topThemes = snapshot
    ? topScoringCategories(snapshot.posts.flatMap((p) =>
        Object.entries(p.scores)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => ({ k, v })),
      ))
    : []

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <header className="hidden md:flex justify-between items-center px-8 py-3 w-full bg-[#eff4ff]/90 backdrop-blur-md sticky top-0 z-30 shadow-[0_12px_40px_rgba(5,52,92,0.06)]">
        <h2 className="text-xl font-extrabold text-on-surface font-headline">
          Overview
        </h2>
        <div className="flex items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined cursor-default">
            notifications
          </span>
        </div>
      </header>

      <div className="p-6 md:p-12 lg:p-16 space-y-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tight text-on-surface mb-2">
              Editorial Overview
            </h1>
            <p className="font-body text-on-surface-variant text-base md:text-lg">
              {snapshot
                ? `Loaded ${postCount.toLocaleString()} posts${
                    lastSourceName ? ` from ${lastSourceName}` : ''
                  }.`
                : 'Upload a JSON export to begin curating your Twitter harvest.'}
            </p>
            {snapshot?.exportMeta.generatedAt ? (
              <p className="text-sm text-on-surface-variant mt-2">
                Export generated{' '}
                {new Date(snapshot.exportMeta.generatedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <Link
            to="/upload"
            className="gradient-btn text-on-primary-fixed font-body font-medium text-sm px-6 py-3 rounded-full shadow-sm flex items-center gap-2 w-fit hover:opacity-95 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm filled">add</span>
            <span>Upload New Data</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="col-span-1 md:col-span-8 bg-surface-container-lowest rounded-xl p-8 lg:p-12 ambient-shadow relative overflow-hidden flex flex-col justify-between min-h-[240px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div>
              <h3 className="font-headline text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">database</span>
                <span>Tweets in archive</span>
              </h3>
              <div className="font-headline text-5xl md:text-7xl font-extrabold text-on-surface tracking-tighter">
                {postCount.toLocaleString()}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label text-xs font-medium">
                <span className="material-symbols-outlined text-[14px] mr-1 text-primary">
                  label
                </span>
                {catCount} category keys detected
              </span>
              {snapshot?.exportMeta.classifier ? (
                <span className="text-on-surface-variant font-body text-sm">
                  Classifier:{' '}
                  <span className="text-on-surface font-medium">
                    {snapshot.exportMeta.classifier}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-low rounded-xl p-8 flex-1 flex flex-col justify-center transition-transform hover:-translate-y-0.5 duration-300">
              <h3 className="font-headline text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                Active categories
              </h3>
              <div className="font-headline text-4xl font-bold text-on-surface">
                {catCount}
              </div>
              <p className="font-body text-sm text-on-surface-variant mt-2">
                Derived from score keys and tags in your export.
              </p>
            </div>
            <Link
              to="/explorer"
              className="bg-surface-container-low rounded-xl p-8 flex-1 flex flex-col justify-center transition-transform hover:-translate-y-0.5 duration-300 border border-outline-variant/10 hover:border-primary/30"
            >
              <h3 className="font-headline text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">
                Next step
              </h3>
              <div className="font-headline text-xl font-bold text-primary">
                Open Feed Explorer →
              </div>
              <p className="font-body text-sm text-on-surface-variant mt-2">
                Browse by stream and search within the loaded archive.
              </p>
            </Link>
          </div>

          <div className="col-span-1 md:col-span-12 bg-surface-container-lowest rounded-xl p-8 ambient-shadow">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-surface-container-high">
              <h3 className="font-headline text-lg font-bold text-on-surface">
                Semantic highlights
              </h3>
              <Link
                to="/analytics"
                className="text-primary font-body text-sm font-medium hover:underline underline-offset-4"
              >
                View analytics
              </Link>
            </div>
            {!snapshot ? (
              <p className="text-on-surface-variant text-sm">
                Upload data to see automatic theme rollups from classifier scores.
              </p>
            ) : topThemes.length === 0 ? (
              <p className="text-on-surface-variant text-sm">
                No positive scores found in this sample.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {topThemes.map((t) => (
                  <div key={t.key} className="space-y-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label text-xs font-medium">
                      {formatCategoryLabel(t.key)}
                    </span>
                    <h4 className="font-headline text-base font-bold text-on-surface leading-tight">
                      {t.count} tweets with signal
                    </h4>
                    <p className="font-body text-sm text-on-surface-variant line-clamp-3">
                      Aggregate score mass: {Math.round(t.mass).toLocaleString()}{' '}
                      across posts mentioning this theme in your export.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function topScoringCategories(
  pairs: { k: string; v: number }[],
): { key: string; mass: number; count: number }[] {
  const map = new Map<string, { mass: number; count: number }>()
  for (const { k, v } of pairs) {
    const cur = map.get(k) ?? { mass: 0, count: 0 }
    cur.mass += v
    cur.count += 1
    map.set(k, cur)
  }
  return [...map.entries()]
    .map(([key, { mass, count }]) => ({ key, mass, count }))
    .sort((a, b) => b.mass - a.mass)
    .slice(0, 3)
}
