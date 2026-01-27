interface SidebarProps {
  currentPage: 'posts' | 'pending' | 'settings'
  onPageChange: (page: 'posts' | 'pending' | 'settings') => void
  pendingCount?: number
}

function Sidebar({ currentPage, onPageChange, pendingCount = 0 }: SidebarProps): JSX.Element {
  const navItems = [
    { id: 'posts' as const, label: '게시물', icon: '📝' },
    { id: 'pending' as const, label: '대기', icon: '⏰', badge: pendingCount },
    { id: 'settings' as const, label: '설정', icon: '⚙️' }
  ]

  return (
    <aside className="w-60 h-full bg-notion-sidebar border-r border-notion-border flex flex-col">
      <div className="p-4 border-b border-notion-border">
        <h1 className="text-lg font-semibold text-notion-text">ThreadAuto</h1>
        <p className="text-xs text-notion-muted mt-1">쓰레드 게시물 생성기</p>
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
            <span className="flex-1 text-left">{item.label}</span>
            {'badge' in item && item.badge > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium text-white bg-blue-500 rounded-full">
                {item.badge}
              </span>
            )}
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
