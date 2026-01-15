import Store from 'electron-store'

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

interface StoreSchema {
  config: AppConfig
  posts: Post[]
}

// 모든 타입에 공통으로 적용되는 기본 프롬프트 (UI에 표시되지 않음)
const basePrompt = `[Role] You are kimppopp_, an expert in vibe coding and AI on Threads SNS.
[Style] Use confident, informal Korean. Be like a tough mentor with occasional warmth.
[Rules]
- One sentence per line, max 30 Korean characters per line
- Use numbers and results for authority
- Create FOMO (fear of missing out)
- First line must hook with benefits (money, time, free credits)
- End with CTA for likes/reposts`

// 각 타입별 커스텀 프롬프트 (UI에서 수정 가능)
const defaultPrompts = {
  ag: `[Type] Aggro type - broad topics to increase reach, strong first-line hook`,
  pro: `[Type] Proof type - demonstrate your abilities, convert interested readers`,
  br: `[Type] Branding type - share values, stories, build brand connection`,
  in: `[Type] Insight type - detailed vibe coding information and insights`
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
      geminiApiKey: '',
      autoGenerateEnabled: false,
      autoGenerateInterval: 15,
      prompts: defaultPrompts
    },
    posts: []
  }
})

// 기존 프롬프트에서 공통 부분을 제거하는 마이그레이션
function migratePrompts(): void {
  const config = store.get('config')
  const prompts = config.prompts
  let needsUpdate = false

  // 각 타입별로 기본 프롬프트가 포함되어 있으면 제거
  const types: Array<'ag' | 'pro' | 'br' | 'in'> = ['ag', 'pro', 'br', 'in']
  const migratedPrompts = { ...prompts }

  types.forEach(type => {
    const prompt = prompts[type]
    // [Role], [Style], [Rules]가 포함되어 있으면 제거
    if (prompt.includes('[Role]') || prompt.includes('[Style]') || prompt.includes('[Rules]')) {
      // [Type]으로 시작하는 부분만 추출
      const typeMatch = prompt.match(/\[Type\][^\[]*/)
      if (typeMatch) {
        migratedPrompts[type] = typeMatch[0].trim()
        needsUpdate = true
      } else {
        // [Type]이 없으면 기본값으로 리셋
        migratedPrompts[type] = defaultPrompts[type]
        needsUpdate = true
      }
    }
  })

  if (needsUpdate) {
    console.log('Migrating prompts to remove common base prompt...')
    store.set('config', { ...config, prompts: migratedPrompts })
  }
}

// 앱 시작 시 마이그레이션 실행
migratePrompts()

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
