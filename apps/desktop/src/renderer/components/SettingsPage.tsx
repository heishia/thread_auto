import { useState, useEffect, useCallback } from 'react'
import { AppConfig, PostType, POST_TYPE_LABELS, StyleReference } from '../types'
import { useToast } from '../contexts/ToastContext'

function SettingsPage(): JSX.Element {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [perplexityApiKey, setPerplexityApiKey] = useState('')
  const [gcpProjectId, setGcpProjectId] = useState('')
  const [gcpServiceAccountKey, setGcpServiceAccountKey] = useState('')
  // Threads API OAuth 설정
  const [threadsClientId, setThreadsClientId] = useState('')
  const [threadsClientSecret, setThreadsClientSecret] = useState('')
  const [threadsRedirectUri, setThreadsRedirectUri] = useState('')
  const [threadsAccessToken, setThreadsAccessToken] = useState('')
  const [threadsUserId, setThreadsUserId] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [prompts, setPrompts] = useState<AppConfig['prompts'] | null>(null)
  const [activePromptTab, setActivePromptTab] = useState<PostType>('ag')
  const [saved, setSaved] = useState(false)
  const [testingThreads, setTestingThreads] = useState(false)
  const [exchangingToken, setExchangingToken] = useState(false)
  const [connectedUsername, setConnectedUsername] = useState<string | null>(null)
  // RAG 스타일 학습 설정
  const [ragEnabled, setRagEnabled] = useState(false)
  const [ragAutoSavePublished, setRagAutoSavePublished] = useState(true)
  const [ragSimilarCount, setRagSimilarCount] = useState(3)
  const [styleReferences, setStyleReferences] = useState<StyleReference[]>([])
  const [newStyleContent, setNewStyleContent] = useState('')
  const [newStyleTopic, setNewStyleTopic] = useState('')
  const [addingStyle, setAddingStyle] = useState(false)
  const { showToast } = useToast()

  const loadConfig = useCallback(async () => {
    const cfg = await window.api.config.get()
    setConfig(cfg)
    setPerplexityApiKey(cfg.perplexityApiKey || '')
    setGcpProjectId(cfg.gcpProjectId || '')
    setGcpServiceAccountKey(cfg.gcpServiceAccountKey || '')
    setThreadsClientId(cfg.threadsClientId || '')
    setThreadsClientSecret(cfg.threadsClientSecret || '')
    setThreadsRedirectUri(cfg.threadsRedirectUri || 'https://www.facebook.com/connect/login_success.html')
    setThreadsAccessToken(cfg.threadsAccessToken || '')
    setThreadsUserId(cfg.threadsUserId || '')
    setPrompts(cfg.prompts)
    // RAG 설정 로드
    setRagEnabled(cfg.ragEnabled || false)
    setRagAutoSavePublished(cfg.ragAutoSavePublished !== false)
    setRagSimilarCount(cfg.ragSimilarCount || 3)
    // 스타일 참조 로드
    const refs = await window.api.style.getAll()
    setStyleReferences(refs)
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleSave = async () => {
    console.log('[Settings] Saving config:', {
      hasPerplexityApiKey: !!perplexityApiKey,
      hasGcpProjectId: !!gcpProjectId,
      hasGcpServiceAccountKey: !!gcpServiceAccountKey,
      hasThreadsClientId: !!threadsClientId,
      hasThreadsClientSecret: !!threadsClientSecret,
      hasThreadsAccessToken: !!threadsAccessToken,
      hasThreadsUserId: !!threadsUserId,
      ragEnabled,
      ragAutoSavePublished,
      ragSimilarCount
    })
    const result = await window.api.config.set({
      perplexityApiKey: perplexityApiKey,
      gcpProjectId: gcpProjectId,
      gcpServiceAccountKey: gcpServiceAccountKey,
      threadsClientId: threadsClientId,
      threadsClientSecret: threadsClientSecret,
      threadsRedirectUri: threadsRedirectUri,
      threadsAccessToken: threadsAccessToken,
      threadsUserId: threadsUserId,
      prompts: prompts || config?.prompts,
      ragEnabled,
      ragAutoSavePublished,
      ragSimilarCount
    })
    console.log('[Settings] Config saved, result:', result)
    setSaved(true)
    showToast('설정이 저장되었습니다', 'success')
    setTimeout(() => setSaved(false), 2000)
  }

  // RAG 스타일 참조 추가
  const handleAddStyleReference = async () => {
    if (!newStyleContent.trim() || !newStyleTopic.trim()) {
      showToast('글 내용과 주제를 모두 입력하세요', 'error')
      return
    }
    
    setAddingStyle(true)
    try {
      await window.api.style.add(newStyleContent.trim(), newStyleTopic.trim())
      const refs = await window.api.style.getAll()
      setStyleReferences(refs)
      setNewStyleContent('')
      setNewStyleTopic('')
      showToast('스타일 참조가 추가되었습니다', 'success')
    } catch (error) {
      showToast('스타일 참조 추가 실패', 'error')
    } finally {
      setAddingStyle(false)
    }
  }

  // 스타일 참조 삭제
  const handleDeleteStyleReference = async (id: string) => {
    try {
      const refs = await window.api.style.delete(id)
      setStyleReferences(refs)
      showToast('스타일 참조가 삭제되었습니다', 'success')
    } catch (error) {
      showToast('스타일 참조 삭제 실패', 'error')
    }
  }

  // 스타일 참조 전체 삭제
  const handleClearStyleReferences = async () => {
    if (!confirm('모든 스타일 참조를 삭제하시겠습니까?')) return
    
    try {
      await window.api.style.clear()
      setStyleReferences([])
      showToast('모든 스타일 참조가 삭제되었습니다', 'success')
    } catch (error) {
      showToast('스타일 참조 삭제 실패', 'error')
    }
  }

  const handleTestThreads = async () => {
    if (!threadsAccessToken || !threadsUserId) {
      showToast('Access Token과 User ID를 먼저 입력하세요', 'error')
      return
    }
    
    setTestingThreads(true)
    try {
      const result = await window.api.threads.test()
      if (result.success) {
        setConnectedUsername(result.username || null)
        showToast(`Threads 연결 성공! (@${result.username})`, 'success')
      } else {
        setConnectedUsername(null)
        showToast(`연결 실패: ${result.error}`, 'error')
      }
    } catch (error) {
      setConnectedUsername(null)
      showToast('연결 테스트 중 오류가 발생했습니다', 'error')
    } finally {
      setTestingThreads(false)
    }
  }

  // OAuth 인증 페이지 열기
  const handleOpenAuth = async () => {
    if (!threadsClientId || !threadsClientSecret) {
      showToast('Client ID와 Client Secret을 먼저 입력하고 저장하세요', 'error')
      return
    }
    
    // 먼저 설정 저장
    await handleSave()
    
    const result = await window.api.threads.openAuth()
    if (result.success) {
      showToast('브라우저에서 Threads 로그인 후, 리디렉션된 URL에서 code 값을 복사하세요', 'info')
    } else {
      showToast(`인증 페이지 열기 실패: ${result.error}`, 'error')
    }
  }

  // Authorization Code로 토큰 교환
  const handleExchangeToken = async () => {
    if (!authCode.trim()) {
      showToast('Authorization Code를 입력하세요', 'error')
      return
    }
    
    setExchangingToken(true)
    try {
      const result = await window.api.threads.exchangeToken(authCode.trim())
      if (result.success) {
        setThreadsAccessToken(result.accessToken || '')
        setThreadsUserId(result.userId || '')
        setAuthCode('')
        showToast('토큰 발급 성공! Access Token과 User ID가 자동 저장되었습니다', 'success')
        // 설정 다시 로드
        await loadConfig()
      } else {
        showToast(`토큰 발급 실패: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast('토큰 발급 중 오류가 발생했습니다', 'error')
    } finally {
      setExchangingToken(false)
    }
  }

  // 토큰 갱신
  const handleRefreshToken = async () => {
    if (!threadsAccessToken) {
      showToast('Access Token이 없습니다', 'error')
      return
    }
    
    try {
      const result = await window.api.threads.refreshToken()
      if (result.success) {
        setThreadsAccessToken(result.accessToken || '')
        showToast('토큰 갱신 성공!', 'success')
        await loadConfig()
      } else {
        showToast(`토큰 갱신 실패: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast('토큰 갱신 중 오류가 발생했습니다', 'error')
    }
  }

  const handlePromptChange = (type: PostType, value: string) => {
    if (prompts) {
      setPrompts({ ...prompts, [type]: value })
    }
  }

  const types: PostType[] = ['ag', 'pro', 'br', 'in']

  if (!config || !prompts) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-notion-muted">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-notion-text mb-2">설정</h2>
        <p className="text-sm text-notion-muted">ThreadAuto 환경설정</p>
      </div>

      <div className="space-y-8">
        {/* API Keys Section */}
        <section>
          <h3 className="text-lg font-medium text-notion-text mb-4">API 키 설정</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-notion-text mb-2">
                Perplexity API 키 (정보 조사용)
              </label>
              <input
                type="password"
                value={perplexityApiKey}
                onChange={(e) => setPerplexityApiKey(e.target.value)}
                placeholder="Perplexity API 키를 입력하세요..."
                className="w-full px-4 py-3 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
              />
              <p className="mt-2 text-xs text-notion-muted">
                <a
                  href="https://www.perplexity.ai/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Perplexity Settings
                </a>
                에서 발급받을 수 있습니다
              </p>
            </div>

            <div className="border-t border-notion-border pt-4">
              <h4 className="text-sm font-medium text-notion-text mb-3">Vertex AI (Claude Sonnet 4.5) 설정</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-notion-text mb-2">
                    GCP Project ID
                  </label>
                  <input
                    type="text"
                    value={gcpProjectId}
                    onChange={(e) => setGcpProjectId(e.target.value)}
                    placeholder="your-gcp-project-id"
                    className="w-full px-4 py-3 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
                  />
                  <p className="mt-2 text-xs text-notion-muted">
                    Google Cloud Console에서 프로젝트 ID를 확인하세요
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-notion-text mb-2">
                    GCP Service Account Key (JSON)
                  </label>
                  <textarea
                    value={gcpServiceAccountKey}
                    onChange={(e) => setGcpServiceAccountKey(e.target.value)}
                    placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "...", ...}'
                    rows={6}
                    className="w-full px-4 py-3 border border-notion-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20 resize-none"
                  />
                  <p className="mt-2 text-xs text-notion-muted">
                    <a
                      href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Google Cloud Console - IAM 및 관리자 - 서비스 계정
                    </a>
                    에서 서비스 계정을 생성하고 JSON 키를 다운로드하세요. Vertex AI User 권한이 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Threads API Section */}
        <section>
          <h3 className="text-lg font-medium text-notion-text mb-4">Threads API 설정</h3>
          <p className="text-sm text-notion-muted mb-4">
            예약 발행 기능을 사용하려면 Threads API 인증 정보가 필요합니다
          </p>
          
          <div className="space-y-6">
            {/* Step 1: 앱 설정 */}
            <div className="p-4 bg-notion-sidebar rounded-lg border border-notion-border">
              <h4 className="text-sm font-semibold text-notion-text mb-3">Step 1: Meta 앱 설정</h4>
              <p className="text-xs text-notion-muted mb-4">
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Meta for Developers
                </a>
                에서 앱을 만들고 Threads API 사용 사례를 추가하세요
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-notion-text mb-1">
                    Threads App ID (Client ID)
                  </label>
                  <input
                    type="text"
                    value={threadsClientId}
                    onChange={(e) => setThreadsClientId(e.target.value)}
                    placeholder="앱 ID를 입력하세요..."
                    className="w-full px-3 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-notion-text mb-1">
                    Threads App Secret (Client Secret)
                  </label>
                  <input
                    type="password"
                    value={threadsClientSecret}
                    onChange={(e) => setThreadsClientSecret(e.target.value)}
                    placeholder="앱 시크릿을 입력하세요..."
                    className="w-full px-3 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-notion-text mb-1">
                    Redirect URI
                  </label>
                  <input
                    type="text"
                    value={threadsRedirectUri}
                    onChange={(e) => setThreadsRedirectUri(e.target.value)}
                    placeholder="https://www.facebook.com/connect/login_success.html"
                    className="w-full px-3 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
                  />
                  <p className="mt-1 text-xs text-notion-muted">
                    Meta 앱 설정의 Redirect URI와 동일해야 합니다
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: OAuth 인증 */}
            <div className="p-4 bg-notion-sidebar rounded-lg border border-notion-border">
              <h4 className="text-sm font-semibold text-notion-text mb-3">Step 2: OAuth 인증</h4>
              
              <div className="space-y-3">
                <button
                  onClick={handleOpenAuth}
                  disabled={!threadsClientId || !threadsClientSecret}
                  className="w-full px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Threads 로그인 페이지 열기
                </button>
                
                <div>
                  <label className="block text-xs font-medium text-notion-text mb-1">
                    Authorization Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      placeholder="리디렉션 URL의 ?code=... 값을 붙여넣으세요"
                      className="flex-1 px-3 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
                    />
                    <button
                      onClick={handleExchangeToken}
                      disabled={exchangingToken || !authCode.trim()}
                      className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {exchangingToken && (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      토큰 발급
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-notion-muted">
                    로그인 후 리디렉션된 URL에서 code 파라미터 값을 복사하세요
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: 연결 상태 */}
            <div className="p-4 bg-notion-sidebar rounded-lg border border-notion-border">
              <h4 className="text-sm font-semibold text-notion-text mb-3">Step 3: 연결 상태</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-notion-text mb-1">
                    Access Token
                  </label>
                  <input
                    type="password"
                    value={threadsAccessToken}
                    onChange={(e) => setThreadsAccessToken(e.target.value)}
                    placeholder="자동으로 채워집니다..."
                    className="w-full px-3 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-notion-text mb-1">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={threadsUserId}
                    onChange={(e) => setThreadsUserId(e.target.value)}
                    placeholder="자동으로 채워집니다..."
                    className="w-full px-3 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20 bg-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleTestThreads}
                    disabled={testingThreads || !threadsAccessToken || !threadsUserId}
                    className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {testingThreads && (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    연결 테스트
                  </button>
                  
                  <button
                    onClick={handleRefreshToken}
                    disabled={!threadsAccessToken}
                    className="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    토큰 갱신
                  </button>
                </div>

                {connectedUsername && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-700">연결됨: @{connectedUsername}</span>
                  </div>
                )}

                <p className="text-xs text-notion-muted">
                  Long-lived 토큰은 60일 후 만료됩니다. 만료 전에 &quot;토큰 갱신&quot;을 클릭하세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RAG 스타일 학습 Section */}
        <section>
          <h3 className="text-lg font-medium text-notion-text mb-4">스타일 학습 (RAG)</h3>
          <p className="text-sm text-notion-muted mb-4">
            기존에 작성한 글들을 학습시켜 비슷한 스타일로 새 글을 생성합니다
          </p>
          
          <div className="space-y-6">
            {/* RAG 활성화 토글 */}
            <div className="p-4 bg-notion-sidebar rounded-lg border border-notion-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-notion-text">스타일 학습 활성화</h4>
                  <p className="text-xs text-notion-muted mt-1">
                    활성화하면 글 생성 시 유사한 스타일 참조를 자동으로 포함합니다
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ragEnabled}
                    onChange={(e) => setRagEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {ragEnabled && (
                <div className="space-y-4 pt-4 border-t border-notion-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-medium text-notion-text">발행 글 자동 저장</h5>
                      <p className="text-xs text-notion-muted">Threads에 발행한 글을 자동으로 스타일 참조에 추가</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ragAutoSavePublished}
                        onChange={(e) => setRagAutoSavePublished(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-notion-text mb-2">
                      참조할 유사 글 개수: {ragSimilarCount}개
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={ragSimilarCount}
                      onChange={(e) => setRagSimilarCount(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-notion-muted mt-1">
                      <span>1개</span>
                      <span>5개</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 스타일 참조 목록 */}
            <div className="p-4 bg-notion-sidebar rounded-lg border border-notion-border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-notion-text">
                  스타일 참조 목록 ({styleReferences.length}개)
                </h4>
                {styleReferences.length > 0 && (
                  <button
                    onClick={handleClearStyleReferences}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    전체 삭제
                  </button>
                )}
              </div>
              
              {styleReferences.length === 0 ? (
                <div className="text-center py-8 text-sm text-notion-muted">
                  아직 추가된 스타일 참조가 없습니다
                  <br />
                  <span className="text-xs">아래에서 직접 추가하거나, 글 발행 시 자동으로 추가됩니다</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {styleReferences.map((ref) => (
                    <div
                      key={ref.id}
                      className="p-3 bg-white rounded-lg border border-notion-border flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-notion-text truncate">
                            {ref.topic}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            ref.source === 'published' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {ref.source === 'published' ? '발행' : '수동'}
                          </span>
                        </div>
                        <p className="text-xs text-notion-muted line-clamp-2">
                          {ref.content}
                        </p>
                        <p className="text-xs text-notion-muted mt-1">
                          {new Date(ref.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteStyleReference(ref.id)}
                        className="text-notion-muted hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 스타일 참조 수동 추가 */}
            <div className="p-4 bg-notion-sidebar rounded-lg border border-notion-border">
              <h4 className="text-sm font-semibold text-notion-text mb-3">스타일 참조 직접 추가</h4>
              <p className="text-xs text-notion-muted mb-4">
                과거에 작성한 글을 직접 추가하여 스타일을 학습시킬 수 있습니다
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-notion-text mb-1">주제</label>
                  <input
                    type="text"
                    value={newStyleTopic}
                    onChange={(e) => setNewStyleTopic(e.target.value)}
                    placeholder="예: AI 코딩 도구 추천"
                    className="w-full px-3 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-notion-text mb-1">글 내용</label>
                  <textarea
                    value={newStyleContent}
                    onChange={(e) => setNewStyleContent(e.target.value)}
                    placeholder="과거에 작성한 글을 붙여넣으세요..."
                    rows={4}
                    className="w-full px-3 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20 resize-none"
                  />
                </div>
                <button
                  onClick={handleAddStyleReference}
                  disabled={addingStyle || !newStyleContent.trim() || !newStyleTopic.trim()}
                  className="w-full px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingStyle && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {addingStyle ? '임베딩 생성 중...' : '스타일 참조 추가'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Prompts Section */}
        <section>
          <h3 className="text-lg font-medium text-notion-text mb-3">프롬프트 템플릿</h3>
          <p className="text-sm text-notion-muted mb-2">
            각 게시물 유형별 프롬프트를 커스터마이징하세요
          </p>
          <div className="mb-4 px-3 py-2 bg-blue-50 text-blue-700 text-xs rounded">
            💡 기본 프롬프트(Role, Style, Rules)는 모든 타입에 자동으로 적용됩니다. 
            여기서는 각 타입별 추가 지침만 수정하세요.
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setActivePromptTab(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activePromptTab === type
                    ? 'bg-notion-text text-white'
                    : 'bg-notion-sidebar text-notion-muted hover:bg-notion-hover'
                }`}
              >
                {POST_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <textarea
            value={prompts[activePromptTab]}
            onChange={(e) => handlePromptChange(activePromptTab, e.target.value)}
            rows={8}
            placeholder="이 타입에 대한 추가 지침을 입력하세요..."
            className="w-full px-4 py-3 border border-notion-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20 resize-none"
          />
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-notion-text text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
          >
            설정 저장
          </button>
          {saved && (
            <span className="text-sm text-green-600">설정이 저장되었습니다!</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
