import { Post, POST_TYPE_LABELS, POST_TYPE_COLORS } from '../types'

interface PostCardProps {
  post: Post
  onDelete: (id: string) => void
  onCopy: (content: string) => void
}

function PostCard({ post, onDelete, onCopy }: PostCardProps): JSX.Element {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white border border-notion-border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium text-white rounded ${POST_TYPE_COLORS[post.type]}`}
          >
            {POST_TYPE_LABELS[post.type]}
          </span>
          <span className="text-xs text-notion-muted">{formatDate(post.createdAt)}</span>
        </div>
      </div>

      <p className="text-xs text-notion-muted mb-2">Topic: {post.topic}</p>

      <div className="text-sm text-notion-text whitespace-pre-wrap leading-relaxed mb-4 max-h-48 overflow-y-auto">
        {post.content}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-notion-border">
        <button
          onClick={() => onCopy(post.content)}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-notion-text bg-notion-sidebar hover:bg-notion-hover rounded transition-colors"
        >
          Copy
        </button>
        <button
          onClick={() => onDelete(post.id)}
          className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default PostCard
