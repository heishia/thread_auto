import { useState } from 'react'
import Sidebar from './components/Sidebar'
import PostList from './components/PostList'
import SettingsPage from './components/SettingsPage'
import { GenerationProvider } from './contexts/GenerationContext'
import { ToastProvider } from './contexts/ToastContext'

type Page = 'posts' | 'settings'

function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>('posts')

  const renderPage = () => {
    switch (currentPage) {
      case 'posts':
        return <PostList />
      case 'settings':
        return <SettingsPage />
      default:
        return <PostList />
    }
  }

  return (
    <ToastProvider>
      <GenerationProvider>
        <div className="flex h-screen w-screen overflow-hidden">
          <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
          <main className="flex-1 overflow-auto bg-white">
            {renderPage()}
          </main>
        </div>
      </GenerationProvider>
    </ToastProvider>
  )
}

export default App
