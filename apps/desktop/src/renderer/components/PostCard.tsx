import { Post, POST_TYPE_LABELS } from '../types'

interface PostCardProps {
  post: Post
  onDelete: (id: string) => void
  onCopy: (content: string) => void
  onViewThread?: (post: Post) => void
}

function PostCard({ post, onDelete, onCopy, onViewThread }: PostCardProps): JSX.Element {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const hasThread = post.thread && post.thread.length > 0
  const isGenerating = post.id.startsWith('temp-')

  // 생성 중일 때는 심플한 UI만 표시
  if (isGenerating) {
    return (
      <div className="bg-white border border-notion-border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-blue-600">게시물 생성 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`bg-white border border-notion-border rounded-lg p-4 hover:shadow-sm transition-shadow ${hasThread ? 'cursor-pointer' : ''}`}
      onDoubleClick={() => hasThread && onViewThread?.(post)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 text-xs font-medium text-white bg-black rounded"
          >
            {POST_TYPE_LABELS[post.type]}
          </span>
          <span className="text-xs text-notion-muted">{formatDate(post.createdAt)}</span>
          {hasThread && (
            <span className="px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded">
              스레드 {(post.thread?.length || 0) + 1}개
            </span>
          )}
        </div>
      </div>

      <div className="text-sm text-notion-text whitespace-pre-wrap leading-relaxed mb-3 max-h-48 overflow-y-auto">
        {post.content}
      </div>

      <div className="flex items-center gap-1.5 justify-end">
        <button
          onClick={() => onCopy(post.content)}
          className="px-2 py-1 text-xs font-medium text-notion-text bg-notion-sidebar hover:bg-notion-hover rounded transition-colors"
        >
          복사
        </button>
        <button
          onClick={() => onDelete(post.id)}
          className="px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

export default PostCard
