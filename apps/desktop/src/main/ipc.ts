import { ipcMain, BrowserWindow, shell, Notification } from 'electron'
import { exec } from 'child_process'
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

let autoGenerateInterval: NodeJS.Timeout | null = null
let isAutoGenerating = false

// 정각 알림 스케줄링 변수
let hourlyReminderTimeout: NodeJS.Timeout | null = null
let hourlyReminderInterval: NodeJS.Timeout | null = null
let nextReminderTime: Date | null = null

// ============================================
// Comet 쇼트컷 자동 트리거 (PowerShell 기반)
// ============================================

function triggerCometShortcut(): void {
  // PowerShell 스크립트: Alt+A → /threads-post 입력 → Enter
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    Start-Sleep -Seconds 4
    [System.Windows.Forms.SendKeys]::SendWait('%a')
    Start-Sleep -Milliseconds 500
    [System.Windows.Forms.SendKeys]::SendWait('/threads-post')
    Start-Sleep -Milliseconds 300
    [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
  `
  
  // PowerShell 실행 (UTF-8 인코딩)
  const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Comet 쇼트컷 트리거 실패:', error.message)
      return
    }
    if (stderr) {
      console.error('PowerShell stderr:', stderr)
    }
    console.log('Comet /threads-post 쇼트컷 트리거 완료')
  })
}

function notifyRenderer(channel: string, data?: unknown): void {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data)
    }
  })
}

async function runAutoGenerate(): Promise<Post | null> {
  if (isAutoGenerating) return null
  isAutoGenerating = true

  try {
    const config = getConfig()

    if (!config.gcpProjectId || !config.gcpServiceAccountKey || !config.perplexityApiKey) {
      console.error('Auto generation failed: API keys not configured')
      return null
    }

    notifyRenderer('auto:generating', true)

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
    notifyRenderer('auto:generated', post)
    notifyRenderer('auto:generating', false)

    return post
  } catch (error) {
    console.error('Auto generation failed:', error)
    notifyRenderer('auto:generating', false)
    return null
  } finally {
    isAutoGenerating = false
  }
}

export function startAutoGeneration(): void {
  const config = getConfig()
  
  if (autoGenerateInterval) {
    clearInterval(autoGenerateInterval)
    autoGenerateInterval = null
  }

  if (config.autoGenerateEnabled && config.autoGenerateInterval > 0) {
    const intervalMs = config.autoGenerateInterval * 60 * 1000
    autoGenerateInterval = setInterval(() => {
      runAutoGenerate()
    }, intervalMs)
    console.log(`Auto generation started: every ${config.autoGenerateInterval} minutes`)
  }
}

export function stopAutoGeneration(): void {
  if (autoGenerateInterval) {
    clearInterval(autoGenerateInterval)
    autoGenerateInterval = null
    console.log('Auto generation stopped')
  }
}

export function getAutoGenerationStatus(): { enabled: boolean; interval: number; isGenerating: boolean } {
  const config = getConfig()
  return {
    enabled: config.autoGenerateEnabled,
    interval: config.autoGenerateInterval,
    isGenerating: isAutoGenerating
  }
}

// ============================================
// 정각 알림 스케줄링 (게시하기 기능)
// ============================================

function getNextHourTimestamp(): number {
  const now = new Date()
  const next = new Date(now)
  next.setHours(now.getHours() + 1, 0, 0, 0)
  return next.getTime() - now.getTime()
}

function showReminderAndOpenThreads(): void {
  const config = getConfig()
  
  // Windows 알림 표시
  const notification = new Notification({
    title: '스레드 글 작성 시간',
    body: 'Comet이 자동으로 게시 준비를 시작합니다',
    icon: undefined // 기본 아이콘 사용
  })
  
  notification.show()
  
  // 2초 후 브라우저에서 스레드 페이지 열기
  setTimeout(() => {
    const url = config.threadProfileUrl + '?trigger=auto'
    shell.openExternal(url)
    console.log(`[${new Date().toLocaleTimeString()}] 스레드 페이지 열림: ${url}`)
    
    // Comet 쇼트컷 자동 트리거 (Alt+A → /threads-post → Enter)
    triggerCometShortcut()
  }, 2000)
}

export function startHourlyReminder(): void {
  // 기존 타이머 정리
  stopHourlyReminder()
  
  const config = getConfig()
  if (!config.hourlyReminderEnabled) {
    return
  }
  
  // 다음 정각까지 대기 시간 계산
  const msUntilNextHour = getNextHourTimestamp()
  
  // 다음 알림 시간 저장
  nextReminderTime = new Date(Date.now() + msUntilNextHour)
  
  console.log(`정각 알림 시작: 다음 알림 ${nextReminderTime.toLocaleTimeString()}`)
  
  // 첫 정각에 실행
  hourlyReminderTimeout = setTimeout(() => {
    showReminderAndOpenThreads()
    
    // 다음 알림 시간 업데이트
    nextReminderTime = new Date(Date.now() + 60 * 60 * 1000)
    
    // 이후 매시간 정각에 실행 (1시간 = 60 * 60 * 1000 ms)
    hourlyReminderInterval = setInterval(() => {
      showReminderAndOpenThreads()
      nextReminderTime = new Date(Date.now() + 60 * 60 * 1000)
    }, 60 * 60 * 1000)
  }, msUntilNextHour)
}

export function stopHourlyReminder(): void {
  if (hourlyReminderTimeout) {
    clearTimeout(hourlyReminderTimeout)
    hourlyReminderTimeout = null
  }
  if (hourlyReminderInterval) {
    clearInterval(hourlyReminderInterval)
    hourlyReminderInterval = null
  }
  nextReminderTime = null
  console.log('정각 알림 중지됨')
}

export interface PublishStatus {
  enabled: boolean
  threadProfileUrl: string
  nextReminderTime: string | null
}

export function getHourlyReminderStatus(): PublishStatus {
  const config = getConfig()
  return {
    enabled: config.hourlyReminderEnabled,
    threadProfileUrl: config.threadProfileUrl,
    nextReminderTime: nextReminderTime ? nextReminderTime.toISOString() : null
  }
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
        maxOutputTokens: 8192,
        temperature: 0.9
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vertex AI (topic generation) error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  console.log('=== Vertex AI Topic Generation Response ===')
  console.log(JSON.stringify(data, null, 2))
  
  if (!data.candidates || !data.candidates[0]) {
    console.error('Invalid response structure:', JSON.stringify(data, null, 2))
    throw new Error('주제 선정 실패: AI 응답이 없습니다')
  }

  const candidate = data.candidates[0]
  
  if (candidate.finishReason === 'MAX_TOKENS') {
    throw new Error('주제 선정 실패: 토큰 제한 초과 (응답이 잘렸습니다)')
  }
  
  if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
    console.error('Invalid response structure:', JSON.stringify(data, null, 2))
    throw new Error('주제 선정 실패: AI 응답 형식이 올바르지 않습니다')
  }
  
  const text = candidate.content.parts[0].text
  console.log('=== Extracted Text ===')
  console.log(text)

  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('주제 선정 실패: AI 응답에서 JSON을 찾을 수 없습니다')
  }

  try {
    const topics = JSON.parse(jsonMatch[0])
    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error('주제 선정 실패: 유효한 주제 배열이 아닙니다')
    }
    return topics
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
1. 조사된 정보중 정말 획기적이거나 유용한 정보만 선택해서 글작성
2. 글이 길어지면 여러 개의 연결된 게시물로 나눠서 작성. (1~5개) 
2. 각 게시물은 독립적으로 읽혀도 되지만, 연결되어 하나의 스토리를 만들어야 해

중요한 제약사항:
- 게시글에 "2026년" 언급하지마시오.

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
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
    throw new Error('게시물 생성 실패: AI 응답 형식이 올바르지 않습니다')
  }
  
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

  ipcMain.handle('auto:start', () => {
    startAutoGeneration()
    return getAutoGenerationStatus()
  })

  ipcMain.handle('auto:stop', () => {
    stopAutoGeneration()
    return getAutoGenerationStatus()
  })

  ipcMain.handle('auto:status', () => {
    return getAutoGenerationStatus()
  })

  ipcMain.handle('auto:setConfig', async (_, enabled: boolean, interval: number) => {
    setConfig({ autoGenerateEnabled: enabled, autoGenerateInterval: interval })
    if (enabled) {
      startAutoGeneration()
    } else {
      stopAutoGeneration()
    }
    return getAutoGenerationStatus()
  })

  // ============================================
  // 게시하기 (정각 알림) 핸들러
  // ============================================

  ipcMain.handle('publish:startReminder', () => {
    setConfig({ hourlyReminderEnabled: true })
    startHourlyReminder()
    return getHourlyReminderStatus()
  })

  ipcMain.handle('publish:stopReminder', () => {
    setConfig({ hourlyReminderEnabled: false })
    stopHourlyReminder()
    return getHourlyReminderStatus()
  })

  ipcMain.handle('publish:openThreads', () => {
    const config = getConfig()
    const url = config.threadProfileUrl + '?trigger=manual'
    shell.openExternal(url)
    console.log(`[${new Date().toLocaleTimeString()}] 수동 실행 - 스레드 페이지 열림: ${url}`)
    
    // Comet 쇼트컷 자동 트리거 (Alt+A → /threads-post → Enter)
    triggerCometShortcut()
  })

  ipcMain.handle('publish:getStatus', () => {
    return getHourlyReminderStatus()
  })

  ipcMain.handle('publish:setConfig', (_, url: string, enabled: boolean) => {
    setConfig({ threadProfileUrl: url, hourlyReminderEnabled: enabled })
    if (enabled) {
      startHourlyReminder()
    } else {
      stopHourlyReminder()
    }
    return getHourlyReminderStatus()
  })
}
