import { useState } from 'react'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (scheduledAt: string) => void
}

function ScheduleModal({ isOpen, onClose, onConfirm }: ScheduleModalProps): JSX.Element | null {
  const [customDateTime, setCustomDateTime] = useState('')

  if (!isOpen) return null

  const getPresetTime = (hoursFromNow: number): string => {
    const date = new Date()
    date.setHours(date.getHours() + hoursFromNow)
    return date.toISOString()
  }

  const handlePresetClick = (hours: number) => {
    onConfirm(getPresetTime(hours))
    onClose()
  }

  const handleCustomConfirm = () => {
    if (customDateTime) {
      const date = new Date(customDateTime)
      if (date > new Date()) {
        onConfirm(date.toISOString())
        onClose()
      }
    }
  }

  const formatPresetTime = (hours: number): string => {
    const date = new Date()
    date.setHours(date.getHours() + hours)
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // datetime-local 입력에 사용할 최소값 (현재 시간)
  const getMinDateTime = (): string => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-notion-text mb-4">예약 발행 시간 설정</h3>
          
          {/* 프리셋 버튼 */}
          <div className="space-y-2 mb-6">
            <p className="text-sm text-notion-muted mb-2">빠른 선택</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((hours) => (
                <button
                  key={hours}
                  onClick={() => handlePresetClick(hours)}
                  className="px-3 py-3 bg-notion-sidebar hover:bg-notion-hover rounded-lg transition-colors text-center"
                >
                  <div className="text-sm font-medium text-notion-text">{hours}시간 뒤</div>
                  <div className="text-xs text-notion-muted mt-1">{formatPresetTime(hours)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 */}
          <div className="border-t border-notion-border pt-4">
            <p className="text-sm text-notion-muted mb-2">직접 설정</p>
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              min={getMinDateTime()}
              className="w-full px-4 py-3 border border-notion-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-notion-text focus:ring-opacity-20"
            />
            <button
              onClick={handleCustomConfirm}
              disabled={!customDateTime}
              className="w-full mt-3 px-4 py-3 bg-notion-text text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이 시간에 예약
            </button>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="px-6 py-4 bg-notion-sidebar border-t border-notion-border rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-notion-muted hover:text-notion-text transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScheduleModal
