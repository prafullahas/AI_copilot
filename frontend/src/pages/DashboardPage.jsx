import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RepoIngest from '@/components/RepoIngest';
import ChatInterface from '@/components/ChatInterface';
import SearchPanel from '@/components/SearchPanel';
import { Terminal, LogOut, MessageSquare, Search, GitBranch, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'search', label: 'Search', icon: Search },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [repoData, setRepoData] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="h-screen bg-[#0A0A0A] flex overflow-hidden" data-testid="dashboard-page">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-56'} border-r border-[#1A1A1A] flex flex-col shrink-0 transition-all duration-300 ease-in-out bg-[#0A0A0A]`}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className={`h-14 flex items-center ${collapsed ? 'justify-center' : 'px-5'} shrink-0`}>
          <Terminal className="w-5 h-5 text-blue-500 shrink-0" />
          {!collapsed && (
            <span className="font-outfit text-lg font-light text-white tracking-tight ml-3">Copilot</span>
          )}
        </div>

        <Separator className="bg-[#1A1A1A]" />

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              data-testid={`nav-${id}`}
              className={`w-full flex items-center gap-3 rounded-md text-sm font-ibm transition-all duration-200 ${
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
              } ${
                activeView === id
                  ? 'bg-[#141414] text-white border border-[#262626]'
                  : 'text-[#737373] hover:text-[#A3A3A3] hover:bg-[#111111] border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse toggle + Logout */}
        <div className="px-2 pb-3 space-y-1">
          <Separator className="bg-[#1A1A1A] mb-2" />
          <button
            onClick={() => setCollapsed(!collapsed)}
            data-testid="sidebar-toggle"
            className={`w-full flex items-center gap-3 rounded-md text-xs text-[#525252] hover:text-[#737373] transition-all duration-200 ${
              collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
            }`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4 shrink-0" /><span>Collapse</span></>}
          </button>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className={`w-full flex items-center gap-3 rounded-md text-xs text-[#525252] hover:text-red-400 transition-all duration-200 ${
              collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Dashboard view */}
        {activeView === 'dashboard' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden animate-fade-in">
            {/* Left: Repo + Search */}
            <div className="w-full lg:w-[440px] border-b lg:border-b-0 lg:border-r border-[#1A1A1A] flex flex-col shrink-0 overflow-hidden">
              <div className="p-5 border-b border-[#1A1A1A]">
                <RepoIngest onIngested={setRepoData} />
              </div>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <SearchPanel />
              </div>
            </div>
            {/* Right: Chat */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ChatInterface />
            </div>
          </div>
        )}

        {/* Chat-only view */}
        {activeView === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
            <ChatInterface />
          </div>
        )}

        {/* Search-only view */}
        {activeView === 'search' && (
          <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-[#1A1A1A]">
              <RepoIngest onIngested={setRepoData} />
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <SearchPanel />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
