import Store from 'electron-store'

export type PostStatus = 'draft' | 'pending' | 'published' | 'failed'

export interface Post {
  id: string
  type: 'ag' | 'pro' | 'br' | 'in'
  content: string
  topic: string
  createdAt: string
  thread?: string[] // 연결된 게시물들 (스레드)
  // 예약 발행 관련 필드
  status: PostStatus
  scheduledAt?: string      // ISO 날짜 (예약 발행 시간)
  publishedAt?: string      // ISO 날짜 (실제 발행 시간)
  threadsPostId?: string    // Threads에 발행된 게시물 ID
  errorMessage?: string     // 실패 시 에러 메시지
}

// RAG 스타일 참조를 위한 인터페이스
export interface StyleReference {
  id: string
  content: string           // 원본 글 내용
  topic: string             // 주제
  embedding: number[]       // 벡터 임베딩
  createdAt: string
  source: 'manual' | 'published'  // 수동 추가 또는 발행된 글에서 자동 추가
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
  ragEnabled: boolean                    // RAG 기능 활성화 여부
  ragAutoSavePublished: boolean          // 발행된 글 자동 저장 여부
  ragSimilarCount: number                // 참조할 유사 글 개수 (1~5)
}

interface StoreSchema {
  config: AppConfig
  posts: Post[]
  styleReferences: StyleReference[]  // RAG용 스타일 참조 글
}

// 모든 타입에 공통으로 적용되는 기본 프롬프트 (UI에 표시되지 않음)
const basePrompt = `[역할]
너는 kimppopp_야. 쓰레드에서 바이브 코딩과 AI 전문가로 활동하는 인플루언서다.
독자들에게 실용적이고 즉시 써먹을 수 있는 정보를 제공하면서, 동시에 FOMO(놓치면 손해)를 자극해야 해.

[말투 및 스타일]
- 반말 이지만 친근하고 예의바른 어투를 사용 진지한 말투 사용.
- 자신감 있고 직설적인 톤
- 가끔 따뜻한 격려도 섞어줘

[필수 작성 규칙]
1. 한 줄은 최대 30자까지만 작성 
2. 온점은 생략해줘 (있다고 생각하기)
4. 실용적이고 바로 써먹을 수 있는 내용
5. 좋아요/리포스트 유도 저장하고 싶은 내용으로 구성 
6. 이어지는 쓰레드 형식중 첫번째 글은 3~5줄로 구성, 그 이후 이어지는 쓰레드는 4~6줄로 구성
8. 첫번째 후킹 글은 담백하게 작성 (과장된 표현, 감탄사 남발 금지)
9. 대략 3줄마다 빈 줄(줄바꿈)을 넣어서 의미 단위로 구분해줘 (답답하지 않게)

[금지 사항]
- 추상적이거나 뻔한 이야기 금지
- 어려보이는 말투, 단어 사용금지 
- 수치/퍼센트/숫자 남발 금지 (전체 스레드에서 1번만)

`

// 각 타입별 커스텀 프롬프트 (UI에서 수정 가능)
const defaultPrompts = {
  ag: `[타입: 어그로]
목적: 도달률 극대화, 광범위한 주제로 관심 끌기
특징: 첫 줄 후킹이 생명, 논란의 여지가 있거나 의외의 정보 제공`,
  
  pro: `[타입: 증명]
목적: 실력 과시, 관심 있는 독자를 팔로워로 전환
특징: 구체적인 성과와 숫자, 실제 경험담, 비포/애프터 비교`,
  
  br: `[타입: 브랜딩]
목적: 가치관과 철학 공유, 브랜드 정체성 구축
특징: 개인적 스토리, 신념, 개발 철학, 실패담도 OK`,
  
  in: `[타입: 인사이트]
목적: 깊이 있는 정보 제공, 전문성 입증
특징: 바이브 코딩 관련 상세 정보, 도구 사용법, 비교 분석, 팁과 트릭`
}

// 전체 프롬프트를 조합하는 함수
export function getFullPrompt(type: 'ag' | 'pro' | 'br' | 'in'): string {
  const config = getConfig()
  const customPrompt = config.prompts[type]
  return `${basePrompt}\n${customPrompt}`
}

const store = new Store<StoreSchema>({
  defaults: {
    config: {
      perplexityApiKey: '',
      gcpProjectId: '',
      gcpServiceAccountKey: '',
      autoGenerateEnabled: false,
      autoGenerateInterval: 15,
      prompts: defaultPrompts,
      // 게시하기 기본값
      threadProfileUrl: 'https://www.threads.com/@kimppopp_',
      hourlyReminderEnabled: false,
      // Threads API 기본값
      threadsClientId: '',
      threadsClientSecret: '',
      threadsRedirectUri: 'https://www.facebook.com/connect/login_success.html',
      threadsAccessToken: '',
      threadsUserId: '',
      // RAG 기본값
      ragEnabled: false,
      ragAutoSavePublished: true,
      ragSimilarCount: 3
    },
    posts: [],
    styleReferences: []
  }
})

export function getConfig(): AppConfig {
  return store.get('config')
}

export function setConfig(config: Partial<AppConfig>): void {
  const current = store.get('config')
  store.set('config', { ...current, ...config })
}

export function getPosts(): Post[] {
  return store.get('posts')
}

export function addPost(post: Post): void {
  const posts = store.get('posts')
  // status 기본값 설정
  const postWithStatus = {
    ...post,
    status: post.status || 'draft'
  }
  store.set('posts', [postWithStatus, ...posts])
}

export function deletePost(id: string): void {
  const posts = store.get('posts')
  store.set('posts', posts.filter(p => p.id !== id))
}

export function updatePost(id: string, updates: Partial<Post>): Post | null {
  const posts = store.get('posts')
  const index = posts.findIndex(p => p.id === id)
  if (index === -1) return null
  
  const updatedPost = { ...posts[index], ...updates }
  posts[index] = updatedPost
  store.set('posts', posts)
  return updatedPost
}

export function getPostById(id: string): Post | null {
  const posts = store.get('posts')
  return posts.find(p => p.id === id) || null
}

export function getPendingPosts(): Post[] {
  const posts = store.get('posts')
  return posts.filter(p => p.status === 'pending')
}

export function clearPosts(): void {
  store.set('posts', [])
}

// ============================================
// RAG 스타일 참조 관련 함수
// ============================================

export function getStyleReferences(): StyleReference[] {
  return store.get('styleReferences') || []
}

export function addStyleReference(ref: StyleReference): void {
  const refs = getStyleReferences()
  store.set('styleReferences', [ref, ...refs])
}

export function deleteStyleReference(id: string): void {
  const refs = getStyleReferences()
  store.set('styleReferences', refs.filter(r => r.id !== id))
}

export function clearStyleReferences(): void {
  store.set('styleReferences', [])
}

export function getStyleReferenceById(id: string): StyleReference | null {
  const refs = getStyleReferences()
  return refs.find(r => r.id === id) || null
}

// 코사인 유사도 계산
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// 유사한 스타일 참조 검색
export function findSimilarStyleReferences(
  queryEmbedding: number[],
  topK: number = 3
): StyleReference[] {
  const refs = getStyleReferences()
  
  if (refs.length === 0) return []
  
  // 유사도 계산 및 정렬
  const scored = refs
    .map(ref => ({
      ref,
      score: cosineSimilarity(queryEmbedding, ref.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
  
  return scored.map(s => s.ref)
}

export { store }
