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
  geminiApiKey: string
  perplexityApiKey: string
  gcpProjectId: string
  gcpApiKey: string
  useVertexAI: boolean
  autoGenerateEnabled: boolean
  autoGenerateInterval: number
  prompts: {
    ag: string
    pro: string
    br: string
    in: string
  }
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
        auto: () => Promise<Post>
      }
    }
  }
}
