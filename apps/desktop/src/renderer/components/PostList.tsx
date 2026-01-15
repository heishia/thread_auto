import { useState, useEffect, useCallback } from 'react'
import PostCard from './PostCard'
import { Post, PostType, POST_TYPE_LABELS } from '../types'

function PostList(): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([])
  const [filterType, setFilterType] = useState<PostType | 'all'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkType, setBulkType] = useState<PostType>('ag')
  const [bulkCount, setBulkCount] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0 })

  const loadPosts = useCallback(async () => {
    const data = await window.api.posts.get()
    setPosts(data)
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

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

  const filteredPosts =
    filterType === 'all' ? posts : posts.filter((p) => p.type === filterType)

  const typeFilters: (PostType | 'all')[] = ['all', 'ag', 'pro', 'br', 'in']

  const handleBulkGenerate = async () => {
    setIsGenerating(true)
    setGeneratingProgress({ current: 0, total: bulkCount })
    setShowBulkModal(false)

    try {
      // 병렬로 여러 게시물 생성
      const generatePromises = Array.from({ length: bulkCount }, async (_, index) => {
        try {
          // 각 게시물에 대해 랜덤 주제 생성
          const topics = [
            '바이브 코딩 생산성 팁',
            '개발자를 위한 AI 도구',
            'AI로 코딩 배우기',
            'AI로 프로젝트 빠르게 만들기',
            '최신 개발 트렌드',
            '효율적인 코딩 습관',
            '코드 리뷰 베스트 프랙티스',
            '개발자 커리어 성장',
            '오픈소스 기여 방법',
            '테스트 주도 개발'
          ]
          const randomTopic = topics[Math.floor(Math.random() * topics.length)]
          
          const result = await window.api.generate.post(bulkType, randomTopic)
          
          // 진행 상태 업데이트
          setGeneratingProgress((prev) => ({ ...prev, current: prev.current + 1 }))
          
          return result
        } catch (error) {
          console.error(`Failed to generate post ${index + 1}:`, error)
          setGeneratingProgress((prev) => ({ ...prev, current: prev.current + 1 }))
          return null
        }
      })

      await Promise.all(generatePromises)
      
      // 게시물 목록 새로고침
      await loadPosts()
    } catch (error) {
      console.error('Bulk generation failed:', error)
    } finally {
      setIsGenerating(false)
      setGeneratingProgress({ current: 0, total: 0 })
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

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-notion-muted">아직 게시물이 없습니다</p>
          <p className="text-sm text-notion-muted mt-1">
            생성하기 페이지에서 새 게시물을 만들어보세요
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="relative">
              {copiedId === post.id && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded z-10">
                  복사됨!
                </div>
              )}
              <PostCard post={post} onDelete={handleDelete} onCopy={handleCopy} />
            </div>
          ))}
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setShowBulkModal(true)}
        disabled={isGenerating}
        className="fixed right-8 bottom-8 w-14 h-14 bg-notion-text text-white rounded-full shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-2xl z-50"
        title="여러 게시물 생성"
      >
        +
      </button>

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

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBulkGenerate}
                  className="flex-1 px-4 py-2 bg-notion-text text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  생성하기
                </button>
                <button
                  onClick={() => setShowBulkModal(false)}
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
