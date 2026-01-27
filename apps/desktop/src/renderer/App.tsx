import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import PostList from './components/PostList'
import PendingPage from './components/PendingPage'
import PublishPage from './components/PublishPage'
import SettingsPage from './components/SettingsPage'
import { GenerationProvider } from './contexts/GenerationContext'
import { ToastProvider } from './contexts/ToastContext'
import { Post } from './types'

type Page = 'posts' | 'pending' | 'publish' | 'settings'

function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>('posts')
  const [pendingCount, setPendingCount] = useState(0)

  const updatePendingCount = useCallback(async () => {
    try {
      const posts = await window.api.posts.get()
      const count = posts.filter((p: Post) => p.status === 'pending').length
      setPendingCount(count)
    } catch (error) {
      console.error('Failed to get pending count:', error)
    }
  }, [])

  useEffect(() => {
    updatePendingCount()
    // 페이지 변경 시마다 업데이트
  }, [currentPage, updatePendingCount])

  const renderPage = () => {
    switch (currentPage) {
      case 'posts':
        return <PostList onPostUpdate={updatePendingCount} />
      case 'pending':
        return <PendingPage />
      case 'publish':
        return <PublishPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <PostList onPostUpdate={updatePendingCount} />
    }
  }

  return (
    <ToastProvider>
      <GenerationProvider>
        <div className="flex h-screen w-screen overflow-hidden">
          <Sidebar 
            currentPage={currentPage} 
            onPageChange={setCurrentPage}
            pendingCount={pendingCount}
          />
          <main className="flex-1 overflow-auto bg-white">
            {renderPage()}
          </main>
        </div>
      </GenerationProvider>
    </ToastProvider>
  )
}

export default App
