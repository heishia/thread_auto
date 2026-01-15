import { useState, useEffect, useCallback } from 'react'
import { AppConfig, PostType, POST_TYPE_LABELS } from '../types'

function SettingsPage(): JSX.Element {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [autoInterval, setAutoInterval] = useState(15)
  const [prompts, setPrompts] = useState<AppConfig['prompts'] | null>(null)
  const [activePromptTab, setActivePromptTab] = useState<PostType>('ag')
  const [saved, setSaved] = useState(false)

  const loadConfig = useCallback(async () => {
    const cfg = await window.api.config.get()
    setConfig(cfg)
    setApiKey(cfg.geminiApiKey)
    setAutoEnabled(cfg.autoGenerateEnabled)
    setAutoInterval(cfg.autoGenerateInterval)
    setPrompts(cfg.prompts)
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleSave = async () => {
    await window.api.config.set({
      geminiApiKey: apiKey,
      autoGenerateEnabled: autoEnabled,
      autoGenerateInterval: autoInterval,
      prompts: prompts || config?.prompts
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
        {/* API Key Section */}
        <section>
          <h3 className="text-lg font-medium text-notion-text mb-3">Gemini API 키</h3>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Gemini API 키를 입력하세요..."
            className="w-full px-4 py-3 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
          />
          <p className="mt-2 text-xs text-notion-muted">
            API 키는{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Google AI Studio
            </a>
            에서 발급받을 수 있습니다
          </p>
        </section>

        {/* Auto Generate Section */}
        <section>
          <h3 className="text-lg font-medium text-notion-text mb-3">자동 생성</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoEnabled}
                onChange={(e) => setAutoEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-notion-border text-notion-text focus:ring-notion-text"
              />
              <span className="text-sm text-notion-text">
                자동 게시물 생성 활성화
              </span>
            </label>

            {autoEnabled && (
              <div>
                <label className="block text-sm text-notion-muted mb-2">
                  생성 주기 (분)
                </label>
                <input
                  type="number"
                  value={autoInterval}
                  onChange={(e) => setAutoInterval(Number(e.target.value))}
                  min={1}
                  max={120}
                  className="w-32 px-3 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
                />
                <p className="mt-1 text-xs text-notion-muted">
                  권장: 15분 (시간당 4개 게시물)
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Prompts Section */}
        <section>
          <h3 className="text-lg font-medium text-notion-text mb-3">프롬프트 템플릿</h3>
          <p className="text-sm text-notion-muted mb-4">
            각 게시물 유형별 프롬프트를 커스터마이징하세요
          </p>

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
            rows={12}
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
