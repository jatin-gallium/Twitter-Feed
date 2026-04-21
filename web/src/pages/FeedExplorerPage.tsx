import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCuration } from '@/context/useCuration'
import { LazyTweetEmbed } from '@/components/LazyTweetEmbed'
import { formatCategoryLabel, primaryCategory } from '@/lib/format'
import {
  filterPostsBySearch,
  postMatchesCategory,
} from '@/lib/parseExport'
import type { TweetPost } from '@/types/export'

const ALL = '__all__'

export function FeedExplorerPage() {
  const { snapshot } = useCuration()
  const [category, setCategory] = useState<string>(ALL)
  const [search, setSearch] = useState('')

  const effectiveCategory = useMemo(() => {
    if (!snapshot) return ALL
    if (category === ALL) return ALL
    return snapshot.categories.includes(category) ? category : ALL
  }, [snapshot, category])

  const filtered = useMemo(() => {
    if (!snapshot) return []
    const base =
      effectiveCategory === ALL
        ? snapshot.posts
        : snapshot.posts.filter((p) =>
            postMatchesCategory(p, effectiveCategory),
          )
    return filterPostsBySearch(base, search)
  }, [snapshot, effectiveCategory, search])

  if (!snapshot) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">
          No archive loaded
        </h2>
        <p className="text-on-surface-variant max-w-md mb-6">
          Upload your JSON export first, then return here to explore streams.
        </p>
        <Link
          to="/upload"
          className="gradient-btn text-on-primary-fixed font-medium text-sm px-6 py-3 rounded-full"
        >
          Go to Data Upload
        </Link>
      </main>
    )
  }

  const streamTitle =
    effectiveCategory === ALL
      ? 'Full archive'
      : formatCategoryLabel(effectiveCategory)

  return (
    <main className="flex-1 flex flex-col h-[calc(100dvh-56px)] md:h-screen overflow-hidden bg-background">
      <header className="glass-header sticky top-0 md:top-0 z-30 shadow-[0_12px_40px_rgba(5,52,92,0.06)] flex flex-col md:flex-row md:items-center gap-3 px-4 md:px-8 py-3 md:py-4 border-b border-outline-variant/10">
        <div className="relative w-full md:max-w-2xl ghost-border bg-surface-container-lowest rounded-full transition-all">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none py-3 pl-12 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-0 focus:outline-none rounded-full font-body"
            placeholder="Search text, authors, tags, or reasons…"
            type="search"
          />
        </div>
        <div className="hidden md:flex items-center gap-4 ml-auto text-on-surface-variant">
          <span className="material-symbols-outlined">notifications</span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        <aside className="w-full md:w-56 bg-surface-container-low p-4 md:p-6 flex-shrink-0 md:h-full overflow-x-auto md:overflow-y-auto no-scrollbar flex md:flex-col gap-2 md:gap-0 border-b md:border-b-0 border-outline-variant/10">
          <h2 className="hidden md:block font-headline text-xs tracking-[0.05em] uppercase text-on-surface-variant mb-4 font-semibold">
            Curated streams
          </h2>
          <ul className="flex md:flex-col gap-1 min-w-max md:min-w-0 pb-1 md:pb-0">
            <li className="md:w-full">
              <button
                type="button"
                onClick={() => setCategory(ALL)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal ${
                  effectiveCategory === ALL
                    ? 'bg-surface-container-lowest text-primary ambient-shadow'
                    : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                }`}
              >
                All posts
              </button>
            </li>
            {snapshot.categories.map((c) => (
              <li key={c} className="md:w-full">
                <button
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal ${
                    effectiveCategory === c
                      ? 'bg-surface-container-lowest text-primary ambient-shadow'
                      : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                  }`}
                >
                  {formatCategoryLabel(c)}
                </button>
              </li>
            ))}
          </ul>

          <h2 className="hidden md:block font-headline text-xs tracking-[0.05em] uppercase text-on-surface-variant mt-8 mb-3 font-semibold">
            Active filters
          </h2>
          <div className="hidden md:flex flex-wrap gap-2">
            {search.trim() ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant">
                Query: {search.trim()}
                <button
                  type="button"
                  className="ml-1 focus:outline-none"
                  aria-label="Clear search"
                  onClick={() => setSearch('')}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    close
                  </span>
                </button>
              </span>
            ) : (
              <span className="text-xs text-on-surface-variant">None</span>
            )}
          </div>
        </aside>

        <section className="flex-1 overflow-y-auto no-scrollbar bg-background p-4 md:p-10 min-h-0">
          <div className="max-w-2xl mx-auto pb-24">
            <div className="mb-8 flex justify-between items-end gap-4">
              <div>
                <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
                  {streamTitle}
                </h2>
                <p className="text-sm text-on-surface-variant mt-2 font-body">
                  Showing {filtered.length.toLocaleString()} of{' '}
                  {snapshot.posts.length.toLocaleString()} posts
                  {effectiveCategory !== ALL ? ' in this stream' : ''}.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {filtered.map((post) => (
                <TweetRow key={post.id} post={post} />
              ))}
              {filtered.length === 0 ? (
                <p className="text-center text-on-surface-variant text-sm py-12">
                  No posts match this stream and search.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function TweetRow({ post }: { post: TweetPost }) {
  const pc = primaryCategory(post.scores)
  const topScores = Object.entries(post.scores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <article className="bg-surface-container-lowest rounded-xl p-6 md:p-8 ambient-shadow border border-outline-variant/10">
      <div className="flex flex-wrap gap-2 mb-3">
        {post.tags.map((t) => (
          <span
            key={t}
            className="inline-block px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-xs font-medium"
          >
            {formatCategoryLabel(t)}
          </span>
        ))}
        {post.tags.length === 0 && pc !== 'unclassified' ? (
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            Top: {formatCategoryLabel(pc)}
          </span>
        ) : null}
      </div>
      <p className="text-xs text-on-surface-variant mb-1 font-medium">
        {post.author}
        {post.createdAt
          ? ` · ${new Date(post.createdAt).toLocaleString()}`
          : ''}
      </p>
      <p className="text-on-surface font-body leading-relaxed text-[15px] line-clamp-6 mb-4">
        {post.text}
      </p>
      {topScores.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4 text-[11px] text-on-surface-variant">
          {topScores.map(([k, v]) => (
            <span
              key={k}
              className="px-2 py-0.5 rounded-md bg-surface-container-low border border-outline-variant/15"
            >
              {formatCategoryLabel(k)}: {v}
            </span>
          ))}
        </div>
      ) : null}
      <LazyTweetEmbed url={post.url} className="min-h-[120px]" />
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <a
          className="text-primary font-medium underline underline-offset-2"
          href={post.url}
          target="_blank"
          rel="noreferrer"
        >
          Open on X
        </a>
        {post.metrics?.likes != null ? (
          <span className="text-on-surface-variant">
            ♥ {post.metrics.likes.toLocaleString()}
          </span>
        ) : null}
      </div>
    </article>
  )
}
