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

interface TopicItem {
  topic: string
  angle: string
}

function getCurrentDateString(): string {
  const now = new Date()
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월`
}

async function generateTopics(
  gcpProjectId: string,
  serviceAccountKey: string,
  count: number,
  userTopic: string | null
): Promise<TopicItem[]> {
  const currentDate = getCurrentDateString()
  const accessToken = await getAccessToken(serviceAccountKey)
  const location = 'global'
  const modelId = 'gemini-3-pro-preview'
  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`

  const basePrompt = userTopic
    ? `"${userTopic}"와 관련된 ${currentDate} 기준 최신 AI/개발 트렌드에서 ${count}개의 서로 다른 세부 주제를 선정해줘.`
    : `${currentDate} 기준 최신 AI/개발/생산성 트렌드에서 ${count}개의 서로 다른 주제를 선정해줘.`

  const prompt = `${basePrompt}

각 주제는 반드시 서로 다른 영역이어야 해:
- 겹치는 내용 없이 완전히 다른 이야기를 다룰 것
- 각각 독립적인 게시물이 될 수 있도록

JSON 형식으로만 응답해:
[
  {
    "topic": "주제명",
    "angle": "이 주제를 다룰 구체적인 관점/각도"
  }
]`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.9
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vertex AI (topic generation) error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text

  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('주제 선정 실패: AI 응답에서 JSON을 찾을 수 없습니다')
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new Error(`주제 선정 실패: JSON 파싱 오류 - ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function searchWithTopic(
  perplexityApiKey: string,
  topicItem: TopicItem
): Promise<string> {
  const currentDate = getCurrentDateString()
  const query = `${currentDate} 기준, "${topicItem.topic}"에 대해 "${topicItem.angle}" 관점에서 조사해줘.

찾아야 할 정보:
1. 실제 사용 사례와 성과
2. 실용적인 활용 팁
3. 비교 정보나 인사이트

단순한 정의 설명은 빼고, 바로 써먹을 수 있는 구체적인 정보만 찾아줘.`

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
        { role: 'user', content: query }
      ],
      temperature: 0.3,
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

      const [topicItem] = await generateTopics(
        config.gcpProjectId,
        config.gcpServiceAccountKey,
        1,
        topicToUse
      )

      const researchInfo = await searchWithTopic(config.perplexityApiKey, topicItem)

      const { mainPost, thread } = await generatePostWithVertexAI(
        config.gcpProjectId,
        config.gcpServiceAccountKey,
        prompt,
        `${topicItem.topic} - ${topicItem.angle}`,
        researchInfo
      )

      const post: Post = {
        id: generateId(),
        type,
        content: mainPost,
        topic: topicItem.topic,
        createdAt: new Date().toISOString(),
        thread: thread.length > 0 ? thread : undefined
      }

      addPost(post)
      return post
    }
  )

  ipcMain.handle(
    'generate:bulk',
    async (_, type: Post['type'], count: number, userTopic: string) => {
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

      const topicToUse = userTopic.trim() || null
      const prompt = getFullPrompt(type)

      const topics = await generateTopics(
        config.gcpProjectId,
        config.gcpServiceAccountKey,
        count,
        topicToUse
      )

      const posts: Post[] = []

      for (const topicItem of topics) {
        try {
          const researchInfo = await searchWithTopic(config.perplexityApiKey, topicItem)

          const { mainPost, thread } = await generatePostWithVertexAI(
            config.gcpProjectId,
            config.gcpServiceAccountKey,
            prompt,
            `${topicItem.topic} - ${topicItem.angle}`,
            researchInfo
          )

          const post: Post = {
            id: generateId(),
            type,
            content: mainPost,
            topic: topicItem.topic,
            createdAt: new Date().toISOString(),
            thread: thread.length > 0 ? thread : undefined
          }

          addPost(post)
          posts.push(post)
        } catch (error) {
          console.error(`Failed to generate post for topic: ${topicItem.topic}`, error)
        }
      }

      return posts
    }
  )

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
    const randomType = types[Math.floor(Math.random() * types.length)]

    const prompt = getFullPrompt(randomType)

    const [topicItem] = await generateTopics(config.gcpProjectId, config.gcpServiceAccountKey, 1, null)
    const researchInfo = await searchWithTopic(config.perplexityApiKey, topicItem)

    const { mainPost, thread } = await generatePostWithVertexAI(
      config.gcpProjectId,
      config.gcpServiceAccountKey,
      prompt,
      `${topicItem.topic} - ${topicItem.angle}`,
      researchInfo
    )

    const post: Post = {
      id: generateId(),
      type: randomType,
      content: mainPost,
      topic: topicItem.topic,
      createdAt: new Date().toISOString(),
      thread: thread.length > 0 ? thread : undefined
    }

    addPost(post)
    return post
  })
}
