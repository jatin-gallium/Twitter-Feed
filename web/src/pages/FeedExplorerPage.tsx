import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCuration } from '@/context/useCuration'
import { useTweetLibrary } from '@/context/useTweetLibrary'
import { useForeverLibrary } from '@/context/useForeverLibrary'
import { LazyTweetEmbed } from '@/components/LazyTweetEmbed'
import { ScrollAssist } from '@/components/ScrollAssist'
import { formatCategoryLabel, primaryCategory } from '@/lib/format'
import {
  filterPostsBySearch,
  postMatchesCategory,
} from '@/lib/parseExport'
import type { TweetPost } from '@/types/export'
import {
  readEmbedTheme,
  readExplorerNavCollapsed,
  readFeedDensity,
  writeEmbedTheme,
  writeExplorerNavCollapsed,
  writeFeedDensity,
  type EmbedTheme,
  type FeedDensity,
} from '@/lib/layoutPrefs'

const ALL = '__all__'

export function FeedExplorerPage() {
  const { snapshot } = useCuration()
  const {
    view,
    setView,
    savedIds,
    trashedIds,
    saveNotes,
    emptyTrash,
    purgeTrashedFromArchive,
    setSaveNote,
    saveTweet,
    isSaved,
  } = useTweetLibrary()
  const {
    foreverPosts,
    foreverCount,
    foreverNotes: globalForeverNotes,
  } = useForeverLibrary()
  const [category, setCategory] = useState<string>(ALL)
  const [search, setSearch] = useState('')
  const [explorerNavCollapsed, setExplorerNavCollapsed] = useState(
    () => readExplorerNavCollapsed(),
  )
  const feedScrollRef = useRef<HTMLElement | null>(null)
  const [feedScrollEl, setFeedScrollEl] = useState<HTMLElement | null>(null)
  const [embedTheme, setEmbedTheme] = useState<EmbedTheme>(() => readEmbedTheme())
  const [feedDensity, setFeedDensity] = useState<FeedDensity>(() =>
    readFeedDensity(),
  )
  const [expandedText, setExpandedText] = useState<Set<string>>(() => new Set())
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})

  const toggleExplorerNav = useCallback(() => {
    setExplorerNavCollapsed((v) => {
      const next = !v
      writeExplorerNavCollapsed(next)
      return next
    })
  }, [])

  const toggleEmbedTheme = useCallback(() => {
    setEmbedTheme((t) => {
      const next: EmbedTheme = t === 'light' ? 'dark' : 'light'
      writeEmbedTheme(next)
      return next
    })
  }, [])

  const toggleDensity = useCallback(() => {
    setFeedDensity((d) => {
      const next: FeedDensity = d === 'comfy' ? 'compact' : 'comfy'
      writeFeedDensity(next)
      return next
    })
  }, [])

  const toggleTextExpand = useCallback((id: string) => {
    setExpandedText((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const compact = feedDensity === 'compact'

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
    if (view === 'forever') {
      return filterPostsBySearch(foreverPosts, search)
    }
    if (view === 'saved') {
      return streamFiltered.filter(
        (p) => savedIds.has(p.id) && !trashedIds.has(p.id),
      )
    }
    if (view === 'trash') {
      return streamFiltered.filter((p) => trashedIds.has(p.id))
    }
    return streamFiltered.filter((p) => !trashedIds.has(p.id))
  }, [streamFiltered, view, savedIds, trashedIds, foreverPosts, search])

  if (!snapshot && view !== 'forever') {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">
          No archive loaded
        </h2>
        <p className="text-on-surface-variant max-w-md mb-6">
          Upload your JSON export first, then return here to explore streams.
          You can still open <strong>Forever</strong> in the sidebar to see pins
          without loading a file.
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
    view === 'forever'
      ? 'Forever'
      : view === 'saved'
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
          <button
            type="button"
            onClick={toggleDensity}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
            title={
              compact
                ? 'Density: compact — click for comfy'
                : 'Density: comfy — click for compact'
            }
            aria-label="Toggle feed density"
          >
            <span className="material-symbols-outlined text-2xl">
              {compact ? 'view_compact' : 'view_comfy'}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleEmbedTheme}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
            title={
              embedTheme === 'dark'
                ? 'Tweet embeds: dark — click for light'
                : 'Tweet embeds: light — click for dark'
            }
            aria-label="Toggle tweet embed theme"
          >
            <span className="material-symbols-outlined text-2xl">
              {embedTheme === 'dark' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              feedScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            }
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
            title="Back to top"
            aria-label="Back to top"
          >
            <span className="material-symbols-outlined text-2xl">
              vertical_align_top
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
                disabled={!snapshot}
                onClick={() => snapshot && setView('default')}
                title={snapshot ? 'Feed' : 'Load an archive first'}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal flex md:items-center gap-2 ${
                  explorerNavCollapsed ? 'md:justify-center md:px-2' : ''
                } ${
                  !snapshot
                    ? 'opacity-40 cursor-not-allowed'
                    : view === 'default'
                      ? 'bg-surface-container-lowest text-primary ambient-shadow'
                      : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] shrink-0 ${
                    explorerNavCollapsed ? 'inline' : 'max-md:inline md:hidden'
                  }`}
                >
                  dynamic_feed
                </span>
                {explorerNavCollapsed ? (
                  <span className="sr-only">Feed</span>
                ) : (
                  <span className="max-md:inline md:inline">Feed</span>
                )}
              </button>
            </li>
            <li className="md:w-full">
              <button
                type="button"
                disabled={!snapshot}
                onClick={() => snapshot && setView('saved')}
                title={
                  snapshot
                    ? `Saved (${savedIds.size})`
                    : 'Load an archive first'
                }
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between gap-2 whitespace-nowrap md:whitespace-normal ${
                  explorerNavCollapsed ? 'md:justify-center md:px-2' : ''
                } ${
                  !snapshot
                    ? 'opacity-40 cursor-not-allowed'
                    : view === 'saved'
                      ? 'bg-surface-container-lowest text-primary ambient-shadow'
                      : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] shrink-0 ${
                    explorerNavCollapsed
                      ? `inline ${view === 'saved' ? 'filled text-primary' : ''}`
                      : `max-md:inline md:hidden ${view === 'saved' ? 'filled text-primary' : ''}`
                  }`}
                >
                  bookmark
                </span>
                {explorerNavCollapsed ? (
                  <span className="sr-only">
                    Saved ({savedIds.size})
                  </span>
                ) : (
                  <>
                    <span className="max-md:inline md:inline flex-1 text-left md:flex-none">
                      Saved
                    </span>
                    <span className="max-md:inline md:inline text-xs font-semibold tabular-nums opacity-80">
                      {savedIds.size}
                    </span>
                  </>
                )}
              </button>
            </li>
            <li className="md:w-full">
              <button
                type="button"
                disabled={!snapshot}
                onClick={() => snapshot && setView('trash')}
                title={
                  snapshot
                    ? `Trash (${trashedIds.size})`
                    : 'Load an archive first'
                }
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between gap-2 whitespace-nowrap md:whitespace-normal ${
                  explorerNavCollapsed ? 'md:justify-center md:px-2' : ''
                } ${
                  !snapshot
                    ? 'opacity-40 cursor-not-allowed'
                    : view === 'trash'
                      ? 'bg-surface-container-lowest text-primary ambient-shadow'
                      : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] shrink-0 ${
                    explorerNavCollapsed ? 'inline' : 'max-md:inline md:hidden'
                  }`}
                >
                  delete
                </span>
                {explorerNavCollapsed ? (
                  <span className="sr-only">
                    Trash ({trashedIds.size})
                  </span>
                ) : (
                  <>
                    <span className="max-md:inline md:inline flex-1 text-left md:flex-none">
                      Trash
                    </span>
                    <span className="max-md:inline md:inline text-xs font-semibold tabular-nums opacity-80">
                      {trashedIds.size}
                    </span>
                  </>
                )}
              </button>
            </li>
            <li className="md:w-full">
              <button
                type="button"
                onClick={() => setView('forever')}
                title={`Forever (${foreverCount}) — kept across uploads`}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between gap-2 whitespace-nowrap md:whitespace-normal ${
                  explorerNavCollapsed ? 'md:justify-center md:px-2' : ''
                } ${
                  view === 'forever'
                    ? 'bg-surface-container-lowest text-primary ambient-shadow'
                    : 'text-on-surface-variant hover:bg-surface-container-lowest/60 hover:text-on-surface'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] shrink-0 ${
                    explorerNavCollapsed ? 'inline filled' : 'max-md:inline md:hidden filled'
                  }`}
                >
                  keep
                </span>
                {explorerNavCollapsed ? (
                  <span className="sr-only">
                    Forever ({foreverCount})
                  </span>
                ) : (
                  <>
                    <span className="max-md:inline md:inline flex-1 text-left md:flex-none">
                      Forever
                    </span>
                    <span className="max-md:inline md:inline text-xs font-semibold tabular-nums opacity-80">
                      {foreverCount}
                    </span>
                  </>
                )}
              </button>
            </li>
          </ul>

          {snapshot ? (
            <>
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
                    <span
                      className={`material-symbols-outlined text-[20px] shrink-0 ${
                        explorerNavCollapsed ? 'inline' : 'max-md:inline md:hidden'
                      }`}
                    >
                      stacks
                    </span>
                    {explorerNavCollapsed ? (
                      <span className="sr-only">All posts</span>
                    ) : (
                      <span className="max-md:inline md:inline">All posts</span>
                    )}
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
                      <span
                        className={`material-symbols-outlined text-[20px] shrink-0 ${
                          explorerNavCollapsed
                            ? 'inline'
                            : 'max-md:inline md:hidden'
                        }`}
                      >
                        label
                      </span>
                      {explorerNavCollapsed ? (
                        <span className="sr-only">{formatCategoryLabel(c)}</span>
                      ) : (
                        <span className="max-md:inline md:inline truncate">
                          {formatCategoryLabel(c)}
                        </span>
                      )}
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
            </>
          ) : null}
        </aside>

        <section
          ref={(el) => {
            feedScrollRef.current = el
            setFeedScrollEl(el)
          }}
          className="flex-1 overflow-y-auto no-scrollbar bg-background p-3 md:p-6 min-h-0 relative"
        >
          <ScrollAssist scrollEl={feedScrollEl} />
          <div className="max-w-[2000px] mx-auto">
            <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
              <div>
                <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
                  {streamTitle}
                </h2>
                <p className="text-sm text-on-surface-variant mt-2 font-body">
                  {view === 'default' && snapshot && (
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
                  {view === 'forever' && (
                    <>
                      {filtered.length.toLocaleString()} pinned forever in this
                      browser (survives new uploads). Search filters this list.
                    </>
                  )}
                </p>
              </div>
              {view === 'trash' && trashedIds.size > 0 ? (
                <div className="flex flex-wrap gap-2 justify-end">
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
                    className="text-sm font-medium text-on-surface-variant hover:underline underline-offset-4"
                  >
                    Empty trash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Permanently delete ${trashedIds.size} tweet(s) from this archive? They will be removed from the JSON in memory and cannot be restored.`,
                        )
                      )
                        return
                      purgeTrashedFromArchive()
                    }}
                    className="text-sm font-medium text-error hover:underline underline-offset-4"
                  >
                    Purge from archive
                  </button>
                </div>
              ) : null}
            </div>

            <div
              className={`grid gap-4 md:gap-5 pb-24 ${
                compact
                  ? 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'
                  : 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3'
              }`}
            >
              {filtered.map((post) => {
                const persisted = saveNotes[post.id] ?? ''
                const draft = draftNotes[post.id]
                const noteValue =
                  persisted || (draft !== undefined ? draft : '')
                const foreverNote =
                  globalForeverNotes[post.id] ?? ''
                return (
                  <TweetRow
                    key={post.id}
                    post={post}
                    embedTheme={embedTheme}
                    compact={compact}
                    textExpanded={expandedText.has(post.id)}
                    onToggleTextExpand={() => toggleTextExpand(post.id)}
                    saveNoteDraft={noteValue}
                    foreverNoteDraft={foreverNote}
                    onSaveNoteChange={(note) => {
                      if (isSaved(post.id)) setSaveNote(post.id, note)
                      else setDraftNotes((d) => ({ ...d, [post.id]: note }))
                    }}
                    onSaveWithNote={(note) => {
                      saveTweet(post.id, note)
                      setDraftNotes((d) => {
                        const next = { ...d }
                        delete next[post.id]
                        return next
                      })
                    }}
                  />
                )
              })}
              {filtered.length === 0 ? (
                <p className="text-center text-on-surface-variant text-sm py-12">
                  {view === 'forever'
                    ? 'Nothing pinned yet. Use Keep on a tweet to save it here forever.'
                    : view === 'saved'
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

function TweetRow({
  post,
  embedTheme,
  compact,
  textExpanded,
  onToggleTextExpand,
  saveNoteDraft,
  foreverNoteDraft,
  onSaveNoteChange,
  onSaveWithNote,
}: {
  post: TweetPost
  embedTheme: 'light' | 'dark'
  compact: boolean
  textExpanded: boolean
  onToggleTextExpand: () => void
  saveNoteDraft: string
  foreverNoteDraft: string
  onSaveNoteChange: (note: string) => void
  onSaveWithNote: (note: string) => void
}) {
  const { view, isSaved, unsaveTweet, trashTweet, restoreTweet } =
    useTweetLibrary()
  const {
    isForeverPinned,
    pinForever,
    unpinForever,
    setForeverNote,
  } = useForeverLibrary()
  const forever = isForeverPinned(post.id)
  const pc = primaryCategory(post.scores)
  const topScores = Object.entries(post.scores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, compact ? 3 : 4)

  const saved = isSaved(post.id)
  const pad = compact ? 'p-4' : 'p-6 md:p-7'

  return (
    <article
      className={`bg-surface-container-lowest rounded-xl ${pad} ambient-shadow border border-outline-variant/10 relative group flex flex-col min-h-0`}
    >
      <div
        className={`absolute ${compact ? 'top-2 right-2' : 'top-3 right-3'} flex items-center gap-0.5 flex-wrap justify-end max-w-[min(100%,11rem)]`}
      >
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
        ) : view === 'forever' ? (
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Remove this tweet from Forever? It stays in any current archive until you trash it there.',
                )
              )
                unpinForever(post.id)
            }}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-error-container/15 hover:text-error transition-colors"
            title="Remove from Forever"
          >
            <span className="material-symbols-outlined text-[22px]">
              keep_off
            </span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() =>
                forever
                  ? unpinForever(post.id)
                  : pinForever(post, saveNoteDraft || foreverNoteDraft)
              }
              className={`p-2 rounded-lg transition-colors ${
                forever
                  ? 'text-tertiary bg-tertiary-container/40'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-tertiary'
              }`}
              title={
                forever
                  ? 'Remove from Forever (keeps in this archive)'
                  : 'Keep forever — survives new uploads'
              }
            >
              <span
                className={`material-symbols-outlined text-[22px] ${forever ? 'filled' : ''}`}
              >
                keep
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                saved ? unsaveTweet(post.id) : onSaveWithNote(saveNoteDraft)
              }
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

      <div className={`flex flex-wrap gap-1.5 mb-2 ${compact ? 'pr-16' : 'pr-20'}`}>
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
        {saved && view !== 'saved' && view !== 'forever' ? (
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
            Saved
          </span>
        ) : null}
        {forever && view !== 'forever' ? (
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-tertiary-container/80 text-tertiary text-xs font-medium">
            Forever
          </span>
        ) : null}
      </div>
      <p
        className={`text-on-surface-variant mb-1 font-medium ${compact ? 'text-[11px]' : 'text-xs'}`}
      >
        {post.author}
        {post.createdAt
          ? ` · ${new Date(post.createdAt).toLocaleString()}`
          : ''}
      </p>
      <p
        className={`text-on-surface font-body leading-relaxed mb-2 ${compact ? 'text-[13px]' : 'text-[15px]'} ${
          textExpanded ? '' : compact ? 'line-clamp-3' : 'line-clamp-5'
        }`}
      >
        {post.text}
      </p>
      {post.text.length > 120 ? (
        <button
          type="button"
          onClick={onToggleTextExpand}
          className="text-xs font-medium text-primary mb-2 hover:underline text-left"
        >
          {textExpanded ? 'Show less' : 'Show full text'}
        </button>
      ) : null}
      {(view === 'saved' ||
        (!saved && view !== 'trash' && view !== 'forever')) && (
        <label className="block mb-2">
          <span className="sr-only">Save note</span>
          <span className="text-[10px] uppercase tracking-wide text-on-surface-variant font-semibold block mb-1">
            {view === 'saved'
              ? 'Your note'
              : 'Note (optional, saved with bookmark)'}
          </span>
          <textarea
            value={saveNoteDraft}
            onChange={(e) => onSaveNoteChange(e.target.value)}
            rows={view === 'saved' ? 2 : 1}
            placeholder="Why this matters…"
            className="w-full text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low px-2 py-1.5 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[2rem]"
          />
        </label>
      )}
      {view === 'forever' && (
        <label className="block mb-2">
          <span className="text-[10px] uppercase tracking-wide text-on-surface-variant font-semibold block mb-1">
            Forever note
          </span>
          <textarea
            value={foreverNoteDraft}
            onChange={(e) => setForeverNote(post.id, e.target.value)}
            rows={2}
            placeholder="Why you kept this…"
            className="w-full text-xs rounded-lg border border-outline-variant/30 bg-surface-container-low px-2 py-1.5 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-tertiary/25 resize-y min-h-[2rem]"
          />
        </label>
      )}
      {topScores.length > 0 ? (
        <div
          className={`flex flex-wrap gap-1.5 mb-2 text-on-surface-variant ${compact ? 'text-[10px]' : 'text-[11px]'}`}
        >
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
      <LazyTweetEmbed
        url={post.url}
        theme={embedTheme}
        className="min-h-[100px] flex-1"
      />
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
