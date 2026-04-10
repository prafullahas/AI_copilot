import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RepoIngest from '@/components/RepoIngest';
import ChatInterface from '@/components/ChatInterface';
import SearchPanel from '@/components/SearchPanel';
import { Terminal, LogOut, MessageSquare, Search, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [repoReady, setRepoReady] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col" data-testid="dashboard-page">
      {/* Header */}
      <header className="h-14 border-b border-[#262626] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-blue-500" />
          <span className="font-outfit text-lg font-light text-white tracking-tight">Copilot</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          data-testid="logout-button"
          className="text-[#A3A3A3] hover:text-white hover:bg-[#1E1E1E] font-ibm text-xs transition-all duration-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left panel — Repo + Search */}
        <div className="w-full lg:w-[420px] border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col shrink-0">
          <div className="p-5 border-b border-[#262626]">
            <RepoIngest onIngested={() => setRepoReady(true)} />
          </div>
          <div className="flex-1 min-h-0 hidden lg:flex flex-col">
            <SearchPanel />
          </div>
        </div>

        {/* Right panel — Tabs for mobile, Chat for desktop */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Mobile tabs */}
          <div className="lg:hidden flex flex-col flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
              <TabsList className="h-10 bg-[#141414] border-b border-[#262626] rounded-none px-2 shrink-0">
                <TabsTrigger value="chat" className="text-xs font-ibm data-[state=active]:bg-[#262626] data-[state=active]:text-white" data-testid="tab-chat">
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Chat
                </TabsTrigger>
                <TabsTrigger value="search" className="text-xs font-ibm data-[state=active]:bg-[#262626] data-[state=active]:text-white" data-testid="tab-search">
                  <Search className="w-3.5 h-3.5 mr-1.5" /> Search
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="flex-1 mt-0 min-h-0">
                <ChatInterface />
              </TabsContent>
              <TabsContent value="search" className="flex-1 mt-0 min-h-0">
                <SearchPanel />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop chat */}
          <div className="hidden lg:flex flex-col flex-1 min-h-0">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
}
