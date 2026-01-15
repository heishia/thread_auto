import { Post, POST_TYPE_LABELS, POST_TYPE_COLORS } from '../types'

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

  return (
    <div 
      className={`bg-white border border-notion-border rounded-lg p-4 hover:shadow-sm transition-shadow ${hasThread ? 'cursor-pointer' : ''}`}
      onDoubleClick={() => hasThread && onViewThread?.(post)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium text-white rounded ${POST_TYPE_COLORS[post.type]}`}
          >
            {POST_TYPE_LABELS[post.type]}
          </span>
          <span className="text-xs text-notion-muted">{formatDate(post.createdAt)}</span>
          {hasThread && (
            <span className="px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded">
              스레드 {post.thread.length + 1}개
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-notion-muted mb-2">주제: {post.topic}</p>

      <div className="text-sm text-notion-text whitespace-pre-wrap leading-relaxed mb-4 max-h-48 overflow-y-auto">
        {post.content}
      </div>

      {hasThread && (
        <div className="mb-3 px-3 py-2 bg-blue-50 text-blue-700 text-xs rounded">
          더블클릭하여 전체 스레드 보기
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-notion-border">
        <button
          onClick={() => onCopy(post.content)}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-notion-text bg-notion-sidebar hover:bg-notion-hover rounded transition-colors"
        >
          복사
        </button>
        {hasThread && (
          <button
            onClick={() => onViewThread?.(post)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
          >
            전체 보기
          </button>
        )}
        <button
          onClick={() => onDelete(post.id)}
          className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

export default PostCard
