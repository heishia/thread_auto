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

export type PostType = Post['type']

export const POST_TYPE_LABELS: Record<PostType, string> = {
  ag: 'Aggro',
  pro: 'Proof',
  br: 'Brand',
  in: 'Insight'
}

export const POST_TYPE_COLORS: Record<PostType, string> = {
  ag: 'bg-notion-tag-ag',
  pro: 'bg-notion-tag-pro',
  br: 'bg-notion-tag-br',
  in: 'bg-notion-tag-in'
}
