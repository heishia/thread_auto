import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { PostType } from '../types'

export interface GeneratingPost {
  id: string
  type: PostType
  topic: string
  status: 'researching' | 'generating'
  createdAt: string
}

interface GenerationContextType {
  generatingPosts: GeneratingPost[]
  addGeneratingPost: (type: PostType, topic: string) => string
  updateGeneratingStatus: (id: string, status: 'researching' | 'generating') => void
  removeGeneratingPost: (id: string) => void
  refreshPosts: () => void
  refreshTrigger: number
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined)

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [generatingPosts, setGeneratingPosts] = useState<GeneratingPost[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const addGeneratingPost = useCallback((type: PostType, topic: string): string => {
    const id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newPost: GeneratingPost = {
      id,
      type,
      topic,
      status: 'researching',
      createdAt: new Date().toISOString()
    }
    setGeneratingPosts(prev => [newPost, ...prev])
    return id
  }, [])

  const updateGeneratingStatus = useCallback((id: string, status: 'researching' | 'generating') => {
    setGeneratingPosts(prev => 
      prev.map(post => post.id === id ? { ...post, status } : post)
    )
  }, [])

  const removeGeneratingPost = useCallback((id: string) => {
    setGeneratingPosts(prev => prev.filter(post => post.id !== id))
  }, [])

  const refreshPosts = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <GenerationContext.Provider
      value={{
        generatingPosts,
        addGeneratingPost,
        updateGeneratingStatus,
        removeGeneratingPost,
        refreshPosts,
        refreshTrigger
      }}
    >
      {children}
    </GenerationContext.Provider>
  )
}

export function useGeneration() {
  const context = useContext(GenerationContext)
  if (!context) {
    throw new Error('useGeneration must be used within GenerationProvider')
  }
  return context
}
