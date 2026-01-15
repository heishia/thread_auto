import { ipcMain } from 'electron'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  getConfig,
  setConfig,
  getPosts,
  addPost,
  deletePost,
  Post,
  AppConfig
} from './store'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

async function generateWithGemini(
  apiKey: string,
  prompt: string,
  topic: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const fullPrompt = `${prompt}

[Topic] ${topic}

Write a Threads post about this topic following all the rules above. Write in Korean.`

  const result = await model.generateContent(fullPrompt)
  const response = await result.response
  return response.text()
}

export function registerIpcHandlers(): void {
  // Config handlers
  ipcMain.handle('config:get', () => {
    return getConfig()
  })

  ipcMain.handle('config:set', (_, config: Partial<AppConfig>) => {
    setConfig(config)
    return getConfig()
  })

  // Posts handlers
  ipcMain.handle('posts:get', () => {
    return getPosts()
  })

  ipcMain.handle('posts:delete', (_, id: string) => {
    deletePost(id)
    return getPosts()
  })

  // Generate handler
  ipcMain.handle(
    'generate:post',
    async (_, type: Post['type'], topic: string) => {
      const config = getConfig()

      if (!config.geminiApiKey) {
        throw new Error('Gemini API key is not configured')
      }

      const prompt = config.prompts[type]
      const content = await generateWithGemini(config.geminiApiKey, prompt, topic)

      const post: Post = {
        id: generateId(),
        type,
        content,
        topic,
        createdAt: new Date().toISOString()
      }

      addPost(post)
      return post
    }
  )

  // Auto generate handler
  ipcMain.handle('generate:auto', async () => {
    const config = getConfig()

    if (!config.geminiApiKey) {
      throw new Error('Gemini API key is not configured')
    }

    const types: Post['type'][] = ['ag', 'pro', 'br', 'in']
    const topics = [
      'vibe coding productivity tips',
      'AI tools for developers',
      'learning to code with AI',
      'building projects faster with AI'
    ]

    const randomType = types[Math.floor(Math.random() * types.length)]
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]

    const prompt = config.prompts[randomType]
    const content = await generateWithGemini(config.geminiApiKey, prompt, randomTopic)

    const post: Post = {
      id: generateId(),
      type: randomType,
      content,
      topic: randomTopic,
      createdAt: new Date().toISOString()
    }

    addPost(post)
    return post
  })
}
