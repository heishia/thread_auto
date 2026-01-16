import { useState, useEffect, useCallback } from 'react'
import PostCard from './PostCard'
import { Post, PostType, POST_TYPE_LABELS, POST_TYPE_COLORS } from '../types'
import { useGeneration } from '../contexts/GenerationContext'
import { useToast } from '../contexts/ToastContext'

function PostList(): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([])
  const [filterType, setFilterType] = useState<PostType | 'all'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkType, setBulkType] = useState<PostType>('ag')
  const [bulkCount, setBulkCount] = useState(3)
  const [bulkTopic, setBulkTopic] = useState('')
  const [useTopicSetting, setUseTopicSetting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0 })
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [showAutoModal, setShowAutoModal] = useState(false)
  const [autoInterval, setAutoInterval] = useState(15)
  const [isAutoGenerating, setIsAutoGenerating] = useState(false)
  const { generatingPosts, addGeneratingPost, updateGeneratingStatus, removeGeneratingPost, refreshPosts, refreshTrigger } = useGeneration()
  const { showToast } = useToast()

  const loadPosts = useCallback(async () => {
    const data = await window.api.posts.get()
    setPosts(data)
  }, [])

  const loadAutoStatus = useCallback(async () => {
    const status = await window.api.autoGeneration.status()
    setAutoEnabled(status.enabled)
    setAutoInterval(status.interval)
    setIsAutoGenerating(status.isGenerating)
  }, [])

  useEffect(() => {
    loadPosts()
    loadAutoStatus()
  }, [loadPosts, loadAutoStatus, refreshTrigger])

  useEffect(() => {
    const unsubGenerating = window.api.autoGeneration.onGenerating((generating) => {
      setIsAutoGenerating(generating)
    })

    const unsubGenerated = window.api.autoGeneration.onGenerated(() => {
      loadPosts()
      showToast('게시물이 자동 생성되었습니다', 'success')
    })

    return () => {
      unsubGenerating()
      unsubGenerated()
    }
  }, [loadPosts, showToast])

  const handleDelete = async (id: string) => {
    await window.api.posts.delete(id)
    loadPosts()
  }

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content)
    const post = posts.find((p) => p.content === content)
    if (post) {
      setCopiedId(post.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleViewThread = (post: Post) => {
    setSelectedPost(post)
  }

  const handleCopyThread = async (post: Post) => {
    const fullThread = [post.content, ...(post.thread || [])].join('\n\n---\n\n')
    await navigator.clipboard.writeText(fullThread)
    setCopiedId(post.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredPosts =
    filterType === 'all' ? posts : posts.filter((p) => p.type === filterType)

  const typeFilters: (PostType | 'all')[] = ['all', 'ag', 'pro', 'br', 'in']

  const handleBulkGenerate = async () => {
    setIsGenerating(true)
    setGeneratingProgress({ current: 0, total: bulkCount })
    setShowBulkModal(false)

    const tempIds: string[] = []
    for (let i = 0; i < bulkCount; i++) {
      const tempId = addGeneratingPost(bulkType, useTopicSetting && bulkTopic.trim() ? bulkTopic.trim() : '주제 선정 중...')
      tempIds.push(tempId)
    }

    try {
      const topic = useTopicSetting && bulkTopic.trim() ? bulkTopic.trim() : ''
      const posts = await window.api.generate.bulk(bulkType, bulkCount, topic)
      
      setGeneratingProgress({ current: posts.length, total: bulkCount })
      refreshPosts()
    } catch (error) {
      console.error('Bulk generation failed:', error)
    } finally {
      tempIds.forEach(id => removeGeneratingPost(id))
      setIsGenerating(false)
      setGeneratingProgress({ current: 0, total: 0 })
      setBulkTopic('')
      setUseTopicSetting(false)
    }
  }

  const types: PostType[] = ['ag', 'pro', 'br', 'in']

  return (
    <div className="p-6 max-w-4xl mx-auto relative">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-notion-text mb-2">게시물</h2>
        <p className="text-sm text-notion-muted">
          쓰레드에 복사할 수 있는 생성된 게시물
        </p>
      </div>

      {/* 생성 진행 상태 표시 */}
      {isGenerating && (
        <div className="mb-4 px-4 py-3 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-center gap-3">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>게시물 생성 중... ({generatingProgress.current}/{generatingProgress.total})</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {typeFilters.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filterType === type
                ? 'bg-notion-text text-white'
                : 'bg-notion-sidebar text-notion-muted hover:bg-notion-hover'
            }`}
          >
            {type === 'all' ? '전체' : POST_TYPE_LABELS[type]}
          </button>
        ))}
        <span className="ml-auto text-xs text-notion-muted">
          {filteredPosts.length}개
        </span>
      </div>

      {filteredPosts.length === 0 && generatingPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-notion-muted">아직 게시물이 없습니다</p>
          <p className="text-sm text-notion-muted mt-1">
            생성하기 페이지에서 새 게시물을 만들어보세요
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 생성 중인 게시물 표시 */}
          {generatingPosts
            .filter(gp => filterType === 'all' || gp.type === filterType)
            .map((generatingPost) => (
            <div key={generatingPost.id} className="relative">
              <div className="border border-notion-border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 text-blue-600">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">게시물 생성 중</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* 실제 게시물 표시 */}
          {filteredPosts.map((post) => (
            <div key={post.id} className="relative">
              {copiedId === post.id && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded z-10">
                  복사됨!
                </div>
              )}
              <PostCard post={post} onDelete={handleDelete} onCopy={handleCopy} onViewThread={handleViewThread} />
            </div>
          ))}
        </div>
      )}

      {/* 플로팅 버튼 */}
      <div className="fixed right-8 bottom-8 flex items-center gap-3 z-50">
        <button
          onClick={() => setShowAutoModal(true)}
          className={`w-14 h-14 rounded-full shadow-lg transition-all flex items-center justify-center text-sm font-bold ${
            autoEnabled
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
          }`}
          title="자동 생성 설정"
        >
          auto
        </button>
        <button
          onClick={() => setShowBulkModal(true)}
          disabled={isGenerating}
          className="w-14 h-14 bg-notion-text text-white rounded-full shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-2xl"
          title="여러 게시물 생성"
        >
          +
        </button>
      </div>

      {/* 스레드 보기 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-notion-border flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-notion-text">전체 스레드</h3>
                <p className="text-sm text-notion-muted mt-1">
                  {selectedPost.thread ? `총 ${selectedPost.thread.length + 1}개의 게시물` : '1개의 게시물'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-notion-muted hover:text-notion-text transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 첫 번째 게시물 */}
              <div className="border-l-4 border-red-500 pl-4 pr-4 relative group">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-notion-muted">1/{(selectedPost.thread?.length || 0) + 1}</span>
                  <button
                    onClick={() => handleCopy(selectedPost.content)}
                    className="px-2 py-1 text-xs font-medium text-notion-text bg-notion-sidebar hover:bg-notion-hover rounded transition-colors"
                  >
                    복사
                  </button>
                </div>
                <div className="text-sm text-notion-text whitespace-pre-wrap leading-relaxed">
                  {selectedPost.content}
                </div>
              </div>

              {/* 연결된 게시물들 */}
              {selectedPost.thread && selectedPost.thread.map((threadContent, index) => (
                <div key={index} className="border-l-4 border-gray-300 pl-4 pr-4 relative group">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-notion-muted">{index + 2}/{selectedPost.thread!.length + 1}</span>
                    <button
                      onClick={() => handleCopy(threadContent)}
                      className="px-2 py-1 text-xs font-medium text-notion-text bg-notion-sidebar hover:bg-notion-hover rounded transition-colors"
                    >
                      복사
                    </button>
                  </div>
                  <div className="text-sm text-notion-text whitespace-pre-wrap leading-relaxed">
                    {threadContent}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 대량 생성 모달 */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBulkModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-notion-text mb-4">여러 게시물 생성</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-notion-text mb-2">
                  게시물 유형
                </label>
                <div className="flex gap-2 flex-wrap">
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => setBulkType(type)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        bulkType === type
                          ? 'bg-notion-text text-white'
                          : 'bg-notion-sidebar text-notion-muted hover:bg-notion-hover'
                      }`}
                    >
                      {POST_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-notion-text mb-2">
                  생성할 개수
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bulkCount === 0 ? '' : bulkCount}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setBulkCount(0)
                    } else if (/^\d+$/.test(value)) {
                      const num = Number(value)
                      if (num <= 10) {
                        setBulkCount(num)
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || Number(e.target.value) === 0) {
                      setBulkCount(1)
                    }
                  }}
                  className="w-full px-4 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
                />
                <p className="mt-1 text-xs text-notion-muted">
                  최대 10개까지 생성 가능합니다
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-notion-text">
                    주제 설정
                  </label>
                  <button
                    onClick={() => {
                      setUseTopicSetting(!useTopicSetting)
                      if (useTopicSetting) {
                        setBulkTopic('')
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      useTopicSetting
                        ? 'bg-notion-text text-white'
                        : 'bg-notion-sidebar text-notion-muted hover:bg-notion-hover'
                    }`}
                  >
                    {useTopicSetting ? '사용' : '사용 안 함'}
                  </button>
                </div>
                {useTopicSetting && (
                  <div>
                    <input
                      type="text"
                      value={bulkTopic}
                      onChange={(e) => setBulkTopic(e.target.value)}
                      placeholder="주제를 입력하세요..."
                      className="w-full px-4 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
                    />
                    <p className="mt-1 text-xs text-notion-muted">
                      주제를 설정하면 AI가 주제를 조사한 후 게시물을 생성합니다 (2단계)
                    </p>
                  </div>
                )}
                {!useTopicSetting && (
                  <p className="text-xs text-notion-muted">
                    랜덤 주제로 빠르게 생성됩니다
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBulkGenerate}
                  className="flex-1 px-4 py-2 bg-notion-text text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  생성하기
                </button>
                <button
                  onClick={() => {
                    setShowBulkModal(false)
                    setBulkTopic('')
                    setUseTopicSetting(false)
                  }}
                  className="px-4 py-2 bg-notion-sidebar text-notion-text font-medium rounded-lg hover:bg-notion-hover transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 자동 생성 설정 모달 */}
      {showAutoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAutoModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-notion-text mb-4">자동 생성 설정</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-notion-text">자동 생성</p>
                  <p className="text-xs text-notion-muted">설정된 간격으로 자동으로 게시물을 생성합니다</p>
                </div>
                <button
                  onClick={async () => {
                    const newEnabled = !autoEnabled
                    setAutoEnabled(newEnabled)
                    await window.api.autoGeneration.setConfig(newEnabled, autoInterval)
                    if (newEnabled) {
                      showToast('자동 생성이 활성화되었습니다 (백그라운드에서 실행)', 'success')
                    } else {
                      showToast('자동 생성이 비활성화되었습니다', 'info')
                    }
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    autoEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-0 w-4 h-4 bg-white rounded-full transition-transform ${
                      autoEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className={autoEnabled ? '' : 'opacity-50 pointer-events-none'}>
                <label className="block text-sm font-medium text-notion-text mb-2">
                  생성 주기 (분)
                </label>
                <input
                  type="number"
                  value={autoInterval}
                  onChange={(e) => setAutoInterval(Number(e.target.value))}
                  min={1}
                  max={120}
                  className="w-full px-4 py-2 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
                />
                <p className="mt-1 text-xs text-notion-muted">
                  권장: 15분 (시간당 4개 게시물)
                </p>
              </div>

              {autoEnabled && (
                <div className="px-3 py-2 bg-blue-50 text-blue-700 text-xs rounded-lg">
                  {isAutoGenerating ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      게시물 생성 중...
                    </span>
                  ) : (
                    `다음 생성까지 ${autoInterval}분 간격으로 자동 생성됩니다`
                  )}
                </div>
              )}

              <div className="px-3 py-2 bg-green-50 text-green-700 text-xs rounded-lg">
                창을 닫아도 시스템 트레이에서 백그라운드로 계속 실행됩니다
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={async () => {
                    await window.api.autoGeneration.setConfig(autoEnabled, autoInterval)
                    setShowAutoModal(false)
                    showToast('자동 생성 설정이 저장되었습니다', 'success')
                  }}
                  className="flex-1 px-4 py-2 bg-notion-text text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => setShowAutoModal(false)}
                  className="px-4 py-2 bg-notion-sidebar text-notion-text font-medium rounded-lg hover:bg-notion-hover transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostList
