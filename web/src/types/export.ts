export type TweetScores = Record<string, number>

export type TweetPost = {
  id: string
  url: string
  author: string
  text: string
  createdAt: string
  capturedAt?: number
  metrics?: {
    replies?: number
    reposts?: number
    likes?: number
    views?: number
  }
  profileHandle?: string
  tags: string[]
  scores: TweetScores
  activeDecision?: string
  confidence?: number
  reasons: string[]
}

export type TweetExport = {
  generatedAt?: string
  mode?: string
  classifier?: string
  profileDeepScan?: boolean
  posts: TweetPost[]
}

export type CurationSnapshot = {
  exportMeta: {
    generatedAt?: string
    mode?: string
    classifier?: string
    postCount: number
  }
  posts: TweetPost[]
  categories: string[]
  savedAt: string
}
