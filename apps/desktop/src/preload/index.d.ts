import { ElectronAPI } from '@electron-toolkit/preload'

export interface Post {
  id: string
  type: 'ag' | 'pro' | 'br' | 'in'
  content: string
  topic: string
  createdAt: string
  thread?: string[]
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
    }
  }
}
