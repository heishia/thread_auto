import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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
  threadsAccessToken: string
  threadsUserId: string
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

const api = {
  config: {
    get: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
    set: (config: Partial<AppConfig>): Promise<AppConfig> =>
      ipcRenderer.invoke('config:set', config)
  },
  posts: {
    get: (): Promise<Post[]> => ipcRenderer.invoke('posts:get'),
    delete: (id: string): Promise<Post[]> => ipcRenderer.invoke('posts:delete', id)
  },
  generate: {
    post: (type: Post['type'], topic: string): Promise<Post> =>
      ipcRenderer.invoke('generate:post', type, topic),
    bulk: (type: Post['type'], count: number, topic: string): Promise<Post[]> =>
      ipcRenderer.invoke('generate:bulk', type, count, topic),
    auto: (): Promise<Post> => ipcRenderer.invoke('generate:auto')
  },
  autoGeneration: {
    start: (): Promise<AutoGenerationStatus> => ipcRenderer.invoke('auto:start'),
    stop: (): Promise<AutoGenerationStatus> => ipcRenderer.invoke('auto:stop'),
    status: (): Promise<AutoGenerationStatus> => ipcRenderer.invoke('auto:status'),
    setConfig: (enabled: boolean, interval: number): Promise<AutoGenerationStatus> =>
      ipcRenderer.invoke('auto:setConfig', enabled, interval),
    onGenerating: (callback: (isGenerating: boolean) => void) => {
      const handler = (_: unknown, isGenerating: boolean) => callback(isGenerating)
      ipcRenderer.on('auto:generating', handler)
      return () => ipcRenderer.removeListener('auto:generating', handler)
    },
    onGenerated: (callback: (post: Post) => void) => {
      const handler = (_: unknown, post: Post) => callback(post)
      ipcRenderer.on('auto:generated', handler)
      return () => ipcRenderer.removeListener('auto:generated', handler)
    }
  },
  // 게시하기 (정각 알림)
  publish: {
    startReminder: (): Promise<PublishStatus> => ipcRenderer.invoke('publish:startReminder'),
    stopReminder: (): Promise<PublishStatus> => ipcRenderer.invoke('publish:stopReminder'),
    openThreads: (): Promise<void> => ipcRenderer.invoke('publish:openThreads'),
    getStatus: (): Promise<PublishStatus> => ipcRenderer.invoke('publish:getStatus'),
    setConfig: (url: string, enabled: boolean): Promise<PublishStatus> =>
      ipcRenderer.invoke('publish:setConfig', url, enabled)
  },
  // Threads API
  threads: {
    test: (): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('threads:test'),
    publish: (postId: string): Promise<{ success: boolean; threadsPostId?: string; error?: string }> =>
      ipcRenderer.invoke('threads:publish', postId),
    checkLimit: (): Promise<{ used: number; limit: number }> =>
      ipcRenderer.invoke('threads:checkLimit')
  },
  // 예약 발행
  schedule: {
    set: (postId: string, scheduledAt: string): Promise<Post> =>
      ipcRenderer.invoke('schedule:set', postId, scheduledAt),
    cancel: (postId: string): Promise<Post> =>
      ipcRenderer.invoke('schedule:cancel', postId),
    update: (postId: string, scheduledAt: string): Promise<Post> =>
      ipcRenderer.invoke('schedule:update', postId, scheduledAt),
    onPublished: (callback: (post: Post) => void) => {
      const handler = (_: unknown, post: Post) => callback(post)
      ipcRenderer.on('schedule:published', handler)
      return () => ipcRenderer.removeListener('schedule:published', handler)
    },
    onFailed: (callback: (post: Post) => void) => {
      const handler = (_: unknown, post: Post) => callback(post)
      ipcRenderer.on('schedule:failed', handler)
      return () => ipcRenderer.removeListener('schedule:failed', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}
