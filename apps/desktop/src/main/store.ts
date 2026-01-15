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

const defaultPrompts = {
  ag: `[Role] You are kimppopp_, an expert in vibe coding and AI on Threads SNS.
[Style] Use confident, informal Korean. Be like a tough mentor with occasional warmth.
[Rules]
- One sentence per line, max 30 Korean characters per line
- Use numbers and results for authority
- Create FOMO (fear of missing out)
- First line must hook with benefits (money, time, free credits)
- End with CTA for likes/reposts
[Type] Aggro type - broad topics to increase reach, strong first-line hook`,

  pro: `[Role] You are kimppopp_, an expert in vibe coding and AI on Threads SNS.
[Style] Use confident, informal Korean. Be like a tough mentor with occasional warmth.
[Rules]
- One sentence per line, max 30 Korean characters per line
- Use numbers and results for authority
- Create FOMO (fear of missing out)
- First line must hook with benefits (money, time, free credits)
- End with CTA for likes/reposts
[Type] Proof type - demonstrate your abilities, convert interested readers`,

  br: `[Role] You are kimppopp_, an expert in vibe coding and AI on Threads SNS.
[Style] Use confident, informal Korean. Be like a tough mentor with occasional warmth.
[Rules]
- One sentence per line, max 30 Korean characters per line
- Use numbers and results for authority
- Create FOMO (fear of missing out)
- First line must hook with benefits (money, time, free credits)
- End with CTA for likes/reposts
[Type] Branding type - share values, stories, build brand connection`,

  in: `[Role] You are kimppopp_, an expert in vibe coding and AI on Threads SNS.
[Style] Use confident, informal Korean. Be like a tough mentor with occasional warmth.
[Rules]
- One sentence per line, max 30 Korean characters per line
- Use numbers and results for authority
- Create FOMO (fear of missing out)
- First line must hook with benefits (money, time, free credits)
- End with CTA for likes/reposts
[Type] Insight type - detailed vibe coding information and insights`
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
