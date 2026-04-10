import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { repoApi } from '@/services/api';
import RepoIngest from '@/components/RepoIngest';
import ChatInterface from '@/components/ChatInterface';
import SearchPanel from '@/components/SearchPanel';
import { Terminal, LogOut, MessageSquare, Search, GitBranch, LayoutDashboard, ChevronLeft, ChevronRight, ChevronDown, Check, Loader2 } from 'lucide-react';
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
  const [repoHistory, setRepoHistory] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleIngested = useCallback((data) => {
    setRepoData(data);
    setRepoHistory((prev) => {
      const filtered = prev.filter((r) => r.repo !== data.repo);
      return [{ repo: data.repo, chunkCount: data.chunkCount, fileCount: data.fileCount, active: true }, ...filtered.map((r) => ({ ...r, active: false }))];
    });
  }, []);

  const handleSwitch = useCallback(async (repoUrl) => {
    if (repoUrl === repoData?.repo) { setDropdownOpen(false); return; }
    setSwitching(true);
    try {
      const { data } = await repoApi.switchRepo(repoUrl);
      const hist = repoHistory.find((r) => r.repo === repoUrl);
      setRepoData({ repo: data.repo, chunkCount: data.totalEmbeddings, fileCount: hist?.fileCount || '?' });
      setRepoHistory((prev) => prev.map((r) => ({ ...r, active: r.repo === repoUrl })));
    } catch (err) {
      console.error('Switch failed:', err);
    } finally {
      setSwitching(false);
      setDropdownOpen(false);
    }
  }, [repoData, repoHistory]);

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
          {/* Repo status indicator with dropdown */}
          {repoHistory.length > 0 && (
            <div className="mb-2 relative" data-testid="repo-status-indicator">
              {collapsed ? (
                <div className="flex justify-center p-2 rounded-md border border-[#1A1A1A] bg-[#111111]" title={repoData?.repo}>
                  <GitBranch className="w-4 h-4 text-green-400" />
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    data-testid="repo-switcher-button"
                    className="w-full rounded-md border border-[#1A1A1A] bg-[#111111] px-3 py-2.5 text-left transition-all duration-200 hover:border-[#262626]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <GitBranch className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span className="text-xs text-[#A3A3A3] font-mono truncate">
                          {repoData?.repo?.replace('https://github.com/', '')}
                        </span>
                      </div>
                      {switching ? (
                        <Loader2 className="w-3 h-3 text-[#525252] animate-spin shrink-0" />
                      ) : (
                        <ChevronDown className={`w-3 h-3 text-[#525252] shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                    <div className="flex gap-3 text-[10px] text-[#525252] font-mono mt-1">
                      <span>{repoData?.fileCount} files</span>
                      <span>{repoData?.chunkCount} chunks</span>
                    </div>
                  </button>

                  {dropdownOpen && repoHistory.length > 1 && (
                    <div
                      className="absolute bottom-full left-0 right-0 mb-1 bg-[#141414] border border-[#262626] rounded-md overflow-hidden shadow-lg z-50 animate-fade-in"
                      data-testid="repo-switcher-dropdown"
                    >
                      <div className="px-3 py-2 border-b border-[#1A1A1A]">
                        <span className="text-[10px] uppercase tracking-[0.15em] text-[#525252] font-ibm">Switch repository</span>
                      </div>
                      {repoHistory.map((r) => (
                        <button
                          key={r.repo}
                          onClick={() => handleSwitch(r.repo)}
                          data-testid={`repo-option-${r.repo.replace(/[^a-z0-9]/gi, '-')}`}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-mono transition-colors duration-150 ${
                            r.active
                              ? 'bg-[#1A1A1A] text-white'
                              : 'text-[#737373] hover:bg-[#1A1A1A] hover:text-[#A3A3A3]'
                          }`}
                        >
                          {r.active ? <Check className="w-3 h-3 text-green-400 shrink-0" /> : <div className="w-3 h-3 shrink-0" />}
                          <span className="truncate">{r.repo.replace('https://github.com/', '')}</span>
                          <span className="text-[10px] text-[#525252] ml-auto shrink-0">{r.chunkCount}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

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
                <RepoIngest onIngested={handleIngested} />
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
