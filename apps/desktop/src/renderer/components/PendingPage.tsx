import { useState, useEffect, useCallback } from 'react'
import { Post, POST_TYPE_LABELS } from '../types'
import { useToast } from '../contexts/ToastContext'
import ScheduleModal from './ScheduleModal'

function PendingPage(): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const { showToast } = useToast()

  const loadPosts = useCallback(async () => {
    try {
      const allPosts = await window.api.posts.get()
      // pending 상태인 게시물만 필터링하고 예약 시간 순으로 정렬
      const pendingPosts = allPosts
        .filter((p: Post) => p.status === 'pending')
        .sort((a: Post, b: Post) => {
          if (!a.scheduledAt || !b.scheduledAt) return 0
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        })
      setPosts(pendingPosts)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()
    
    // 1분마다 UI 업데이트 (남은 시간 표시용)
    const interval = setInterval(() => {
      setPosts(prev => [...prev])
    }, 60000)
    
    return () => clearInterval(interval)
  }, [loadPosts])

  const formatScheduledTime = (scheduledAt: string): string => {
    const date = new Date(scheduledAt)
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeRemaining = (scheduledAt: string): string => {
    const now = new Date()
    const scheduled = new Date(scheduledAt)
    const diff = scheduled.getTime() - now.getTime()
    
    if (diff <= 0) return '발행 대기 중...'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 후`
    }
    return `${minutes}분 후`
  }

  const handleCancel = async (postId: string) => {
    try {
      await window.api.schedule.cancel(postId)
      showToast('예약이 취소되었습니다', 'success')
      loadPosts()
    } catch (error) {
      console.error('Failed to cancel schedule:', error)
      showToast('예약 취소에 실패했습니다', 'error')
    }
  }

  const handleReschedule = async (scheduledAt: string) => {
    if (!editingPost) return
    
    try {
      await window.api.schedule.update(editingPost.id, scheduledAt)
      showToast('예약 시간이 변경되었습니다', 'success')
      setEditingPost(null)
      loadPosts()
    } catch (error) {
      console.error('Failed to reschedule:', error)
      showToast('예약 시간 변경에 실패했습니다', 'error')
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-notion-muted">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-notion-text mb-2">대기 중인 게시물</h2>
        <p className="text-sm text-notion-muted">
          예약된 시간에 자동으로 Threads에 발행됩니다
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-notion-muted">대기 중인 게시물이 없습니다</p>
          <p className="text-sm text-notion-muted mt-2">
            게시물 페이지에서 승인 버튼을 눌러 예약 발행을 설정하세요
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-notion-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-medium text-white bg-black rounded">
                    {POST_TYPE_LABELS[post.type]}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium text-orange-600 bg-orange-50 rounded">
                    예약됨
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-notion-text">
                    {post.scheduledAt && formatScheduledTime(post.scheduledAt)}
                  </div>
                  <div className="text-xs text-blue-600">
                    {post.scheduledAt && getTimeRemaining(post.scheduledAt)}
                  </div>
                </div>
              </div>

              <div className="text-sm text-notion-text whitespace-pre-wrap leading-relaxed mb-3 max-h-32 overflow-y-auto">
                {post.content}
              </div>

              {post.thread && post.thread.length > 0 && (
                <div className="text-xs text-notion-muted mb-3">
                  + {post.thread.length}개의 연결된 게시물
                </div>
              )}

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setEditingPost(post)}
                  className="px-3 py-1.5 text-xs font-medium text-notion-text bg-notion-sidebar hover:bg-notion-hover rounded transition-colors"
                >
                  시간 변경
                </button>
                <button
                  onClick={() => handleCancel(post.id)}
                  className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  예약 취소
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScheduleModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        onConfirm={handleReschedule}
      />
    </div>
  )
}

export default PendingPage
