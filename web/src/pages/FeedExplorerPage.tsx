import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCuration } from '@/context/useCuration'
import { useTweetLibrary } from '@/context/useTweetLibrary'
import { LazyTweetEmbed } from '@/components/LazyTweetEmbed'
import { formatCategoryLabel, primaryCategory } from '@/lib/format'
import {
  filterPostsBySearch,
  postMatchesCategory,
} from '@/lib/parseExport'
import type { TweetPost } from '@/types/export'
import {
  readExplorerNavCollapsed,
  writeExplorerNavCollapsed,
} from '@/lib/layoutPrefs'

const ALL = '__all__'

export function FeedExplorerPage() {
  const { snapshot } = useCuration()
  const { view, setView, savedIds, trashedIds, emptyTrash } = useTweetLibrary()
  const [category, setCategory] = useState<string>(ALL)
  const [search, setSearch] = useState('')
  const [explorerNavCollapsed, setExplorerNavCollapsed] = useState(
    () => readExplorerNavCollapsed(),
  )

  const toggleExplorerNav = useCallback(() => {
    setExplorerNavCollapsed((v) => {
      const next = !v
      writeExplorerNavCollapsed(next)
      return next
    })
  }, [])

  const effectiveCategory = useMemo(() => {
    if (!snapshot) return ALL
    if (category === ALL) return ALL
    return snapshot.categories.includes(category) ? category : ALL
  }, [snapshot, category])

  const streamFiltered = useMemo(() => {
    if (!snapshot) return []
    const base =
      effectiveCategory === ALL
        ? snapshot.posts
        : snapshot.posts.filter((p) =>
            postMatchesCategory(p, effectiveCategory),
          )
    return filterPostsBySearch(base, search)
  }, [snapshot, effectiveCategory, search])

  const filtered = useMemo(() => {
    if (view === 'saved') {
      return streamFiltered.filter(
        (p) => savedIds.has(p.id) && !trashedIds.has(p.id),
      )
    }
    if (view === 'trash') {
      return streamFiltered.filter((p) => trashedIds.has(p.id))
    }
    return streamFiltered.filter((p) => !trashedIds.has(p.id))
  }, [streamFiltered, view, savedIds, trashedIds])

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
    view === 'saved'
      ? 'Saved'
      : view === 'trash'
        ? 'Trash'
        : effectiveCategory === ALL
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
        <div className="hidden md:flex items-center gap-2 ml-auto shrink-0">
          <button
            type="button"
            onClick={toggleExplorerNav}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
            title={
              explorerNavCollapsed
                ? 'Expand feed sidebar'
                : 'Minimize feed sidebar'
            }
            aria-expanded={!explorerNavCollapsed}
            aria-label={
              explorerNavCollapsed
                ? 'Expand feed sidebar'
                : 'Minimize feed sidebar'
            }
          >
            <span className="material-symbols-outlined text-2xl">
              {explorerNavCollapsed
                ? 'dock_to_right'
                : 'vertical_split'}
            </span>
          </button>
          <span className="material-symbols-outlined text-on-surface-variant p-2">
            notifications
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        <aside
          className={`w-full bg-surface-container-low flex-shrink-0 md:h-full overflow-x-auto md:overflow-y-auto no-scrollbar flex md:flex-col gap-2 md:gap-0 border-b md:border-b-0 border-outline-variant/10 transition-[width,padding] duration-200 ease-out ${
            explorerNavCollapsed
              ? 'md:w-14 md:px-2 md:py-4 md:items-center'
              : 'md:w-56 md:p-6'
          }`}
        >
          <div
            className={`hidden md:flex w-full ${explorerNavCollapsed ? 'justify-center mb-2' : 'justify-end mb-1'}`}
          >
            <button
              type="button"
              onClick={toggleExplorerNav}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary transition-colors"
              title={
                explorerNavCollapsed
                  ? 'Expand sidebar'
                  : 'Minimize sidebar'
              }
              aria-label={
                explorerNavCollapsed
                  ? 'Expand sidebar'
                  : 'Minimize sidebar'
              }
            >
              <span className="material-symbols-outlined text-xl">
                {explorerNavCollapsed
                  ? 'keyboard_double_arrow_right'
                  : 'keyboard_double_arrow_left'}
              </span>
            </button>
          </div>
          <h2
            className={`hidden md:block font-headline text-xs tracking-[0.05em] uppercase text-on-surface-variant font-semibold ${
              explorerNavCollapsed ? 'sr-only' : 'mb-3'
            }`}
          >
            Library
          </h2>
          <ul className="flex md:flex-col gap-1 min-w-max md:min-w-0 pb-1 md:pb-0 mb-2 md:mb-4">
            <li className="md:w-full">
              <button
                type="button"
                onClick={() => setView('default')}
                title="Feed"
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal flex md:items-center gap-2 ${
                  explorerNavCollapsed ? 'md:justify-center md:px-2' : ''
                } ${
                  view === 'default'
                    ? 'bg-surface-container-lowest text-primary ambient-shadow'
                    : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 md:hidden">
                  dynamic_feed
                </span>
                <span className={explorerNavCollapsed ? 'md:sr-only' : ''}>
                  Feed
                </span>
                {explorerNavCollapsed ? (
                  <span className="material-symbols-outlined text-[20px] shrink-0 hidden md:inline">
                    dynamic_feed
                  </span>
                ) : null}
              </button>
            </li>
            <li className="md:w-full">
              <button
                type="button"
                onClick={() => setView('saved')}
                title={`Saved (${savedIds.size})`}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between gap-2 whitespace-nowrap md:whitespace-normal ${
                  explorerNavCollapsed ? 'md:justify-center md:px-2' : ''
                } ${
                  view === 'saved'
                    ? 'bg-surface-container-lowest text-primary ambient-shadow'
                    : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 md:hidden">
                  bookmark
                </span>
                <span className={explorerNavCollapsed ? 'md:sr-only' : ''}>
                  Saved
                </span>
                <span
                  className={`text-xs font-semibold tabular-nums opacity-80 ${
                    explorerNavCollapsed ? 'md:sr-only' : ''
                  }`}
                >
                  {savedIds.size}
                </span>
                {explorerNavCollapsed ? (
                  <span className="material-symbols-outlined text-[20px] shrink-0 hidden md:inline filled text-primary">
                    bookmark
                  </span>
                ) : null}
              </button>
            </li>
            <li className="md:w-full">
              <button
                type="button"
                onClick={() => setView('trash')}
                title={`Trash (${trashedIds.size})`}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between gap-2 whitespace-nowrap md:whitespace-normal ${
                  explorerNavCollapsed ? 'md:justify-center md:px-2' : ''
                } ${
                  view === 'trash'
                    ? 'bg-surface-container-lowest text-primary ambient-shadow'
                    : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 md:hidden">
                  delete
                </span>
                <span className={explorerNavCollapsed ? 'md:sr-only' : ''}>
                  Trash
                </span>
                <span
                  className={`text-xs font-semibold tabular-nums opacity-80 ${
                    explorerNavCollapsed ? 'md:sr-only' : ''
                  }`}
                >
                  {trashedIds.size}
                </span>
                {explorerNavCollapsed ? (
                  <span className="material-symbols-outlined text-[20px] shrink-0 hidden md:inline">
                    delete
                  </span>
                ) : null}
              </button>
            </li>
          </ul>

          <h2
            className={`hidden md:block font-headline text-xs tracking-[0.05em] uppercase text-on-surface-variant font-semibold ${
              explorerNavCollapsed ? 'sr-only' : 'mb-4'
            }`}
          >
            Curated streams
          </h2>
          <ul className="flex md:flex-col gap-1 min-w-max md:min-w-0 pb-1 md:pb-0">
            <li className="md:w-full">
              <button
                type="button"
                onClick={() => setCategory(ALL)}
                title="All posts"
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal flex md:items-center gap-2 ${
                  explorerNavCollapsed ? 'md:justify-center md:px-2' : ''
                } ${
                  effectiveCategory === ALL
                    ? 'bg-surface-container-lowest text-primary ambient-shadow'
                    : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 md:hidden">
                  stacks
                </span>
                <span className={explorerNavCollapsed ? 'md:sr-only' : ''}>
                  All posts
                </span>
                {explorerNavCollapsed ? (
                  <span className="material-symbols-outlined text-[20px] shrink-0 hidden md:inline">
                    stacks
                  </span>
                ) : null}
              </button>
            </li>
            {snapshot.categories.map((c) => (
              <li key={c} className="md:w-full">
                <button
                  type="button"
                  onClick={() => setCategory(c)}
                  title={formatCategoryLabel(c)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal flex md:items-center gap-2 ${
                    explorerNavCollapsed ? 'md:justify-center md:px-2' : ''
                  } ${
                    effectiveCategory === c
                      ? 'bg-surface-container-lowest text-primary ambient-shadow'
                      : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0 md:hidden">
                    label
                  </span>
                  <span
                    className={`truncate ${explorerNavCollapsed ? 'md:sr-only' : ''}`}
                  >
                    {formatCategoryLabel(c)}
                  </span>
                  {explorerNavCollapsed ? (
                    <span className="material-symbols-outlined text-[20px] shrink-0 hidden md:inline">
                      label
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>

          <h2
            className={`hidden md:block font-headline text-xs tracking-[0.05em] uppercase text-on-surface-variant font-semibold ${
              explorerNavCollapsed ? 'sr-only' : 'mt-8 mb-3'
            }`}
          >
            Active filters
          </h2>
          <div
            className={`hidden md:flex flex-wrap gap-2 ${
              explorerNavCollapsed ? 'flex-col items-center' : ''
            }`}
          >
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
            <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
              <div>
                <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
                  {streamTitle}
                </h2>
                <p className="text-sm text-on-surface-variant mt-2 font-body">
                  {view === 'default' && (
                    <>
                      Showing {filtered.length.toLocaleString()} visible posts
                      {effectiveCategory === ALL ? '' : ' in this stream'}
                      {search.trim() ? ' matching search' : ''} (
                      {snapshot.posts.length.toLocaleString()} in archive;{' '}
                      {trashedIds.size} in trash).
                    </>
                  )}
                  {view === 'saved' && (
                    <>
                      {filtered.length.toLocaleString()} saved
                      {search.trim() || effectiveCategory !== ALL
                        ? ' match this stream and search'
                        : ''}
                      .
                    </>
                  )}
                  {view === 'trash' && (
                    <>
                      {filtered.length.toLocaleString()} in trash for this
                      stream. Restore to return to the feed.
                    </>
                  )}
                </p>
              </div>
              {view === 'trash' && trashedIds.size > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Remove all tweets from trash for this archive? They will reappear in the feed.',
                      )
                    )
                      emptyTrash()
                  }}
                  className="text-sm font-medium text-error hover:underline underline-offset-4"
                >
                  Empty trash
                </button>
              ) : null}
            </div>

            <div className="space-y-8">
              {filtered.map((post) => (
                <TweetRow key={post.id} post={post} />
              ))}
              {filtered.length === 0 ? (
                <p className="text-center text-on-surface-variant text-sm py-12">
                  {view === 'saved'
                    ? 'No saved tweets match this stream and search.'
                    : view === 'trash'
                      ? 'Trash is empty for this stream.'
                      : 'No posts match this stream and search.'}
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
  const { view, isSaved, saveTweet, unsaveTweet, trashTweet, restoreTweet } =
    useTweetLibrary()
  const pc = primaryCategory(post.scores)
  const topScores = Object.entries(post.scores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  const saved = isSaved(post.id)

  return (
    <article className="bg-surface-container-lowest rounded-xl p-6 md:p-8 ambient-shadow border border-outline-variant/10 relative group">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-1">
        {view === 'trash' ? (
          <button
            type="button"
            onClick={() => restoreTweet(post.id)}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
            title="Restore to feed"
          >
            <span className="material-symbols-outlined text-[22px]">
              undo
            </span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => (saved ? unsaveTweet(post.id) : saveTweet(post.id))}
              className={`p-2 rounded-lg transition-colors ${
                saved
                  ? 'text-primary bg-primary/10'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
              }`}
              title={saved ? 'Remove from saved' : 'Save tweet'}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${saved ? 'filled' : ''}`}
              >
                bookmark
              </span>
            </button>
            <button
              type="button"
              onClick={() => trashTweet(post.id)}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-error-container/15 hover:text-error transition-colors"
              title="Move to trash"
            >
              <span className="material-symbols-outlined text-[22px]">
                delete
              </span>
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3 pr-20">
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
        {saved && view !== 'saved' ? (
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
            Saved
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
