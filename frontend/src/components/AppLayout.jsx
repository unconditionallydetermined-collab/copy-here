import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell flex h-[100dvh] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="app-drawer-scrim fixed inset-0 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-60 internal-sidebar border-r flex flex-col
        app-drawer transform transition-transform duration-200
        safe-top safe-bottom
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content with contained overscroll and safe-area padding */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="internal-content flex-1 overflow-y-auto p-4 md:p-6"
          style={{
            overscrollBehavior: 'contain',
            paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
