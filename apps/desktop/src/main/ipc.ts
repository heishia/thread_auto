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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const searchPrompt = `주제: ${topic}

위 주제에 대해 다음 정보를 조사해줘:

1. 최신 트렌드와 통계 (구체적인 숫자 포함)
2. 실제 사용 사례와 성과
3. 놓치기 쉬운 팁이나 숨겨진 기능
4. 비교 정보 (A vs B, 비포/애프터)
5. 실용적인 활용 방법

단순한 정의나 개념 설명은 빼고, 바로 써먹을 수 있는 구체적인 정보만 찾아줘.
한국어로 작성.`

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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const fullPrompt = `${prompt}

[주제]
${topic}

[조사된 정보]
${researchInfo}

위 정보를 바탕으로 쓰레드 게시물을 작성해.

중요:
- 정보를 나열하지 말고, 독자에게 직접적인 가치를 전달해
- 첫 줄은 무조건 "이거 모르면 손해" 느낌으로 시작
- 구체적인 숫자와 결과를 반드시 포함
- 프롬프트의 모든 규칙을 엄격히 따를 것
- 한국어 반말 사용

게시물만 출력해. 다른 설명은 필요 없어.`

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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const fullPrompt = `${prompt}

[주제]
${topic}

프롬프트의 모든 규칙을 엄격히 따라 작성해.
한국어 반말 사용.
게시물만 출력해. 다른 설명은 필요 없어.`

  const result = await model.generateContent(fullPrompt)
  const response = await result.response
  return response.text()
}

export function registerIpcHandlers(): void {
  // Config handlers
  ipcMain.handle('config:get', () => {
    const config = getConfig()
    console.log('[IPC] config:get called, API key exists:', !!config.geminiApiKey)
    return config
  })

  ipcMain.handle('config:set', (_, config: Partial<AppConfig>) => {
    console.log('[IPC] config:set called with:', { 
      hasApiKey: !!config.geminiApiKey,
      apiKeyLength: config.geminiApiKey?.length || 0,
      autoGenerateEnabled: config.autoGenerateEnabled,
      autoGenerateInterval: config.autoGenerateInterval
    })
    setConfig(config)
    const updated = getConfig()
    console.log('[IPC] config saved, API key exists:', !!updated.geminiApiKey)
    return updated
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
      console.log(`[IPC] generate:post called with type: ${type}, topic: ${topic}`)
      const config = getConfig()
      console.log(`[IPC] Config loaded, API key exists: ${!!config.geminiApiKey}`)

      if (!config.geminiApiKey) {
        console.error('[IPC] Gemini API key is not configured')
        throw new Error('Gemini API key is not configured')
      }

      // 기본 프롬프트 + 커스텀 프롬프트 조합
      const prompt = getFullPrompt(type)
      console.log(`[IPC] Prompt loaded, length: ${prompt.length}`)
      
      // Step 1: AI로 주제에 대한 정보 조사 및 요약
      console.log(`[Step 1] Researching topic: ${topic}`)
      const researchInfo = await searchAndSummarize(config.geminiApiKey, topic)
      console.log(`[Step 1] Research completed, info length: ${researchInfo.length}`)
      
      // Step 2: 조사된 정보를 바탕으로 게시물 생성
      console.log(`[Step 2] Generating post with research info`)
      const content = await generatePostWithInfo(
        config.geminiApiKey,
        prompt,
        topic,
        researchInfo
      )
      console.log(`[Step 2] Post generation completed, content length: ${content.length}`)

      const post: Post = {
        id: generateId(),
        type,
        content,
        topic,
        createdAt: new Date().toISOString()
      }

      addPost(post)
      console.log(`[IPC] Post saved with id: ${post.id}`)
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
