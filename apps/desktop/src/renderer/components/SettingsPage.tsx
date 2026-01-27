import { useState, useEffect, useCallback } from 'react'
import { AppConfig, PostType, POST_TYPE_LABELS } from '../types'
import { useToast } from '../contexts/ToastContext'

function SettingsPage(): JSX.Element {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [perplexityApiKey, setPerplexityApiKey] = useState('')
  const [gcpProjectId, setGcpProjectId] = useState('')
  const [gcpServiceAccountKey, setGcpServiceAccountKey] = useState('')
  const [threadsAccessToken, setThreadsAccessToken] = useState('')
  const [threadsUserId, setThreadsUserId] = useState('')
  const [prompts, setPrompts] = useState<AppConfig['prompts'] | null>(null)
  const [activePromptTab, setActivePromptTab] = useState<PostType>('ag')
  const [saved, setSaved] = useState(false)
  const [testingThreads, setTestingThreads] = useState(false)
  const { showToast } = useToast()

  const loadConfig = useCallback(async () => {
    const cfg = await window.api.config.get()
    setConfig(cfg)
    setPerplexityApiKey(cfg.perplexityApiKey || '')
    setGcpProjectId(cfg.gcpProjectId || '')
    setGcpServiceAccountKey(cfg.gcpServiceAccountKey || '')
    setThreadsAccessToken(cfg.threadsAccessToken || '')
    setThreadsUserId(cfg.threadsUserId || '')
    setPrompts(cfg.prompts)
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleSave = async () => {
    console.log('[Settings] Saving config:', {
      hasPerplexityApiKey: !!perplexityApiKey,
      hasGcpProjectId: !!gcpProjectId,
      hasGcpServiceAccountKey: !!gcpServiceAccountKey,
      hasThreadsAccessToken: !!threadsAccessToken,
      hasThreadsUserId: !!threadsUserId
    })
    const result = await window.api.config.set({
      perplexityApiKey: perplexityApiKey,
      gcpProjectId: gcpProjectId,
      gcpServiceAccountKey: gcpServiceAccountKey,
      threadsAccessToken: threadsAccessToken,
      threadsUserId: threadsUserId,
      prompts: prompts || config?.prompts
    })
    console.log('[Settings] Config saved, result:', result)
    setSaved(true)
    showToast('설정이 저장되었습니다', 'success')
    setTimeout(() => setSaved(false), 2000)
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
        showToast('Threads API 연결 성공!', 'success')
      } else {
        showToast(`연결 실패: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast('연결 테스트 중 오류가 발생했습니다', 'error')
    } finally {
      setTestingThreads(false)
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
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-notion-text mb-2">
                Access Token
              </label>
              <input
                type="password"
                value={threadsAccessToken}
                onChange={(e) => setThreadsAccessToken(e.target.value)}
                placeholder="Threads API Access Token을 입력하세요..."
                className="w-full px-4 py-3 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
              />
              <p className="mt-2 text-xs text-notion-muted">
                <a
                  href="https://developers.facebook.com/docs/threads/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Meta for Developers
                </a>
                에서 Threads API 앱을 만들고 Access Token을 발급받으세요
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-notion-text mb-2">
                User ID
              </label>
              <input
                type="text"
                value={threadsUserId}
                onChange={(e) => setThreadsUserId(e.target.value)}
                placeholder="Threads User ID를 입력하세요..."
                className="w-full px-4 py-3 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
              />
              <p className="mt-2 text-xs text-notion-muted">
                Access Token 발급 시 함께 제공되는 User ID입니다
              </p>
            </div>

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
