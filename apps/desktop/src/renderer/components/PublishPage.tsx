import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../contexts/ToastContext'

interface PublishStatus {
  enabled: boolean
  threadProfileUrl: string
  nextReminderTime: string | null
}

function PublishPage(): JSX.Element {
  const [status, setStatus] = useState<PublishStatus | null>(null)
  const [threadUrl, setThreadUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const loadStatus = useCallback(async () => {
    const s = await window.api.publish.getStatus()
    setStatus(s)
    setThreadUrl(s.threadProfileUrl)
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  // 1분마다 상태 업데이트 (다음 알림 시간 표시용)
  useEffect(() => {
    const interval = setInterval(loadStatus, 60000)
    return () => clearInterval(interval)
  }, [loadStatus])

  const handleToggleReminder = async () => {
    if (!status) return
    
    setIsLoading(true)
    try {
      if (status.enabled) {
        const newStatus = await window.api.publish.stopReminder()
        setStatus(newStatus)
        showToast('정각 알림이 중지되었습니다', 'info')
      } else {
        const newStatus = await window.api.publish.startReminder()
        setStatus(newStatus)
        showToast('정각 알림이 시작되었습니다', 'success')
      }
    } catch (error) {
      showToast('오류가 발생했습니다', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveUrl = async () => {
    if (!status) return
    
    setIsLoading(true)
    try {
      const newStatus = await window.api.publish.setConfig(threadUrl, status.enabled)
      setStatus(newStatus)
      showToast('스레드 URL이 저장되었습니다', 'success')
    } catch (error) {
      showToast('URL 저장에 실패했습니다', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenThreadsNow = async () => {
    try {
      await window.api.publish.openThreads()
      showToast('스레드 페이지를 열었습니다', 'success')
    } catch (error) {
      showToast('페이지 열기에 실패했습니다', 'error')
    }
  }

  const formatNextReminderTime = (isoString: string | null): string => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeUntilNextReminder = (isoString: string | null): string => {
    if (!isoString) return ''
    const now = new Date()
    const next = new Date(isoString)
    const diffMs = next.getTime() - now.getTime()
    
    if (diffMs <= 0) return '곧 알림'
    
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) {
      return `${diffMins}분 후`
    }
    return `약 1시간 후`
  }

  if (!status) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-notion-muted">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-notion-text mb-2">게시하기</h2>
        <p className="text-sm text-notion-muted">매시간 정각에 스레드 게시 알림을 받으세요</p>
      </div>

      <div className="space-y-8">
        {/* 현재 상태 섹션 */}
        <section className="p-4 bg-notion-sidebar rounded-lg border border-notion-border">
          <h3 className="text-sm font-medium text-notion-text mb-3">현재 상태</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-notion-muted mb-1">알림 상태</p>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium text-notion-text">
                  {status.enabled ? '활성화됨' : '비활성화됨'}
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-notion-muted mb-1">다음 알림</p>
              <p className="text-sm font-medium text-notion-text">
                {status.enabled ? (
                  <>
                    {formatNextReminderTime(status.nextReminderTime)}
                    <span className="text-xs text-notion-muted ml-2">
                      ({getTimeUntilNextReminder(status.nextReminderTime)})
                    </span>
                  </>
                ) : (
                  '-'
                )}
              </p>
            </div>
          </div>
        </section>

        {/* 스레드 URL 설정 */}
        <section>
          <h3 className="text-lg font-medium text-notion-text mb-4">스레드 프로필 URL</h3>
          
          <div className="space-y-3">
            <input
              type="text"
              value={threadUrl}
              onChange={(e) => setThreadUrl(e.target.value)}
              placeholder="https://www.threads.com/@username"
              className="w-full px-4 py-3 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
            />
            <p className="text-xs text-notion-muted">
              정각 알림 후 자동으로 열릴 스레드 페이지 URL을 입력하세요
            </p>
            <button
              onClick={handleSaveUrl}
              disabled={isLoading || threadUrl === status.threadProfileUrl}
              className="px-4 py-2 bg-notion-sidebar text-notion-text text-sm font-medium rounded-lg hover:bg-notion-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              URL 저장
            </button>
          </div>
        </section>

        {/* 정각 알림 토글 */}
        <section>
          <h3 className="text-lg font-medium text-notion-text mb-4">정각 알림</h3>
          
          <div className="p-4 bg-notion-sidebar rounded-lg border border-notion-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-notion-text">매시간 정각 알림</p>
                <p className="text-xs text-notion-muted mt-1">
                  매시간 정각에 Windows 알림을 표시하고 스레드 페이지를 엽니다
                </p>
              </div>
              <button
                onClick={handleToggleReminder}
                disabled={isLoading}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  status.enabled ? 'bg-green-500' : 'bg-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`absolute top-1 left-0 w-4 h-4 bg-white rounded-full transition-transform ${
                    status.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 수동 실행 버튼 */}
        <section>
          <h3 className="text-lg font-medium text-notion-text mb-4">수동 실행</h3>
          
          <button
            onClick={handleOpenThreadsNow}
            className="w-full px-6 py-4 bg-notion-text text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
          >
            <span>지금 스레드 열기</span>
          </button>
          <p className="text-xs text-notion-muted mt-2 text-center">
            알림 없이 바로 스레드 페이지를 엽니다
          </p>
        </section>

        {/* 워크플로우 안내 */}
        <section className="p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 mb-2">사용 방법</h4>
          <ol className="text-xs text-blue-600 space-y-1.5">
            <li>1. 스레드 프로필 URL을 설정합니다</li>
            <li>2. 정각 알림을 활성화합니다</li>
            <li>3. 매시간 정각에 Windows 알림이 표시됩니다</li>
            <li>4. 2초 후 자동으로 스레드 페이지가 열립니다</li>
            <li>5. 브라우저에서 직접 글을 작성하고 게시합니다</li>
          </ol>
        </section>
      </div>
    </div>
  )
}

export default PublishPage
