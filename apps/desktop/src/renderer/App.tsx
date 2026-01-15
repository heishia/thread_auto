import { useState } from 'react'
import Sidebar from './components/Sidebar'
import PostList from './components/PostList'
import GeneratePage from './components/GeneratePage'
import SettingsPage from './components/SettingsPage'

type Page = 'posts' | 'generate' | 'settings'

function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>('posts')

  const renderPage = () => {
    switch (currentPage) {
      case 'posts':
        return <PostList />
      case 'generate':
        return <GeneratePage />
      case 'settings':
        return <SettingsPage />
      default:
        return <PostList />
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto bg-white">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
