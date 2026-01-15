import { useState, useEffect, useCallback } from 'react'
import PostCard from './PostCard'
import { Post, PostType, POST_TYPE_LABELS } from '../types'

function PostList(): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([])
  const [filterType, setFilterType] = useState<PostType | 'all'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-notion-text mb-2">게시물</h2>
        <p className="text-sm text-notion-muted">
          쓰레드에 복사할 수 있는 생성된 게시물
        </p>
      </div>

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
    </div>
  )
}

export default PostList
