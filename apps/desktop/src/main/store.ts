import Store from 'electron-store'

export interface Post {
  id: string
  type: 'ag' | 'pro' | 'br' | 'in'
  content: string
  topic: string
  createdAt: string
  thread?: string[] // 연결된 게시물들 (스레드)
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

interface StoreSchema {
  config: AppConfig
  posts: Post[]
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
6. 이어지는 쓰레드 형식중 첫번째 글은 5줄이내로 구성, 그 이후 이어지는 쓰레드는 총 5~8줄로 구성
8. 첫번째 후킹 글은 담백하게 작성 (과장된 표현, 감탄사 남발 금지)
9. 2~3줄마다 빈 줄(줄바꿈)을 넣어서 의미 단위로 구분해줘 (답답하지 않게)

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
      prompts: defaultPrompts
    },
    posts: []
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
  store.set('posts', [post, ...posts])
}

export function deletePost(id: string): void {
  const posts = store.get('posts')
  store.set('posts', posts.filter(p => p.id !== id))
}

export function clearPosts(): void {
  store.set('posts', [])
}

export { store }
