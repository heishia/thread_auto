import { useState, useEffect, useRef, useCallback } from 'react'
import { PostType, POST_TYPE_LABELS, AppConfig } from '../types'

function GeneratePage(): JSX.Element {
  const [selectedType, setSelectedType] = useState<PostType>('ag')
  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [autoStatus, setAutoStatus] = useState<string>('')
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
        setAutoStatus('Auto-generating...')
        try {
          await window.api.generate.auto()
          setAutoStatus(`Last auto-generated: ${new Date().toLocaleTimeString()}`)
        } catch {
          setAutoStatus('Auto-generation failed')
        }
      }

      autoIntervalRef.current = setInterval(runAutoGenerate, intervalMs)
      setAutoStatus(`Auto-generation enabled (every ${config.autoGenerateInterval} min)`)

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
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccess(false)

    try {
      await window.api.generate.post(selectedType, topic.trim())
      setSuccess(true)
      setTopic('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const types: PostType[] = ['ag', 'pro', 'br', 'in']

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-notion-text mb-2">Generate Post</h2>
        <p className="text-sm text-notion-muted">Create a new Threads post with AI</p>
      </div>

      {autoStatus && (
        <div className="mb-4 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded">
          {autoStatus}
        </div>
      )}

      {!config?.geminiApiKey && (
        <div className="mb-4 px-3 py-2 bg-yellow-50 text-yellow-700 text-sm rounded">
          Please configure your Gemini API key in Settings first
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-notion-text mb-2">
            Post Type
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
            {selectedType === 'ag' && 'Aggro: Broad topics to increase reach with strong hooks'}
            {selectedType === 'pro' && 'Proof: Demonstrate abilities and convert readers'}
            {selectedType === 'br' && 'Brand: Share values and stories for connection'}
            {selectedType === 'in' && 'Insight: Detailed vibe coding information'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-notion-text mb-2">
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic for the post..."
            className="w-full px-4 py-3 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
            disabled={isGenerating || !config?.geminiApiKey}
          />
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded">{error}</div>
        )}

        {success && (
          <div className="px-3 py-2 bg-green-50 text-green-600 text-sm rounded">
            Post generated successfully! Check the Posts page.
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !config?.geminiApiKey}
          className="w-full px-4 py-3 bg-notion-text text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Post'}
        </button>
      </div>
    </div>
  )
}

export default GeneratePage
