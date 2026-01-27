import { ElectronAPI } from '@electron-toolkit/preload'

export type PostStatus = 'draft' | 'pending' | 'published' | 'failed'

export interface Post {
  id: string
  type: 'ag' | 'pro' | 'br' | 'in'
  content: string
  topic: string
  createdAt: string
  thread?: string[]
  // 예약 발행 관련 필드
  status: PostStatus
  scheduledAt?: string
  publishedAt?: string
  threadsPostId?: string
  errorMessage?: string
}

export interface AppConfig {
  perplexityApiKey: string
  gcpProjectId: string
  gcpServiceAccountKey: string
  autoGenerateEnabled: boolean
  autoGenerateInterval: number
  prompts: {
    ag: string
    pro: string
    br: string
    in: string
  }
  // 게시하기 설정
  threadProfileUrl: string
  hourlyReminderEnabled: boolean
  // Threads API 설정
  threadsClientId: string
  threadsClientSecret: string
  threadsRedirectUri: string
  threadsAccessToken: string
  threadsUserId: string
  // RAG 스타일 학습 설정
  ragEnabled: boolean
  ragAutoSavePublished: boolean
  ragSimilarCount: number
}

// RAG 스타일 참조 인터페이스
export interface StyleReference {
  id: string
  content: string
  topic: string
  embedding: number[]
  createdAt: string
  source: 'manual' | 'published'
}

export interface AutoGenerationStatus {
  enabled: boolean
  interval: number
  isGenerating: boolean
}

export interface PublishStatus {
  enabled: boolean
  threadProfileUrl: string
  nextReminderTime: string | null
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      config: {
        get: () => Promise<AppConfig>
        set: (config: Partial<AppConfig>) => Promise<AppConfig>
      }
      posts: {
        get: () => Promise<Post[]>
        delete: (id: string) => Promise<Post[]>
      }
      generate: {
        post: (type: Post['type'], topic: string) => Promise<Post>
        bulk: (type: Post['type'], count: number, topic: string) => Promise<Post[]>
        auto: () => Promise<Post>
      }
      autoGeneration: {
        start: () => Promise<AutoGenerationStatus>
        stop: () => Promise<AutoGenerationStatus>
        status: () => Promise<AutoGenerationStatus>
        setConfig: (enabled: boolean, interval: number) => Promise<AutoGenerationStatus>
        onGenerating: (callback: (isGenerating: boolean) => void) => () => void
        onGenerated: (callback: (post: Post) => void) => () => void
      }
      publish: {
        startReminder: () => Promise<PublishStatus>
        stopReminder: () => Promise<PublishStatus>
        openThreads: () => Promise<void>
        getStatus: () => Promise<PublishStatus>
        setConfig: (url: string, enabled: boolean) => Promise<PublishStatus>
      }
      threads: {
        getAuthUrl: () => Promise<{ success: boolean; url?: string; error?: string }>
        openAuth: () => Promise<{ success: boolean; url?: string; error?: string }>
        exchangeToken: (code: string) => Promise<{ success: boolean; accessToken?: string; userId?: string; error?: string }>
        refreshToken: () => Promise<{ success: boolean; accessToken?: string; error?: string }>
        test: () => Promise<{ success: boolean; username?: string; error?: string }>
        publish: (postId: string) => Promise<{ success: boolean; threadsPostId?: string; error?: string }>
        checkLimit: () => Promise<{ used: number; limit: number }>
      }
      schedule: {
        set: (postId: string, scheduledAt: string) => Promise<Post>
        cancel: (postId: string) => Promise<Post>
        update: (postId: string, scheduledAt: string) => Promise<Post>
        onPublished: (callback: (post: Post) => void) => () => void
        onFailed: (callback: (post: Post) => void) => () => void
      }
      style: {
        getAll: () => Promise<StyleReference[]>
        add: (content: string, topic: string) => Promise<StyleReference>
        addFromPost: (postId: string) => Promise<StyleReference>
        delete: (id: string) => Promise<StyleReference[]>
        clear: () => Promise<StyleReference[]>
        count: () => Promise<number>
      }
    }
  }
}
