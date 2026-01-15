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

// Perplexity API를 통해 주제에 대한 정보를 수집하는 함수
async function searchAndSummarize(perplexityApiKey: string, topic: string | null): Promise<string> {
  const query = topic 
    ? `${topic}에 대해 다음 정보를 조사해줘:
1. 최신 트렌드와 통계 (구체적인 숫자 포함)
2. 실제 사용 사례와 성과
3. 놓치기 쉬운 팁이나 숨겨진 기능
4. 비교 정보 (A vs B, 비포/애프터)
5. 실용적인 활용 방법

단순한 정의나 개념 설명은 빼고, 바로 써먹을 수 있는 구체적인 정보만 찾아줘.`
    : `AI와 코딩, 개발 트렌드, 생산성 도구에 대한 최신 정보를 조사해줘:
1. 최근 주목받는 AI 도구나 기술
2. 개발자들 사이에서 화제가 되는 트렌드
3. 실용적인 코딩 팁이나 생산성 향상 방법
4. 흥미로운 사용 사례나 성과
5. 구체적인 숫자와 통계

바로 써먹을 수 있는 구체적이고 실용적인 정보 위주로 찾아줘.`

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${perplexityApiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: '당신은 최신 정보를 조사하는 전문 리서처입니다. 구체적이고 실용적인 정보를 한국어로 제공합니다.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
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
      const topicToUse = topic.trim() || null
      console.log(`[IPC] generate:post called with type: ${type}, topic: ${topicToUse || '(광범위 조사)'}`)
      const config = getConfig()
      console.log(`[IPC] Config loaded, Gemini API key exists: ${!!config.geminiApiKey}, Perplexity API key exists: ${!!config.perplexityApiKey}`)

      if (!config.geminiApiKey) {
        console.error('[IPC] Gemini API key is not configured')
        throw new Error('Gemini API key is not configured')
      }

      if (!config.perplexityApiKey) {
        console.error('[IPC] Perplexity API key is not configured')
        throw new Error('Perplexity API key is not configured')
      }

      // 기본 프롬프트 + 커스텀 프롬프트 조합
      const prompt = getFullPrompt(type)
      console.log(`[IPC] Prompt loaded, length: ${prompt.length}`)
      
      // Step 1: Perplexity로 주제에 대한 정보 조사 (주제가 없으면 광범위한 조사)
      console.log(`[Step 1] Researching topic with Perplexity: ${topicToUse || '(광범위 조사)'}`)
      const researchInfo = await searchAndSummarize(config.perplexityApiKey, topicToUse)
      console.log(`[Step 1] Research completed, info length: ${researchInfo.length}`)
      
      // Step 2: Gemini로 조사된 정보를 바탕으로 게시물 생성
      console.log(`[Step 2] Generating post with Gemini`)
      const content = await generatePostWithInfo(
        config.geminiApiKey,
        prompt,
        topicToUse || '최신 AI 및 코딩 트렌드',
        researchInfo
      )
      console.log(`[Step 2] Post generation completed, content length: ${content.length}`)

      const post: Post = {
        id: generateId(),
        type,
        content,
        topic: topicToUse || '최신 AI 및 코딩 트렌드',
        createdAt: new Date().toISOString()
      }

      addPost(post)
      console.log(`[IPC] Post saved with id: ${post.id}`)
      return post
    }
  )

  // Auto generate handler with 2-step AI process
  ipcMain.handle('generate:auto', async () => {
    const config = getConfig()

    if (!config.geminiApiKey) {
      throw new Error('Gemini API key is not configured')
    }

    if (!config.perplexityApiKey) {
      throw new Error('Perplexity API key is not configured')
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
    
    // Step 1: Perplexity로 주제에 대한 정보 조사
    console.log(`[Auto Step 1] Researching topic with Perplexity: ${randomTopic}`)
    const researchInfo = await searchAndSummarize(config.perplexityApiKey, randomTopic)
    
    // Step 2: Gemini로 조사된 정보를 바탕으로 게시물 생성
    console.log(`[Auto Step 2] Generating post with Gemini`)
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
