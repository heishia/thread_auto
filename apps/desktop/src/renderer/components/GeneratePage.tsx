import { useState, useEffect, useRef, useCallback } from 'react'
import { PostType, POST_TYPE_LABELS, AppConfig } from '../types'
import { useGeneration } from '../contexts/GenerationContext'

function GeneratePage(): JSX.Element {
  const [selectedType, setSelectedType] = useState<PostType>('ag')
  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingStep, setGeneratingStep] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [autoStatus, setAutoStatus] = useState<string>('')
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { addGeneratingPost, updateGeneratingStatus, removeGeneratingPost, refreshPosts } = useGeneration()

  const loadConfig = useCallback(async () => {
    const cfg = await window.api.config.get()
    setConfig(cfg)
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // Auto generation effect
  useEffect(() => {
    if (config?.autoGenerateEnabled && config?.geminiApiKey) {
      const intervalMs = config.autoGenerateInterval * 60 * 1000

      const runAutoGenerate = async () => {
        setAutoStatus('자동 생성 중...')
        try {
          await window.api.generate.auto()
          setAutoStatus(`마지막 자동 생성: ${new Date().toLocaleTimeString('ko-KR')}`)
        } catch {
          setAutoStatus('자동 생성 실패')
        }
      }

      autoIntervalRef.current = setInterval(runAutoGenerate, intervalMs)
      setAutoStatus(`자동 생성 활성화 (${config.autoGenerateInterval}분마다)`)

      return () => {
        if (autoIntervalRef.current) {
          clearInterval(autoIntervalRef.current)
        }
      }
    } else {
      setAutoStatus('')
    }
  }, [config?.autoGenerateEnabled, config?.autoGenerateInterval, config?.geminiApiKey])

  const handleGenerate = async () => {
    console.log('[Frontend] Generate button clicked')
    console.log('[Frontend] Type:', selectedType, 'Topic:', topic.trim() || '(광범위 조사)')
    console.log('[Frontend] Config:', config)

    setIsGenerating(true)
    setError(null)
    setSuccess(false)
    setGeneratingStep('1단계: 주제에 대한 정보 조사 중...')

    // 생성 중인 게시물을 목록에 추가
    const tempId = addGeneratingPost(selectedType, topic.trim())
    console.log('[Frontend] Added generating post with tempId:', tempId)

    try {
      // 2초 후 2단계로 변경
      setTimeout(() => {
        setGeneratingStep('2단계: 게시물 생성 중...')
        updateGeneratingStatus(tempId, 'generating')
      }, 3000)

      console.log('[Frontend] Calling window.api.generate.post...')
      const result = await window.api.generate.post(selectedType, topic.trim())
      console.log('[Frontend] API call completed, result:', result)
      
      // 생성 완료 후 임시 게시물 제거 및 목록 새로고침
      removeGeneratingPost(tempId)
      refreshPosts()
      
      setSuccess(true)
      setTopic('')
      setGeneratingStep('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      // 에러 발생 시 임시 게시물 제거
      console.error('[Frontend] Error during generation:', err)
      removeGeneratingPost(tempId)
      setError(err instanceof Error ? err.message : '생성에 실패했습니다')
      setGeneratingStep('')
    } finally {
      setIsGenerating(false)
    }
  }

  const types: PostType[] = ['ag', 'pro', 'br', 'in']

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-notion-text mb-2">게시물 생성</h2>
        <p className="text-sm text-notion-muted">AI로 새로운 쓰레드 게시물 만들기</p>
      </div>

      {autoStatus && (
        <div className="mb-4 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded">
          {autoStatus}
        </div>
      )}

      {(!config?.geminiApiKey || !config?.perplexityApiKey) && (
        <div className="mb-4 px-3 py-2 bg-yellow-50 text-yellow-700 text-sm rounded">
          먼저 설정에서 Gemini API 키와 Perplexity API 키를 설정해주세요
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-notion-text mb-2">
            게시물 유형
          </label>
          <div className="flex gap-2 flex-wrap">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedType === type
                    ? 'bg-notion-text text-white'
                    : 'bg-notion-sidebar text-notion-muted hover:bg-notion-hover'
                }`}
              >
                {POST_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-notion-muted">
            {selectedType === 'ag' && '후킹: 강력한 훅으로 도달률을 높이는 광범위한 주제'}
            {selectedType === 'pro' && '증명: 능력을 입증하고 독자를 전환시키는 콘텐츠'}
            {selectedType === 'br' && '브랜드: 가치와 스토리를 공유하여 연결 만들기'}
            {selectedType === 'in' && '인사이트: 바이브 코딩에 대한 상세한 정보'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-notion-text mb-2">
            주제 (선택사항)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="주제를 입력하거나 비워두면 AI가 최신 트렌드를 조사합니다..."
            className="w-full px-4 py-3 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20 disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={isGenerating}
          />
          <p className="mt-2 text-xs text-notion-muted">
            주제를 비워두면 AI가 최신 AI 및 코딩 트렌드를 광범위하게 조사하여 게시물을 생성합니다
          </p>
        </div>

        {generatingStep && (
          <div className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {generatingStep}
          </div>
        )}

        {error && (
          <div className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded">{error}</div>
        )}

        {success && (
          <div className="px-3 py-2 bg-green-50 text-green-600 text-sm rounded">
            게시물이 성공적으로 생성되었습니다! 게시물 페이지를 확인하세요.
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !config?.geminiApiKey || !config?.perplexityApiKey}
          className="w-full px-4 py-3 bg-notion-text text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? '생성 중...' : '게시물 생성'}
        </button>
      </div>
    </div>
  )
}

export default GeneratePage
