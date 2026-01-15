import { ipcMain } from 'electron'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  getConfig,
  setConfig,
  getPosts,
  addPost,
  deletePost,
  getFullPrompt,
  Post,
  AppConfig
} from './store'

// 웹 검색을 통해 주제에 대한 정보를 수집하는 함수
async function searchAndSummarize(apiKey: string, topic: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const searchPrompt = `다음 주제에 대해 웹에서 찾을 수 있는 최신 정보, 트렌드, 통계, 획기적인 인사이트를 조사하고 요약해주세요.
단순한 정의가 아니라, 실용적이고 구체적인 정보를 찾아주세요.

주제: ${topic}

다음 형식으로 정리해주세요:
1. 핵심 정보 (최신 트렌드, 통계, 사실)
2. 주목할 만한 인사이트
3. 실용적인 활용 방법이나 팁

한국어로 작성하세요.`

  const result = await model.generateContent(searchPrompt)
  const response = await result.response
  return response.text()
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// 수집된 정보를 바탕으로 게시물을 생성하는 함수
async function generatePostWithInfo(
  apiKey: string,
  prompt: string,
  topic: string,
  researchInfo: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const fullPrompt = `${prompt}

[주제]
${topic}

[조사된 정보]
${researchInfo}

위의 조사된 정보를 바탕으로, 정확하고 획기적인 인사이트를 담은 쓰레드 게시물을 작성하세요.
정보를 단순히 나열하지 말고, 독창적인 관점과 실용적인 가치를 더해주세요.
프롬프트의 모든 규칙을 따라 한국어로 작성하세요.`

  const result = await model.generateContent(fullPrompt)
  const response = await result.response
  return response.text()
}

// 간단한 게시물 생성 함수 (조사 단계 없이)
async function generateSimplePost(
  apiKey: string,
  prompt: string,
  topic: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const fullPrompt = `${prompt}

[주제]
${topic}

프롬프트의 모든 규칙을 따라 한국어로 작성하세요.`

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

  // Generate handler with 2-step AI process
  ipcMain.handle(
    'generate:post',
    async (_, type: Post['type'], topic: string) => {
      const config = getConfig()

      if (!config.geminiApiKey) {
        throw new Error('Gemini API key is not configured')
      }

      // 기본 프롬프트 + 커스텀 프롬프트 조합
      const prompt = getFullPrompt(type)
      
      // Step 1: AI로 주제에 대한 정보 조사 및 요약
      console.log(`[Step 1] Researching topic: ${topic}`)
      const researchInfo = await searchAndSummarize(config.geminiApiKey, topic)
      console.log(`[Step 1] Research completed`)
      
      // Step 2: 조사된 정보를 바탕으로 게시물 생성
      console.log(`[Step 2] Generating post with research info`)
      const content = await generatePostWithInfo(
        config.geminiApiKey,
        prompt,
        topic,
        researchInfo
      )
      console.log(`[Step 2] Post generation completed`)

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

  // Simple generate handler (without research step)
  ipcMain.handle(
    'generate:simple',
    async (_, type: Post['type'], topic: string) => {
      const config = getConfig()

      if (!config.geminiApiKey) {
        throw new Error('Gemini API key is not configured')
      }

      const prompt = getFullPrompt(type)
      
      console.log(`[Simple] Generating post for topic: ${topic}`)
      const content = await generateSimplePost(
        config.geminiApiKey,
        prompt,
        topic
      )
      console.log(`[Simple] Post generation completed`)

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

  // Auto generate handler with 2-step AI process
  ipcMain.handle('generate:auto', async () => {
    const config = getConfig()

    if (!config.geminiApiKey) {
      throw new Error('Gemini API key is not configured')
    }

    const types: Post['type'][] = ['ag', 'pro', 'br', 'in']
    const topics = [
      '바이브 코딩 생산성 팁',
      '개발자를 위한 AI 도구',
      'AI로 코딩 배우기',
      'AI로 프로젝트 빠르게 만들기',
      '최신 개발 트렌드',
      '효율적인 코딩 습관'
    ]

    const randomType = types[Math.floor(Math.random() * types.length)]
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]

    // 기본 프롬프트 + 커스텀 프롬프트 조합
    const prompt = getFullPrompt(randomType)
    
    // Step 1: AI로 주제에 대한 정보 조사
    console.log(`[Auto Step 1] Researching topic: ${randomTopic}`)
    const researchInfo = await searchAndSummarize(config.geminiApiKey, randomTopic)
    
    // Step 2: 조사된 정보를 바탕으로 게시물 생성
    console.log(`[Auto Step 2] Generating post`)
    const content = await generatePostWithInfo(
      config.geminiApiKey,
      prompt,
      randomTopic,
      researchInfo
    )

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
