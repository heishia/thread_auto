interface SidebarProps {
  currentPage: 'posts' | 'generate' | 'settings'
  onPageChange: (page: 'posts' | 'generate' | 'settings') => void
}

function Sidebar({ currentPage, onPageChange }: SidebarProps): JSX.Element {
  const navItems = [
    { id: 'posts' as const, label: 'Posts', icon: '📝' },
    { id: 'generate' as const, label: 'Generate', icon: '✨' },
    { id: 'settings' as const, label: 'Settings', icon: '⚙️' }
  ]

  return (
    <aside className="w-60 h-full bg-notion-sidebar border-r border-notion-border flex flex-col">
      <div className="p-4 border-b border-notion-border">
        <h1 className="text-lg font-semibold text-notion-text">ThreadAuto</h1>
        <p className="text-xs text-notion-muted mt-1">Thread Post Generator</p>
      </div>

      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              currentPage === item.id
                ? 'bg-notion-hover text-notion-text font-medium'
                : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-notion-border">
        <p className="text-xs text-notion-muted">v1.0.0</p>
      </div>
    </aside>
  )
}

export default Sidebar
