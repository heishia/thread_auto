import { ipcMain } from 'electron'
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
      model: 'sonar',
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

async function getAccessToken(serviceAccountKey: string): Promise<string> {
  try {
    const keyData = JSON.parse(serviceAccountKey)
    const { client_email, private_key } = keyData
    
    const now = Math.floor(Date.now() / 1000)
    const expiry = now + 3600
    
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }
    
    const payload = {
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: expiry,
      iat: now
    }
    
    const base64url = (str: string): string => {
      return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
    }
    
    const encodedHeader = base64url(JSON.stringify(header))
    const encodedPayload = base64url(JSON.stringify(payload))
    const signatureInput = `${encodedHeader}.${encodedPayload}`
    
    const crypto = await import('crypto')
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(signatureInput)
    sign.end()
    
    const signature = sign.sign(private_key, 'base64')
    const encodedSignature = signature
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    const jwt = `${signatureInput}.${encodedSignature}`
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`OAuth token error: ${tokenResponse.status} - ${errorText}`)
    }
    
    const tokenData = await tokenResponse.json()
    return tokenData.access_token
  } catch (error) {
    throw new Error(`Failed to get access token: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function generatePostWithVertexAI(
  gcpProjectId: string,
  serviceAccountKey: string,
  prompt: string,
  topic: string,
  researchInfo: string
): Promise<{ mainPost: string; thread: string[] }> {
  const fullPrompt = `${prompt}

[주제]
${topic}

[조사된 정보]
${researchInfo}

위 정보를 바탕으로 쓰레드(Thread) 형식의 게시물을 작성해.

스레드 규칙:
1. 조사된 정보가 풍부하면 여러 개의 연결된 게시물로 나눠서 작성해 (최대 5개)
2. 각 게시물은 독립적으로 읽혀도 되지만, 연결되어 하나의 스토리를 만들어야 해

출력 형식 (JSON):
{
  "mainPost": "첫 번째 게시물 내용",
  "thread": ["두 번째 게시물", "세 번째 게시물", ...]
}

정보량이 적으면 mainPost만 작성하고 thread는 빈 배열로 해.
정보량이 많으면 최대한 유용한 내용을 담아 여러 게시물로 나눠서 작성해.`

  const accessToken = await getAccessToken(serviceAccountKey)
  const location = 'global'
  const modelId = 'gemini-3-pro-preview'
  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: fullPrompt }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        mainPost: parsed.mainPost || text,
        thread: Array.isArray(parsed.thread) ? parsed.thread : []
      }
    }
  } catch {
    // JSON 파싱 실패 시 원본 텍스트 반환
  }
  
  return {
    mainPost: text,
    thread: []
  }
}

// 수집된 정보를 바탕으로 스레드 형식의 게시물들을 생성하는 함수
export function registerIpcHandlers(): void {
  // Config handlers
  ipcMain.handle('config:get', () => {
    const config = getConfig()
    return config
  })

  ipcMain.handle('config:set', (_, config: Partial<AppConfig>) => {
    setConfig(config)
    const updated = getConfig()
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
      const config = getConfig()

      if (!config.gcpProjectId) {
        throw new Error('GCP Project ID is not configured')
      }
      if (!config.gcpServiceAccountKey) {
        throw new Error('GCP Service Account Key is not configured')
      }

      if (!config.perplexityApiKey) {
        throw new Error('Perplexity API key is not configured')
      }

      const prompt = getFullPrompt(type)
      
      const researchInfo = await searchAndSummarize(config.perplexityApiKey, topicToUse)
      
      const { mainPost, thread } = await generatePostWithVertexAI(
        config.gcpProjectId,
        config.gcpServiceAccountKey,
        prompt,
        topicToUse || '최신 AI 및 코딩 트렌드',
        researchInfo
      )

      const post: Post = {
        id: generateId(),
        type,
        content: mainPost,
        topic: topicToUse || '최신 AI 및 코딩 트렌드',
        createdAt: new Date().toISOString(),
        thread: thread.length > 0 ? thread : undefined
      }

      addPost(post)
      return post
    }
  )

  // Auto generate handler with 2-step AI process
  ipcMain.handle('generate:auto', async () => {
    const config = getConfig()

    if (!config.gcpProjectId) {
      throw new Error('GCP Project ID is not configured')
    }
    if (!config.gcpServiceAccountKey) {
      throw new Error('GCP Service Account Key is not configured')
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

    const prompt = getFullPrompt(randomType)
    
    const researchInfo = await searchAndSummarize(config.perplexityApiKey, randomTopic)
    
    const { mainPost, thread } = await generatePostWithVertexAI(
      config.gcpProjectId,
      config.gcpServiceAccountKey,
      prompt,
      randomTopic,
      researchInfo
    )

    const post: Post = {
      id: generateId(),
      type: randomType,
      content: mainPost,
      topic: randomTopic,
      createdAt: new Date().toISOString(),
      thread: thread.length > 0 ? thread : undefined
    }

    addPost(post)
    return post
  })
}
