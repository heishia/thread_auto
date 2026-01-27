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
  scheduledAt?: string      // ISO 날짜 (예약 발행 시간)
  publishedAt?: string      // ISO 날짜 (실제 발행 시간)
  threadsPostId?: string    // Threads에 발행된 게시물 ID
  errorMessage?: string     // 실패 시 에러 메시지
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

export type PostType = Post['type']

export const POST_TYPE_LABELS: Record<PostType, string> = {
  ag: '후킹',
  pro: '증명',
  br: '브랜드',
  in: '인사이트'
}

export const POST_TYPE_COLORS: Record<PostType, string> = {
  ag: 'bg-notion-tag-ag',
  pro: 'bg-notion-tag-pro',
  br: 'bg-notion-tag-br',
  in: 'bg-notion-tag-in'
}
