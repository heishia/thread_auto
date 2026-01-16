import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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
}

export interface AutoGenerationStatus {
  enabled: boolean
  interval: number
  isGenerating: boolean
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
