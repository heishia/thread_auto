import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface Post {
  id: string
  type: 'ag' | 'pro' | 'br' | 'in'
  content: string
  topic: string
  createdAt: string
}

export interface AppConfig {
  geminiApiKey: string
  autoGenerateEnabled: boolean
  autoGenerateInterval: number
  prompts: {
    ag: string
    pro: string
    br: string
    in: string
  }
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
    auto: (): Promise<Post> => ipcRenderer.invoke('generate:auto')
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
